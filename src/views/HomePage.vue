<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="page-shell">
        <header class="app-header">
          <div class="brand-icon" aria-hidden="true">
            <IonIcon :icon="keyOutline" />
          </div>
          <div>
            <p class="eyebrow">ON-DEVICE CRYPTOGRAPHY</p>
            <h1>SECTEXT</h1>
            <p>Encrypt and decrypt text directly on your device.</p>
          </div>
          <span class="local-badge"><i></i> Offline</span>
        </header>

        <section class="cipher-card" aria-label="Text cipher tool">
          <div class="mode-switch" role="group" aria-label="Operation">
            <button
              type="button"
              :class="{ active: mode === 'encrypt' }"
              data-testid="encrypt-mode"
              @click="setMode('encrypt')"
            >
              <IonIcon :icon="lockClosedOutline" />
              Encrypt
            </button>
            <button
              type="button"
              :class="{ active: mode === 'decrypt' }"
              data-testid="decrypt-mode"
              @click="setMode('decrypt')"
            >
              <IonIcon :icon="lockOpenOutline" />
              Decrypt
            </button>
          </div>

          <div class="section-heading">
            <div>
              <span>01</span>
              <h2>Choose a cipher</h2>
            </div>
            <small>Modern and classical</small>
          </div>

          <div class="cipher-options" role="radiogroup" aria-label="Cipher">
            <button
              type="button"
              role="radio"
              :aria-checked="cipher === 'caesar'"
              :class="{ active: cipher === 'caesar' }"
              data-testid="caesar-cipher"
              @click="setCipher('caesar')"
            >
              <span class="cipher-letter">C</span>
              <span><strong>Caesar Cipher</strong><small>Shift each letter</small></span>
              <IonIcon :icon="cipher === 'caesar' ? checkmarkCircle : ellipseOutline" />
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="cipher === 'vigenere'"
              :class="{ active: cipher === 'vigenere' }"
              data-testid="vigenere-cipher"
              @click="setCipher('vigenere')"
            >
              <span class="cipher-letter">V</span>
              <span><strong>Vigenère Cipher</strong><small>Repeat a keyword</small></span>
              <IonIcon :icon="cipher === 'vigenere' ? checkmarkCircle : ellipseOutline" />
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="cipher === 'aes'"
              :class="{ active: cipher === 'aes' }"
              data-testid="aes-cipher"
              @click="setCipher('aes')"
            >
              <span class="cipher-letter">A</span>
              <span><strong>AES-256-GCM</strong><small>Password protected</small></span>
              <IonIcon :icon="cipher === 'aes' ? checkmarkCircle : ellipseOutline" />
            </button>
          </div>

          <div class="section-heading input-heading">
            <div>
              <span>02</span>
              <h2>{{ mode === 'encrypt' ? 'Enter plaintext' : 'Enter ciphertext' }}</h2>
            </div>
            <small>{{ sourceText.length.toLocaleString() }} characters</small>
          </div>

          <textarea
            v-model="sourceText"
            data-testid="source-text"
            :placeholder="sourcePlaceholder"
            rows="7"
            spellcheck="false"
            @input="clearFeedback"
          ></textarea>

          <div class="key-row">
            <div class="key-copy">
              <span>03</span>
              <div>
                <h2>{{ keyTitle }}</h2>
                <p>{{ keyDescription }}</p>
              </div>
            </div>

            <div v-if="cipher === 'caesar'" class="shift-control">
              <button type="button" aria-label="Decrease shift" @click="adjustShift(-1)">−</button>
              <input
                v-model.number="shift"
                data-testid="shift"
                type="number"
                min="1"
                max="25"
                inputmode="numeric"
                aria-label="Caesar shift"
                @input="clearFeedback"
                @keyup.enter="processText"
              />
              <button type="button" aria-label="Increase shift" @click="adjustShift(1)">+</button>
            </div>

            <div v-else-if="cipher === 'vigenere'" class="keyword-control">
              <IonIcon :icon="keyOutline" aria-hidden="true" />
              <input
                v-model="keyword"
                data-testid="keyword"
                type="text"
                placeholder="e.g. LEMON"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                @input="clearFeedback"
                @keyup.enter="processText"
              />
            </div>

            <div v-else class="password-control">
              <IonIcon :icon="keyOutline" aria-hidden="true" />
              <input
                v-model="password"
                data-testid="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter AES password"
                autocomplete="off"
                @input="clearFeedback"
                @keyup.enter="processText"
              />
              <button
                type="button"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="process-button"
            data-testid="process-button"
            :disabled="isProcessing || !canProcess"
            @click="processText"
          >
            <IonIcon :icon="mode === 'encrypt' ? lockClosedOutline : lockOpenOutline" />
            {{ isProcessing ? 'Working…' : mode === 'encrypt' ? 'Encrypt text' : 'Decrypt text' }}
            <IonIcon :icon="arrowForwardOutline" />
          </button>

          <p v-if="feedback" class="feedback" :class="feedback.type" role="status" data-testid="feedback">
            {{ feedback.text }}
          </p>

          <div class="result-divider"><span>RESULT</span></div>

          <div class="result-heading">
            <div>
              <span>04</span>
              <h2>{{ mode === 'encrypt' ? 'Ciphertext' : 'Plaintext' }}</h2>
            </div>
            <div class="result-actions">
              <button type="button" :disabled="!result" @click="useResult">
                <IonIcon :icon="swapVerticalOutline" /> Use as input
              </button>
              <button type="button" :disabled="!result" @click="copyResult">
                <IonIcon :icon="copyOutline" /> Copy
              </button>
            </div>
          </div>

          <textarea
            :value="result"
            data-testid="result-text"
            class="result-text"
            :placeholder="mode === 'encrypt' ? 'Encrypted text will appear here.' : 'Decrypted text will appear here.'"
            rows="6"
            readonly
          ></textarea>

          <button v-if="sourceText || keyword || password || result" type="button" class="clear-button" @click="clearAll">
            <IonIcon :icon="trashOutline" /> Clear everything
          </button>
        </section>

        <footer>
          <IonIcon :icon="cipher === 'aes' ? shieldCheckmarkOutline : informationCircleOutline" />
          <span>{{ footerText }}</span>
        </footer>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import {
  arrowForwardOutline,
  checkmarkCircle,
  copyOutline,
  ellipseOutline,
  eyeOffOutline,
  eyeOutline,
  informationCircleOutline,
  keyOutline,
  lockClosedOutline,
  lockOpenOutline,
  shieldCheckmarkOutline,
  swapVerticalOutline,
  trashOutline,
} from 'ionicons/icons'
import { decryptAes, encryptAes } from '@/services/aes'
import { caesarCipher, vigenereCipher, type CipherMode } from '@/services/ciphers'

type Cipher = 'caesar' | 'vigenere' | 'aes'
type Feedback = { type: 'success' | 'error'; text: string }

const mode = ref<CipherMode>('encrypt')
const cipher = ref<Cipher>('caesar')
const sourceText = ref('')
const shift = ref(3)
const keyword = ref('')
const password = ref('')
const showPassword = ref(false)
const isProcessing = ref(false)
const result = ref('')
const feedback = ref<Feedback | null>(null)

const canProcess = computed(() => {
  if (!sourceText.value) return false
  if (cipher.value === 'caesar') {
    return Number.isInteger(shift.value) && shift.value >= 1 && shift.value <= 25
  }
  if (cipher.value === 'vigenere') return Boolean(keyword.value.trim())
  return Boolean(password.value)
})

const keyTitle = computed(() => {
  if (cipher.value === 'caesar') return 'Set the shift'
  if (cipher.value === 'vigenere') return 'Enter a keyword'
  return 'Enter a password'
})

const keyDescription = computed(() => {
  if (cipher.value === 'caesar') return 'A number from 1 to 25'
  if (cipher.value === 'vigenere') return 'Letters A–Z only'
  return 'Required to decrypt this AES ciphertext'
})

const sourcePlaceholder = computed(() => {
  if (mode.value === 'encrypt') return 'Type or paste your message…'
  return cipher.value === 'aes'
    ? 'Paste a SECTEXT AES ciphertext…'
    : 'Type or paste the encrypted text…'
})

const footerText = computed(() => cipher.value === 'aes'
  ? 'AES-256-GCM provides authenticated encryption. Your text and password remain on this device.'
  : 'Caesar and Vigenère are historical ciphers for learning—not secure protection for sensitive data.')

function setMode(nextMode: CipherMode) {
  if (mode.value === nextMode) return
  mode.value = nextMode
  resetResult()
}

function setCipher(nextCipher: Cipher) {
  if (cipher.value === nextCipher) return
  cipher.value = nextCipher
  resetResult()
}

function adjustShift(amount: number) {
  const current = Number.isInteger(shift.value) ? shift.value : 3
  shift.value = Math.min(25, Math.max(1, current + amount))
  clearFeedback()
}

async function processText() {
  if (!canProcess.value || isProcessing.value) return

  isProcessing.value = true
  try {
    if (cipher.value === 'caesar') {
      result.value = caesarCipher(sourceText.value, shift.value, mode.value)
    } else if (cipher.value === 'vigenere') {
      result.value = vigenereCipher(sourceText.value, keyword.value, mode.value)
    } else {
      result.value = mode.value === 'encrypt'
        ? await encryptAes(sourceText.value, password.value)
        : await decryptAes(sourceText.value, password.value)
    }

    const cipherName = cipher.value === 'caesar'
      ? 'Caesar'
      : cipher.value === 'vigenere' ? 'Vigenère' : 'AES'
    feedback.value = {
      type: 'success',
      text: `${cipherName} ${mode.value === 'encrypt' ? 'encryption' : 'decryption'} complete.`,
    }
  } catch (error) {
    result.value = ''
    feedback.value = {
      type: 'error',
      text: error instanceof Error ? error.message : 'Unable to process the text.',
    }
  } finally {
    isProcessing.value = false
  }
}

async function copyResult() {
  if (!result.value) return

  try {
    await navigator.clipboard.writeText(result.value)
    feedback.value = { type: 'success', text: 'Result copied to the clipboard.' }
  } catch {
    feedback.value = { type: 'error', text: 'Clipboard access failed. Copy the result manually.' }
  }
}

function useResult() {
  if (!result.value) return
  sourceText.value = result.value
  mode.value = mode.value === 'encrypt' ? 'decrypt' : 'encrypt'
  resetResult()
}

function resetResult() {
  result.value = ''
  feedback.value = null
}

function clearFeedback() {
  feedback.value = null
}

function clearAll() {
  sourceText.value = ''
  result.value = ''
  keyword.value = ''
  password.value = ''
  showPassword.value = false
  shift.value = 3
  feedback.value = null
}
</script>

<style scoped>
ion-content {
  --background: #071019;
  color: #eaf6f4;
}

ion-content::part(background) {
  background:
    radial-gradient(circle at 12% 8%, rgba(38, 196, 181, 0.12), transparent 26rem),
    radial-gradient(circle at 88% 80%, rgba(51, 102, 184, 0.1), transparent 28rem),
    #071019;
}

.page-shell {
  width: min(900px, calc(100% - 32px));
  min-height: 100%;
  margin: 0 auto;
  padding: calc(34px + env(safe-area-inset-top)) 0 calc(24px + env(safe-area-inset-bottom));
}

.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.brand-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid rgba(77, 225, 208, 0.3);
  border-radius: 17px;
  background: rgba(41, 194, 180, 0.12);
  color: #50dfd1;
  font-size: 24px;
}

.eyebrow {
  margin: 0 0 3px;
  color: #4ed9cc;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.app-header h1 {
  margin: 0;
  color: #f3fbfb;
  font-size: 1.9rem;
  font-weight: 780;
  letter-spacing: -0.04em;
}

.app-header p:last-child {
  margin: 3px 0 0;
  color: #78909e;
  font-size: 0.82rem;
}

.local-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid rgba(109, 158, 168, 0.18);
  border-radius: 99px;
  color: #849ba8;
  font-size: 0.7rem;
  font-weight: 700;
}

.local-badge i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4cd7a4;
  box-shadow: 0 0 8px rgba(76, 215, 164, 0.7);
}

.cipher-card {
  padding: 22px;
  border: 1px solid rgba(124, 177, 186, 0.14);
  border-radius: 24px;
  background: rgba(12, 27, 40, 0.9);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-bottom: 24px;
  padding: 5px;
  border-radius: 14px;
  background: #07131e;
}

.mode-switch button {
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #708995;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 750;
  cursor: pointer;
}

.mode-switch button.active {
  background: #15343f;
  color: #62e3d8;
}

.section-heading,
.result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 9px;
}

.section-heading > div,
.result-heading > div:first-child,
.key-copy {
  display: flex;
  align-items: center;
  gap: 9px;
}

.section-heading span,
.result-heading > div:first-child > span,
.key-copy > span {
  color: #3abfb5;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.68rem;
  font-weight: 800;
}

h2 {
  margin: 0;
  color: #dbe9ec;
  font-size: 0.8rem;
  font-weight: 750;
}

.section-heading small {
  color: #5f7886;
  font-size: 0.67rem;
}

.cipher-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.cipher-options > button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 13px;
  border: 1px solid rgba(127, 178, 188, 0.14);
  border-radius: 14px;
  background: #081722;
  color: #718996;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.cipher-options > button.active {
  border-color: rgba(75, 220, 207, 0.52);
  background: rgba(21, 66, 71, 0.6);
}

.cipher-letter {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: #142936;
  color: #7fa0aa;
  font-family: Georgia, serif;
  font-weight: 800;
}

.active .cipher-letter {
  background: #1f5b5d;
  color: #68eadf;
}

.cipher-options strong,
.cipher-options small {
  display: block;
}

.cipher-options strong {
  color: #c8d8dc;
  font-size: 0.8rem;
}

.cipher-options small {
  margin-top: 3px;
  color: #657e8b;
  font-size: 0.65rem;
}

.cipher-options ion-icon {
  color: #3fcfc3;
  font-size: 18px;
}

.input-heading {
  margin-top: 22px;
}

textarea,
.keyword-control,
.password-control,
.shift-control {
  border: 1px solid rgba(127, 178, 188, 0.15);
  outline: none;
  background: #07131e;
  color: #e7f0f2;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

textarea {
  display: block;
  width: 100%;
  min-height: 145px;
  box-sizing: border-box;
  resize: vertical;
  padding: 15px;
  border-radius: 14px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.85rem;
  line-height: 1.55;
}

textarea:focus,
.keyword-control:focus-within,
.password-control:focus-within,
.shift-control:focus-within {
  border-color: rgba(79, 225, 214, 0.58);
  box-shadow: 0 0 0 3px rgba(79, 225, 214, 0.07);
}

textarea::placeholder,
input::placeholder {
  color: #4b6572;
}

.key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 17px;
  padding: 14px;
  border: 1px solid rgba(127, 178, 188, 0.1);
  border-radius: 14px;
  background: rgba(7, 19, 30, 0.52);
}

.key-copy p {
  margin: 3px 0 0;
  color: #627b88;
  font-size: 0.66rem;
}

.shift-control {
  display: grid;
  grid-template-columns: 38px 56px 38px;
  overflow: hidden;
  border-radius: 11px;
}

.shift-control button,
.shift-control input {
  height: 39px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #d7e7e9;
  font: inherit;
  text-align: center;
}

.shift-control button {
  color: #55d9cd;
  font-size: 1.1rem;
  cursor: pointer;
}

.shift-control input {
  min-width: 0;
  border-right: 1px solid rgba(127, 178, 188, 0.12);
  border-left: 1px solid rgba(127, 178, 188, 0.12);
  appearance: textfield;
}

.shift-control input::-webkit-inner-spin-button { appearance: none; }

.keyword-control,
.password-control {
  display: grid;
  width: min(250px, 52%);
  align-items: center;
  padding: 0 12px;
  border-radius: 11px;
}

.keyword-control { grid-template-columns: auto 1fr; }
.password-control { grid-template-columns: auto 1fr auto; }

.keyword-control > ion-icon,
.password-control > ion-icon { color: #52727e; }

.keyword-control input,
.password-control input {
  min-width: 0;
  height: 39px;
  padding: 0 9px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #e7f0f2;
  font: inherit;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.password-control input { text-transform: none; }

.password-control button {
  display: grid;
  padding: 7px;
  border: 0;
  place-items: center;
  background: transparent;
  color: #6f8995;
  font-size: 17px;
  cursor: pointer;
}

.process-button {
  display: grid;
  width: 100%;
  height: 52px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 0 17px;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(135deg, #38d1c5, #20aab2);
  color: #032126;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
}

.process-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.feedback {
  margin: 10px 0 0;
  font-size: 0.72rem;
  text-align: center;
}

.feedback.success { color: #55d7aa; }
.feedback.error { color: #ff8585; }

.result-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 21px 0 16px;
  color: #4d6875;
  font-size: 0.59rem;
  font-weight: 850;
  letter-spacing: 0.17em;
}

.result-divider::before,
.result-divider::after {
  height: 1px;
  flex: 1;
  background: rgba(127, 178, 188, 0.11);
  content: '';
}

.result-actions {
  display: flex;
  gap: 5px;
}

.result-actions button,
.clear-button {
  border: 0;
  background: transparent;
  color: #708995;
  font: inherit;
  cursor: pointer;
}

.result-actions button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border-radius: 7px;
  font-size: 0.67rem;
}

.result-actions button:not(:disabled):hover {
  background: rgba(79, 225, 214, 0.07);
  color: #5dded4;
}

.result-actions button:disabled { opacity: 0.3; cursor: default; }
.result-text { min-height: 120px; color: #9fc6ca; }

.clear-button {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 13px auto -4px;
  padding: 6px;
  font-size: 0.68rem;
}

.clear-button:hover { color: #df8181; }

footer {
  display: flex;
  max-width: 620px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 18px auto 0;
  color: #58717d;
  font-size: 0.67rem;
  line-height: 1.4;
  text-align: center;
}

footer ion-icon { flex: 0 0 auto; color: #477e83; font-size: 17px; }

@media (max-width: 620px) {
  .page-shell { width: min(100% - 22px, 900px); padding-top: calc(20px + env(safe-area-inset-top)); }
  .app-header { grid-template-columns: auto 1fr; }
  .local-badge { display: none; }
  .brand-icon { width: 47px; height: 47px; border-radius: 14px; }
  .app-header h1 { font-size: 1.6rem; }
  .app-header p:last-child { font-size: 0.73rem; }
  .cipher-card { padding: 15px; border-radius: 19px; }
  .cipher-options { grid-template-columns: 1fr; }
  .key-row { align-items: stretch; flex-direction: column; }
  .keyword-control, .password-control { width: 100%; box-sizing: border-box; }
  .shift-control { align-self: flex-start; }
  .result-actions button { font-size: 0; }
  .result-actions ion-icon { font-size: 17px; }
}
</style>
