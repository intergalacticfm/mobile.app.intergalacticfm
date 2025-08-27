cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-foreground-play.MusicService",
      "file": "plugins/cordova-plugin-foreground-play/www/music-service.js",
      "pluginId": "cordova-plugin-foreground-play",
      "clobbers": [
        "cordova.plugins.MusicService"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-foreground-play": "1.0.0"
  };
});