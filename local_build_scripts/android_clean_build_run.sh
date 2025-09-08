# use this for Android clean build process
cordova plugin remove cordova-plugin-foreground-play
cordova platform remove android
cordova clean
cordova platform add android
cordova plugin add ./cordova-plugin-foreground-play
cordova prepare android
cordova build android
