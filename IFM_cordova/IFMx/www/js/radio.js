var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
// where all streaming url and radio info are fetched from
const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 5000;
const NOW_PLAYING_REQUEST_PREFIX = 'https://www.intergalactic.fm/now-playing?channel=';
const NOW_PLAYING_PICTURE_REQUEST_PREFIX = 'https://www.intergalactic.fm/channel-content/';
const NOW_PLAYING_DIV_ID = 'nowPlaying';
const TRACK_META_DIV_ID = 'track-meta';
const NOW_PLAYING_DIV_EXT_ID = 'nowPlayingExt';
const NOW_PLAYING_COVER_DIV_ID = 'nowPlayingCover';
const EMPTY_VAL = '';
const META_TAGS_SPLIT_CHAR = '|';
const LINE_BREAK = '<br>';
const VJS_PLAY_CONTROL_CLASS = 'vjs-play-control';
const VJS_PLAYING_CLASS = 'vjs-playing';
const PAGE_TITLE_DEFAULT = 'Intergalactic FM';

/**
 * Radio class containing the state of our stations.
 * Includes all methods for playing, stopping, etc.
 * @param {Array} stations Array of objects with station details ({title, src, howl, ...}).
 */

const CBS_BUTTON_ID = 'cbsChannelButton';
const DF_BUTTON_ID = 'dfChannelButton';
const TDM_BUTTON_ID = 'tdmChannelButton';
const STATIONS_BUTTON_ID_LIST = [CBS_BUTTON_ID, DF_BUTTON_ID, TDM_BUTTON_ID];
const STOP_BUTTON_ID = 'stopButton';


// stop button
document.getElementById(STOP_BUTTON_ID).addEventListener("click", function () {
    reset();
    if (radio) {
        radio.stop();
    }
});

var Radio = function (stations) {
    var self = this;

    self.stations = stations;
    self.index = 0;

    // Setup the display for each station.
    for (var i = 0; i < self.stations.length; i++) {
        document.getElementById(STATIONS_BUTTON_ID_LIST[i]).addEventListener('click', function (index) {
            var isNotPlaying = (self.stations[index].howl && !self.stations[index].howl.playing());
            // Stop other sounds or the current one.
            radio.stop();
            // If the station isn't already playing or it doesn't exist, play it.
            if (isNotPlaying || !self.stations[index].howl) {
                radio.play(index);
            }
        }.bind(self, i));
    }
};

Radio.prototype = {
    /**
     * Play a station with a specific index.
     * @param  {Number} index Index in the array of stations.
     */
    play: function (index) {
        var self = this;
        var sound;

        index = typeof index === 'number' ? index : self.index;
        var data = self.stations[index];

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl;
        } else {
            sound = data.howl = new Howl({
                src: data.src,
                html5: true, // A live stream can only be played through HTML5 Audio.
                format: ['mp3', 'aac'],
                volume: 1
            });
        }

        // Begin playing the sound.
        sound.play();

        // Keep track of the index we are currently playing.
        self.index = index;
        selectedChannel = index + 1;
        currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + self.stations[index].title;
        getNowPlaying();

    },

    /**
     * Stop a station's live stream.
     */
    stop: function () {
        var self = this;

        // Get the Howl we want to manipulate.
        var sound = self.stations[self.index].howl;

        // Stop the sound.
        if (sound) {
            sound.unload();
        }
        reset();
    }
};

// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
var previousTrackTitle = EMPTY_VAL;
async function getNowPlaying() {
    try {
        const response = await fetch(currentNowPlayingUrl);
        const trackMetadata = await response.json();
        setTrackMetadata(trackMetadata);

        if (trackMetadata) {
            if (previousTrackTitle != trackMetadata.title) {
                var newTrack = trackMetadata.title;
                // new track
                feedNowPlaying(newTrack);
                previousTrackTitle = newTrack;
            }
        }
        nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    } catch (error) {
        console.log(error);
        displayMessage(error);
        reset();
    }
}

function setTrackMetadata(trackMetadata) {
    // example of structure of the return string "OMICRON - Positron | The Generation and Motion of a Pulse | Instinct Ambient | 1995 | US | Electronix Surveillance * Insta: @intergalacticfm *  "
    const trackMetadatas = trackMetadata.title.split('|');
    var artist_title = trackMetadatas[0];
    var artist = artist_title.split(' - ')[0].trim();
    var title = artist_title.split(' - ')[1].trim();
    var album = trackMetadatas[1].trim();
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: [
                {
                    src: "./icon.png",
                    sizes: "96x96",
                    type: "image/png",
            }
        ]
        });
    }

}

// populate the now playing html
function feedNowPlaying(title) {
    if (title) {
        var fields = title.split(META_TAGS_SPLIT_CHAR);
        var main = fields[0];
        var otherInfo = fields.slice(1);
        var otherFieldsProcessed = EMPTY_VAL;
        for (var i = 0; i < otherInfo.length; i++) {
            field = otherInfo[i];
            if (field && field.trim() !== EMPTY_VAL) {
                otherFieldsProcessed += otherInfo[i] + LINE_BREAK;
            }
        }
        feedHTML(NOW_PLAYING_DIV_ID, main);
        feedHTML(NOW_PLAYING_DIV_EXT_ID, otherFieldsProcessed);
        extractCoverFromChannelContent(title);
        // Get the modal
        var modal = document.getElementById("trackInfoModal");
        // Get the button that opens the modal
        var btn = document.getElementById("myBtn");

        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];

        // When the user clicks the button, open the modal 
        modal.style.display = "block";
        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        }

    }
}

/* cover and track info are fetched from intergalactic.fm, but need parsing */
async function extractCoverFromChannelContent(title) {
    var response = await fetch(NOW_PLAYING_PICTURE_REQUEST_PREFIX + selectedChannel);
    var body = await response.text();
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    var extractedCoverHTML = body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
    // clean IFM inherited website styling
    var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('this.onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="100%"').replace('height="100"', 'height="100%"');
    feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCleanCoverHTML);
    changeLockScreenPreviewImage(title, extractedCleanCoverHTML);
}

/* lock screen metadata */
// TODO: PARSE TRACK METADATA AND SET CORRECTLY
/* iOS code for artwork in lockscreen: iOS prevent the direct link from URL, it can be downloaded and used, but this consumes memory, we don't want this, so better to just use a static icon 
var coverPath = cordova.file.applicationDirectory + "www/icon.png";

// Converti in URL compatibile
if (!coverPath.startsWith("file://")) {
    coverPath = "file://" + coverPath;
}
MusicControls.create({
    track: "TEST TITLE IOS",
    artist: "TEST ARTIST IOS",
    cover: coverPath, // local asset
    // for URL cover: 'https://intergalactic.fm/themes/custom/ifm/logo.svg',
    isPlaying: true
});
*/

function changeLockScreenPreviewImage(title, cover) {

}

function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    selectedChannel = EMPTY_VAL;
    previousTrackTitle = EMPTY_VAL;
    document.title = PAGE_TITLE_DEFAULT;
    var modal = document.getElementById("trackInfoModal");
    modal.style.display = "none";
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
