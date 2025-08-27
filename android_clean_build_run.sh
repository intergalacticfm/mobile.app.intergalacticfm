# use this for android clean build process
cordova plugin remove cordova-plugin-foreground-play
cordova platform remove android
cordova clean
cordova platform add android
cordova plugin add /YOUR_PATH/cordova-plugin-foreground-play
cordova prepare android
cordova build android
cordova run android
