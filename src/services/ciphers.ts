export type CipherMode = 'encrypt' | 'decrypt'

function shiftLetter(character: string, shift: number): string {
  const code = character.charCodeAt(0)
  const base = code >= 65 && code <= 90 ? 65 : code >= 97 && code <= 122 ? 97 : null

  if (base === null) return character

  return String.fromCharCode(base + ((code - base + shift + 26) % 26))
}

export function caesarCipher(text: string, shift: number, mode: CipherMode): string {
  if (!Number.isInteger(shift) || shift < 1 || shift > 25) {
    throw new Error('Enter a whole-number shift from 1 to 25.')
  }

  const directedShift = mode === 'decrypt' ? -shift : shift
  return Array.from(text, (character) => shiftLetter(character, directedShift)).join('')
}

export function vigenereCipher(text: string, keyword: string, mode: CipherMode): string {
  const normalizedKeyword = keyword.trim()

  if (!normalizedKeyword || !/^[A-Za-z]+$/.test(normalizedKeyword)) {
    throw new Error('Enter a keyword containing letters A–Z only.')
  }

  const keyShifts = Array.from(
    normalizedKeyword.toLowerCase(),
    (letter) => letter.charCodeAt(0) - 97,
  )
  let keyIndex = 0

  return Array.from(text, (character) => {
    if (!/[A-Za-z]/.test(character)) return character

    const direction = mode === 'decrypt' ? -1 : 1
    const transformed = shiftLetter(
      character,
      keyShifts[keyIndex % keyShifts.length] * direction,
    )
    keyIndex += 1
    return transformed
  }).join('')
}

