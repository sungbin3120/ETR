# Android Packaging

This app is configured as a Capacitor Android project.

## Current Package

- App ID: `com.sungbinstudio.numberreadercalculator`
- App name: `Number Reader Calculator`
- Web build directory: `out`
- Android project: `android/`
- Synced web assets: `android/app/src/main/assets/public`
- Play Store icon: `public/play-store-icon.png` (`512px x 512px`, 32-bit PNG)
- Android launcher icon resource: `android/app/src/main/res/drawable/app_icon.png`

## Commands

```powershell
npm.cmd run quality:test
npm.cmd run typecheck
npm.cmd run build:android
```

After Java and Android SDK are installed:

```powershell
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

`assembleDebug` creates a debug APK. `bundleRelease` creates a release AAB, but Play Store upload still requires release signing.

## Local Build Requirement

Gradle currently needs a JDK on this machine. If Android Studio is installed, use its bundled JDK or install JDK 21 and set `JAVA_HOME`.
