# Syncmaster Mobile App

This is a Kotlin Multiplatform (KMP) project using Compose Multiplatform for the UI.

## Project Structure
*   **composeApp**: The shared code and Android specific code.
    *   `src/commonMain`: Shared UI and logic (Compose).
    *   `src/androidMain`: Android specific configuration.
    *   `src/iosMain`: iOS specific bindings.
*   **iosApp**: (Placeholder) Platform specific iOS project.

## How to Run

### Android
Open this `mobile` directory in **Android Studio**. It should automatically detect the Gradle configuration and allow you to run the `composeApp` on an Android emulator or device.

### iOS
To run the iOS app, you need a Mac with Xcode.
1.  Open the `iosApp` folder (you may need to generate the Xcode project if not present, commonly done via KMP wizard or manually linking the framework).
2.  Ensure `cocoapods` or direct framework embedding is configured if you expand this.
3.  For now, the logic is ready in `iosMain`, but the Xcode project integration requires manual setup or using KMP Wizard to generate the `.xcodeproj`.

## Configuration
Sensitive keys and configurations should be placed in `local.properties` (which is git-ignored) and read at build time or runtime.
