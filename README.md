# Intergalactic FM - Mobile App

This is the official Intergalactic FM mobile application, built with [Apache Cordova](https://cordova.apache.org/).  
The app is a hybrid webapp: the main logic runs inside a 'WebView', with native plugins (Android/iOS) for background music playback, media notifications, and system integration.

## How Cordova works

Cordova allows you to package a web application (HTML, CSS, JavaScript) as a native app for Android and iOS.  
Build process overview:
1. The webapp ('/www') is copied into the native project.
2. Cordova embeds a 'WebView' to load the '/www' content.
3. Plugins provide JavaScript → native bridges (e.g., audio playback, notifications).
4. A Gradle project is generated for Android, and an Xcode project for iOS.
5. From there you can build an APK/AAB (Android) or IPA (iOS).

## Features

- Cordova wrapper around a web app
- Custom MusicPlaybackService for Android
- Media metadata updates (title, artist, album, cover art)
- Foreground service with proper lockscreen integration
- Ready for release on Google Play Store and Apple App Store


## Quick Start

### Prerequisites

- Node.js (>= 16.x recommended)
- npm (>= 8.x)
- Cordova CLI ('npm install -g cordova')
- Android Studio (for Android builds)
- Xcode with CocoaPods (for iOS builds, macOS only)


### Project Setup

# Clone this repository
- git clone ##REPO_URL##
- cd cordova-music-app

# Install dependencies
npm install

# Add platforms
- cordova platform add android
- cordova platform add ios

# Add plugin (included in local path)
cordova plugin add ./cordova-plugin-foreground-play

### Building the App

#### Android
- cordova prepare androir
- cordova build android

This:
- Copies your web app from 'www/' into 'platforms/android/app/src/main/assets/www/'
- Compiles Java sources (including 'MusicService' and 'MusicPlaybackService')

#### iOS
- cordova prepare ios
- cordova build ios

This:
- Copies your web app into the iOS project structure
- Integrates plugins and Objective-C/Swift code
- Produces an '.xcworkspace' file you can open in Xcode to build/run

## Environment Configuration

### Android
1. Install [Android Studio](https://developer.android.com/studio).
2. Ensure **Android SDK Platform** and **Build Tools** are installed.
3. Configure 'JAVA_HOME' and 'ANDROID_HOME' environment variables.
4. Connect a device or start an emulator:
   cordova run android

### iOS (macOS only)
1. Install [Xcode](https://developer.apple.com/xcode/).
2. Install CocoaPods:
   brew install cocoapods
3. Open the generated project:
   open platforms/ios/YourApp.xcworkspace
4. Build & run from Xcode.

## Custom Plugin Integration

The Android app integrates a MusicPlaybackService via a Cordova plugin.

- 'MusicService.java': Cordova entry point that receives JS calls and starts/stops the service.
- 'MusicPlaybackService.java': Foreground service managing media metadata, notifications, and lockscreen integration.
- Metadata is updated by calling from JavaScript:

- cordova.plugins.MusicService.start();
- cordova.plugins.MusicService.updateMetadata("Song Title", "Artist", "Album", "cover.png");
- cordova.plugins.MusicService.setPlaying(true);

Assets for background metadata cover are retrieved from local, not from the web.

## License
MIT

