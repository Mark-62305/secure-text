import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'sectext-edge-'))
const port = 9223
const browser = spawn(edge, [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank',
])

try {
  let targets
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const page = targets?.find((target) => target.type === 'page')
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
    message.error ? reject(new Error(message.error.message)) : resolve(message.result)
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
      expression: "Boolean(document.querySelector('.gallery-shell'))",
    })
    if (ready.result.value) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const evaluation = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const text = document.body.innerText;
      const checks = [
        ['Gallery rendered', Boolean(document.querySelector('.gallery-shell'))],
        ['Title rendered', text.includes('Keep life in frame.')],
        ['Camera action rendered', text.includes('Take photo')],
        ['Device picker rendered', text.includes('Add from device')],
        ['Empty state rendered', text.includes('Your gallery is ready')],
      ];
      return checks.map(([name, passed]) => ({ name, passed }));
    })()`,
  })
  if (evaluation.exceptionDetails) throw new Error(evaluation.exceptionDetails.text)

  const results = evaluation.result.value
  for (const test of results) console.log(`${test.passed ? 'PASS' : 'FAIL'} ${test.name}`)
  if (results.some((test) => !test.passed)) process.exitCode = 1
  socket.close()
} finally {
  browser.kill()
}
