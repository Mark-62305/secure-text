# SECTEXT

SECTEXT is a Vue/Ionic photo gallery that captures photos or imports them from the device and keeps them available across app launches.

## Storage

- Photo bytes are saved with Capacitor Filesystem under the private `Data/photos` directory.
- Gallery metadata is stored with Capacitor Preferences.
- In a browser, Capacitor uses IndexedDB-backed file storage and local storage preferences.
- On Android, files and preferences remain private to the app and are removed when the app is uninstalled.

## Run in a browser

```bash
npm install
npm run dev
```

Camera capture requires browser permission and a secure context (`localhost` or HTTPS). The device picker works as a fallback where a live camera is unavailable.

## Build and sync Android

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The local machine must have an Android SDK configured through `ANDROID_HOME` or `android/local.properties`. The debug APK is generated under `android/app/build/outputs/apk/debug/`.
