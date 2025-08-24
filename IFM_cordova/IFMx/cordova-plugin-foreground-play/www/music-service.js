var exec = require('cordova/exec');

var MusicService = {
    start: function (success, error) {
        exec(success, error, "MusicService", "start", []);
    },
    stop: function (success, error) {
        exec(success, error, "MusicService", "stop", []);
    }
};

module.exports = MusicService;
