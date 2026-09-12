import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'ionic-calculator-edge-'))
const port = 9223
const browser = spawn(edge, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
])

try {
  let pages
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const page = pages?.find((target) => target.type === 'page')
  if (!page?.webSocketDebuggerUrl) throw new Error('Could not connect to Edge')

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id || !pending.has(message.id)) return
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })

  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const ready = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: "Boolean(document.querySelector('.calculator-button'))",
    })
    if (ready.result.value) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const evaluation = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const delay = () => new Promise(resolve => setTimeout(resolve, 30));
      const button = label => [...document.querySelectorAll('ion-button')]
        .find(element => element.textContent.trim() === label);
      const press = async (...labels) => {
        for (const label of labels) {
          const element = button(label);
          if (!element) throw new Error('Missing button: ' + label);
          element.click();
          await delay();
        }
      };
      const display = () => document.querySelector('.display').textContent.trim();
      const cases = [
        [['7', '+', '3', '='], '10', 'Addition'],
        [['1', '2', '×', '5', '='], '60', 'Multiplication'],
        [['1', '0', '0', '÷', '4', '='], '25', 'Division'],
        [['2', '5', '−', '3', '0', '='], '-5', 'Subtraction'],
        [['1', '2', '.', '5', '+', '3', '.', '5', '='], '16', 'Decimal'],
        [['1', '0', '÷', '0', '='], 'Error', 'Divide by zero'],
        [['1', '2', '3', '4', '5', '⌫'], '1234', 'Backspace'],
      ];
      const results = [];
      for (const [keys, expected, name] of cases) {
        const clear = button('C');
        if (!clear) throw new Error('Calculator did not render at ' + location.href + ': ' + document.body.innerText);
        clear.click();
        await delay();
        await press(...keys);
        const actual = display();
        results.push({ name, expected, actual, passed: actual === expected });
      }
      return results;
    })()`,
  })

  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text)
  }
  const results = evaluation.result.value
  for (const test of results) {
    console.log(`${test.passed ? 'PASS' : 'FAIL'} ${test.name}: ${test.actual}`)
  }
  if (results.some((test) => !test.passed)) process.exitCode = 1
  socket.close()
} finally {
  browser.kill()
}
