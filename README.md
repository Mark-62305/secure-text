# SECTEXT

SECTEXT is a Vue/Ionic application for encrypting and decrypting text with AES-256-GCM, Caesar, and Vigenère. All processing happens locally on the device.

## Ciphers

- Caesar shifts English letters by a number from 1 to 25.
- Vigenère applies a repeating alphabetic keyword.
- AES-256-GCM derives a key from a password with PBKDF2-SHA-256 and authenticates the ciphertext.
- Letter case is preserved, while spaces, punctuation, numbers, and non-Latin characters remain unchanged.

Caesar and Vigenère are intended for learning and are not secure for sensitive information. Use AES with a strong, unique password when security matters.

## Run in a browser

```bash
npm install
npm run dev
```

## Build and sync Android

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The local machine must have an Android SDK configured through `ANDROID_HOME` or `android/local.properties`. The debug APK is generated under `android/app/build/outputs/apk/debug/`. The GitHub Actions workflow uploads it as `SECTEXT.apk`.
