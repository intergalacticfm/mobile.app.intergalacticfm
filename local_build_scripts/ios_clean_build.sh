# use this for iOS clean build process

# if plugin was already installed, otherwise skip
# cordova plugin remove cordova-plugin-foreground-play
cordova platform remove ios
cordova clean
cordova platform add ios@latest
cordova plugin add ./cordova-plugin-foreground-play
cordova prepare ios
cordova build ios # add --emulator if no apple dev membership is present
