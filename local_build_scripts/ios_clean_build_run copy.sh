# use this for iOS clean build process
cordova plugin remove cordova-plugin-foreground-play
cordova platform remove ios
cordova clean
cordova platform add ios
cordova plugin add ./cordova-plugin-foreground-play
cordova prepare ios
cordova build ios
