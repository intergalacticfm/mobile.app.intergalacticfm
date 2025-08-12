// Cache references to DOM elements.
var elms = ['title0', 'title1', 'title2'];
var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
// where all streaming url and radio info are fetched from
const STATIONS_JSON_URL = 'https://intergalactic.fm/sd/stations.json';
const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 4000;
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
const PAGE_TITLE = 'Intergalactic FM';

elms.forEach(function (elm) {
    window[elm] = document.getElementById(elm);
});


/**
 * Radio class containing the state of our stations.
 * Includes all methods for playing, stopping, etc.
 * @param {Array} stations Array of objects with station details ({title, src, howl, ...}).
 */
var Radio = function (stations) {

    var self = this;

    if (!radio) {
        fetchStations();
    }

    self.stations = stations;
    self.index = 0;

    // Setup the display for each station.
    for (var i = 0; i < self.stations.length; i++) {
        window['title' + i].innerHTML = self.stations[i].title;
        window['title' + i].addEventListener('click', function (index) {
            var isNotPlaying = (self.stations[index].howl && !self.stations[index].howl.playing());

            // Stop other sounds or the current one.
            radio.stop();

            // If the station isn't already playing or it doesn't exist, play it.
            if (isNotPlaying || !self.stations[index].howl) {
                radio.play(index);
            }
        }.bind(self, i));
    }

    // stop button
    window['stopButton'].addEventListener("click", function () {
        if (radio) {
            radio.stop()
        }
    });
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

// Radio object, empty, to be filled with fetchStations()
var radio = new Radio([]);

/* requests stations info and stream url from IFM server STATIONS_JSON_URL */
async function fetchStations() {
    const response = await fetch(STATIONS_JSON_URL);
    const stationsJson = await response.json();
    //console.log("STATIONS");
    var cbsInfo = stationsJson.stations[0];
    var dfInfo = stationsJson.stations[1];
    var tdmInfo = stationsJson.stations[2];
    radio = new Radio([
        {
            title: cbsInfo.name,
            src: cbsInfo.url,
            howl: null
                },
        {
            title: dfInfo.name,
            src: dfInfo.url,
            howl: null
                },
        {
            title: tdmInfo.name,
            src: tdmInfo.url,
            howl: null
                    }
                ]);
}


// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
var previousTrackTitle = EMPTY_VAL;
async function getNowPlaying() {
    try {
        const response = await fetch(currentNowPlayingUrl);
        const trackMetadata = await response.json();
        if (trackMetadata) {
            var title = trackMetadata.title;
            if (previousTrackTitle != title) {
                // new track
                feedNowPlaying(title);
                previousTrackTitle = title;
                document.title = title;
            }
        }
    } catch (error) {
        console.log(error);
        reset();
    }
    nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
}

// populate the now playing html
function feedNowPlaying(value) {
    if (value) {
        var fields = value.split(META_TAGS_SPLIT_CHAR);
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
        extractCoverFromChannelContent();
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

    } else {
        reset();
    }
}

/* cover and track info are fetched from intergalactic.fm, but need parsing */
async function extractCoverFromChannelContent() {
    var response = await fetch(NOW_PLAYING_PICTURE_REQUEST_PREFIX + selectedChannel);
    var body = await response.text();
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    var extractedCoverHTML = body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
    // clean IFM inherited website styling
    var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('this.onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="100%"').replace('height="100"', 'height="100%"');
    feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCleanCoverHTML);
}

function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    selectedChannel = EMPTY_VAL;
    previousTrackTitle = EMPTY_VAL;
    document.title = PAGE_TITLE;
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
