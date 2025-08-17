var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 4000;
const NOW_PLAYING_REQUEST_PREFIX = 'https://www.intergalactic.fm/now-playing?channel=';
const NOW_PLAYING_PICTURE_REQUEST_PREFIX = 'https://www.intergalactic.fm/channel-content/';
const NOW_PLAYING_DIV_ID = 'nowPlaying';
const TRACK_META_DIV_ID = 'track-meta';
const NOW_PLAYING_DIV_EXT_ID = 'nowPlayingExt';
const NOW_PLAYING_COVER_DIV_ID = 'nowPlayingCover';
const EMPTY_VAL = '';
const SPACE = ' ';
const META_TAGS_SPLIT_CHAR = '|';
const LINE_BREAK = '<br>';
const PAGE_TITLE_DEFAULT = 'Intergalactic FM';
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

/**
 * Radio class containing the state of the stations(channels).
 * Includes all methods for playing, stopping, etc.
 * @param {Array} stations Array of objects with station details ({title, src, howl, ...}).
 */

var stations;

var Radio = function (stations) {
    var self = this;
    self.stations = stations;
    self.index = 0;

    // Setup the onClick for each channel.
    for (var i = 0; i < self.stations.length; i++) {
        document.getElementById(STATIONS_BUTTON_ID_LIST[i]).addEventListener('click', function (index) {
            var isNotPlaying = (self.stations[index].howl && !self.stations[index].howl.playing());
            // Stop other sounds or the current one.
            radio.stop();
            // If the channel isn't already playing or it doesn't exist, play it.
            if (isNotPlaying || !self.stations[index].howl) {
                radio.play(index);
            }
        }.bind(self, i));
    }
};

Radio.prototype = {
    /**
     * Play a channel with a specific index.
     * @param  {Number} index Index in the array of stations.
     */
    play: function (index) {
        try {
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
            setLockScreenControls(index);

        } catch (error) {
            console.log(error);
            displayMessage(error);
            reset();
        }


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
    },

    changeVolume: function (volumeAmount) {
        var self = this;
        var sound = self.stations[self.index].howl;
        if (sound) {
            sound.volume(volumeAmount);
        }
    },

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
                previousTrackTitle = newTrack;
                feedNowPlaying(newTrack);
            }
        }
        nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    } catch (error) {
        displayMessage(error);
        reset();
    }
}

var nowPlayingMetadatas = {
    "artist": "",
    "title": "",
    "album": "",
    "label": "",
    "year": "",
    "country": "",
    "ifmxLog": ""
}

const COVER_PATH = "img/logo128.png";
const CBS_COVER_PATH = "img/cbs128.png";
const DF_COVER_PATH = "img/df128.png";
const TDM_COVER_PATH = "img/tdm128.png";
const COVER_PATH_ARRAY = [CBS_COVER_PATH, DF_COVER_PATH, TDM_COVER_PATH];

function setTrackMetadata(trackMetadata) {
    // example of structure of the return string "OMICRON - Positron | The Generation and Motion of a Pulse | Instinct Ambient | 1995 | US | Electronix Surveillance * Insta: @intergalacticfm *  "
    if (trackMetadata) {
        const trackMetadatas = trackMetadata.title.split('|');
        var artist_title = trackMetadatas[0];

        var artist = artist_title.split(' - ')[0].trim();
        var title = artist_title.split(' - ')[1].trim();
        var album = trackMetadatas[1] ? trackMetadatas[1].trim() : EMPTY_VAL;
        var label = trackMetadatas[2] ? trackMetadatas[2].trim() : EMPTY_VAL;
        var year = trackMetadatas[3] ? trackMetadatas[3].trim() : EMPTY_VAL;
        var country = trackMetadatas[4] ? trackMetadatas[4].trim() : EMPTY_VAL;
        var ifmxLog = trackMetadatas[5] ? trackMetadatas[5].trim() : DEFAULT_SCROLLING_TEXT;

        nowPlayingMetadatas.artist = artist;
        nowPlayingMetadatas.title = title;
        nowPlayingMetadatas.album = album;
        nowPlayingMetadatas.label = label;
        nowPlayingMetadatas.year = year;
        nowPlayingMetadatas.country = country;

        setScrollingText(ifmxLog);
        var coverPath = COVER_PATH_ARRAY[selectedChannel - 1];

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: album,
                artwork: [{
                    src: coverPath
                }]
            });
        }
    }


}

// populate the now playing html
function feedNowPlaying(title) {

    var fields = title.split(META_TAGS_SPLIT_CHAR);
    var main = nowPlayingMetadatas.artist + " - " + nowPlayingMetadatas.title;
    var otherInfo = (nowPlayingMetadatas.album !== '' ? nowPlayingMetadatas.album : EMPTY_VAL) +
        (nowPlayingMetadatas.year !== '' ? " - " + nowPlayingMetadatas.year : EMPTY_VAL) +
        (nowPlayingMetadatas.country !== '' ? " , " + nowPlayingMetadatas.country : EMPTY_VAL);

    feedHTML(NOW_PLAYING_DIV_ID, main);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, otherInfo);
    extractCoverFromChannelContent();


    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    // Get the button that opens the modal
    var btn = document.getElementById("myBtn");
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks the button, open the modal 
    hideElement(homeContainer);
    showElement(modal);
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        hideElement(modal);
        showElement(homeContainer);
    }

}

function showElement(element) {
    element.style.display = "block";
}

function hideElement(element) {
    element.style.display = "none";
}

var previousBody = EMPTY_VAL;
/* cover and track info are fetched from intergalactic.fm, but need parsing */
async function extractCoverFromChannelContent() {
    var response = await fetch(NOW_PLAYING_PICTURE_REQUEST_PREFIX + selectedChannel);
    var body = await response.text();
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    var extractedCoverHTML = body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
    var whileGuard = 0;
    while (body == previousBody && whileGuard < 20) {
        /* main website updates the cover with some delay, so we might request it multiple times before getting the updated one */
        setTimeout(function () {
            response = fetch(NOW_PLAYING_PICTURE_REQUEST_PREFIX + selectedChannel);
            body = response.text();
        }, 2000);
        whileGuard++;
    }
    previousBody = body;

    // clean IFM inherited website styling
    var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('this.onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="80%"').replace('height="100"', 'height="80%"');
    feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCleanCoverHTML);
}

function setLockScreenControls(index) {
    if (index == 0) {
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            document.getElementById(STATIONS_BUTTON_ID_LIST[index + 1]).click();
        });
    } else
    if (index == 1) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            document.getElementById(STATIONS_BUTTON_ID_LIST[index - 1]).click();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            document.getElementById(STATIONS_BUTTON_ID_LIST[index + 1]).click();
        });
    } else
    if (index == 2) {
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            document.getElementById(STATIONS_BUTTON_ID_LIST[index - 1]).click();
        });
    } else {
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
    }
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
    var homeContainer = document.getElementById('container');
    hideElement(modal);
    showElement(homeContainer);
    setScrollingText(DEFAULT_SCROLLING_TEXT);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
