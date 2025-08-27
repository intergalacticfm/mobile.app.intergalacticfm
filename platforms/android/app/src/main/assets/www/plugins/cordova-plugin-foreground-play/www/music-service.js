cordova.define("cordova-plugin-foreground-play.MusicService", function(require, exports, module) {
var exec = require('cordova/exec');

var MusicService = {
    start: function (success, error) {
        exec(success, error, "MusicService", "start", []);
    },
    stop: function (success, error) {
        exec(success, error, "MusicService", "stop", []);
    },
    updateMetadata: function (title, artist, album, coverUrl, success, error) {
        exec(success, error, "MusicService", "updateMetadata", [title || "", artist || "", album || "", coverUrl || ""]);
    },
    setPlaying: function (isPlaying, success, error) {
        exec(success, error, "MusicService", "setPlaying", [!!isPlaying]);
    },
    play: function () {
        exec(null, null, 'MusicServicePlugin', 'play', []);
    },

    pause: function () {
        exec(null, null, 'MusicServicePlugin', 'pause', []);
    },

    next: function () {
        exec(null, null, 'MusicServicePlugin', 'next', []);
    },

    previous: function () {
        exec(null, null, 'MusicServicePlugin', 'prev', []);
    },

    onEvent: function (callback) {
        // callback riceve eventi 'next' o 'prev'
        document.addEventListener('MusicServiceEvent', function (e) {
            callback(e.detail);
        }, false);
    },

    _sendEvent: function (eventName) {
        var evt = new CustomEvent('MusicServiceEvent', {
            detail: eventName
        });
        document.dispatchEvent(evt);
    }
};

module.exports = MusicService;


var exec = require('cordova/exec');

});
