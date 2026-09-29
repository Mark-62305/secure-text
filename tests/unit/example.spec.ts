import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, test } from 'vitest'
import { decryptAes, encryptAes } from '@/services/aes'
import { caesarCipher, vigenereCipher } from '@/services/ciphers'

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: webcrypto,
  })
})

describe('Caesar cipher', () => {
  test('encrypts and decrypts using the selected shift', () => {
    const encrypted = caesarCipher('Attack at Dawn!', 3, 'encrypt')

    expect(encrypted).toBe('Dwwdfn dw Gdzq!')
    expect(caesarCipher(encrypted, 3, 'decrypt')).toBe('Attack at Dawn!')
  })

  test('preserves non-letter characters and validates the shift', () => {
    expect(caesarCipher('Room 101 — 北京', 5, 'encrypt')).toBe('Wttr 101 — 北京')
    expect(() => caesarCipher('hello', 26, 'encrypt')).toThrow('1 to 25')
  })
})
describe('Vigenère cipher', () => {
  test('matches the standard Vigenère test vector', () => {
    const encrypted = vigenereCipher('ATTACKATDAWN', 'LEMON', 'encrypt')

    expect(encrypted).toBe('LXFOPVEFRNHR')
    expect(vigenereCipher(encrypted, 'LEMON', 'decrypt')).toBe('ATTACKATDAWN')
  })

  test('preserves case and ignores punctuation when advancing the key', () => {
    const encrypted = vigenereCipher('Meet @ nine.', 'KEY', 'encrypt')

    expect(encrypted).toBe('Wicd @ rgxi.')
    expect(vigenereCipher(encrypted, 'KEY', 'decrypt')).toBe('Meet @ nine.')
  })

  test('requires an alphabetic keyword', () => {
    expect(() => vigenereCipher('hello', 'key 2', 'encrypt')).toThrow('letters A–Z only')
  })
})

describe('AES-256-GCM', () => {
  test('encrypts and decrypts Unicode text with a password', async () => {
    const plaintext = 'Confidential message — 北京 🔐'
    const ciphertext = await encryptAes(plaintext, 'Strong-password!42')

    expect(ciphertext).toMatch(/^sectext:aes-gcm:v1:/)
    expect(ciphertext).not.toContain(plaintext)
    await expect(decryptAes(ciphertext, 'Strong-password!42')).resolves.toBe(plaintext)
  })

  test('uses a fresh salt and IV for every encryption', async () => {
    const first = await encryptAes('same text', 'same password')
    const second = await encryptAes('same text', 'same password')

    expect(first).not.toBe(second)
  })

  test('rejects an incorrect password', async () => {
    const ciphertext = await encryptAes('secret', 'correct password')

    await expect(decryptAes(ciphertext, 'wrong password')).rejects.toThrow('Unable to decrypt')
  })

  test('rejects unsupported ciphertext', async () => {
    await expect(decryptAes('not ciphertext', 'password')).rejects.toThrow(
      'not a supported SECTEXT AES ciphertext',
    )
  })
})
