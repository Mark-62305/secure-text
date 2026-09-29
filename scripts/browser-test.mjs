import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profile = await mkdtemp(join(tmpdir(), 'sectext-edge-'))
const port = 9223 + Math.floor(Math.random() * 1000)
const browser = spawn(edge, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
])

try {
  let targets
  for (let attempt = 0; attempt < 60; attempt += 1) {
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
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })

  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  let appReady = false
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: "Boolean(document.querySelector('[data-testid=source-text]'))",
    })
    if (ready.result.value) {
      appReady = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!appReady) throw new Error('SECTEXT did not render in Edge')

  const evaluation = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const field = selector => document.querySelector(selector);
      const setValue = (selector, value) => {
        const element = field(selector);
        if (!element) throw new Error('Missing element: ' + selector);
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const waitFor = async predicate => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          if (predicate()) return;
          await new Promise(resolve => setTimeout(resolve, 40));
        }
        throw new Error('Timed out waiting for result');
      };

      setValue('[data-testid=source-text]', 'Attack at Dawn!');
      setValue('[data-testid=shift]', '3');
      await waitFor(() => !field('[data-testid=process-button]').disabled);
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value === 'Dwwdfn dw Gdzq!');
      const caesar = field('[data-testid=result-text]').value;

      field('[data-testid=decrypt-mode]').click();
      setValue('[data-testid=source-text]', caesar);
      await new Promise(resolve => setTimeout(resolve, 0));
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value === 'Attack at Dawn!');
      const caesarRoundTrip = field('[data-testid=result-text]').value === 'Attack at Dawn!';

      field('[data-testid=vigenere-cipher]').click();
      field('[data-testid=encrypt-mode]').click();
      await waitFor(() => Boolean(field('[data-testid=keyword]')));
      setValue('[data-testid=source-text]', 'ATTACKATDAWN');
      setValue('[data-testid=keyword]', 'LEMON');
      await waitFor(() => !field('[data-testid=process-button]').disabled);
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value === 'LXFOPVEFRNHR');
      const vigenere = field('[data-testid=result-text]').value;

      field('[data-testid=decrypt-mode]').click();
      setValue('[data-testid=source-text]', vigenere);
      await new Promise(resolve => setTimeout(resolve, 0));
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value === 'ATTACKATDAWN');
      const vigenereRoundTrip = field('[data-testid=result-text]').value === 'ATTACKATDAWN';

      field('[data-testid=aes-cipher]').click();
      field('[data-testid=encrypt-mode]').click();
      await waitFor(() => Boolean(field('[data-testid=password]')));
      setValue('[data-testid=source-text]', 'Browser AES message');
      setValue('[data-testid=password]', 'Strong-password!42');
      await new Promise(resolve => setTimeout(resolve, 0));
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value.startsWith('sectext:aes-gcm:v1:'));
      const aesCiphertext = field('[data-testid=result-text]').value;

      field('[data-testid=decrypt-mode]').click();
      setValue('[data-testid=source-text]', aesCiphertext);
      await new Promise(resolve => setTimeout(resolve, 0));
      field('[data-testid=process-button]').click();
      await waitFor(() => field('[data-testid=result-text]').value === 'Browser AES message');

      return {
        caesar: caesar === 'Dwwdfn dw Gdzq!',
        caesarRoundTrip,
        vigenere: vigenere === 'LXFOPVEFRNHR',
        roundTrip: vigenereRoundTrip,
        aesFormat: aesCiphertext.startsWith('sectext:aes-gcm:v1:'),
        aesRoundTrip: field('[data-testid=result-text]').value === 'Browser AES message',
      };
    })()`,
  })

  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text)
  }

  const results = evaluation.result.value
  console.log(`${results.caesar ? 'PASS' : 'FAIL'} Caesar encryption`)
  console.log(`${results.caesarRoundTrip ? 'PASS' : 'FAIL'} Caesar decryption`)
  console.log(`${results.vigenere ? 'PASS' : 'FAIL'} Vigenère encryption`)
  console.log(`${results.roundTrip ? 'PASS' : 'FAIL'} Vigenère decryption`)
  console.log(`${results.aesFormat ? 'PASS' : 'FAIL'} AES encryption`)
  console.log(`${results.aesRoundTrip ? 'PASS' : 'FAIL'} AES decryption`)
  if (!results.caesar || !results.caesarRoundTrip || !results.vigenere || !results.roundTrip || !results.aesFormat || !results.aesRoundTrip) process.exitCode = 1
  socket.close()
} finally {
  browser.kill()
}
