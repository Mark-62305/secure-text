const FORMAT_PREFIX = 'sectext:aes-gcm:v1'
const PBKDF2_ITERATIONS = 250_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }

  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('The AES ciphertext format is invalid.')
  }

  try {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  } catch {
    throw new Error('The AES ciphertext format is invalid.')
  }
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function requirePassword(password: string): void {
  if (!password) throw new Error('Enter an AES password.')
}

export async function encryptAes(plaintext: string, password: string): Promise<string> {
  requirePassword(password)

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return [
    FORMAT_PREFIX,
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(encrypted)),
  ].join(':')
}

export async function decryptAes(payload: string, password: string): Promise<string> {
  requirePassword(password)

  const parts = payload.trim().split(':')
  if (parts.length !== 6 || parts.slice(0, 3).join(':') !== FORMAT_PREFIX) {
    throw new Error('This is not a supported SECTEXT AES ciphertext.')
  }

  const salt = base64ToBytes(parts[3])
  const iv = base64ToBytes(parts[4])
  const encrypted = base64ToBytes(parts[5])

  if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH) {
    throw new Error('The AES ciphertext format is invalid.')
  }

  try {
    const key = await deriveKey(password, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    )
    return decoder.decode(decrypted)
  } catch {
    throw new Error('Unable to decrypt. Check the password and ciphertext.')
  }
}
