var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
var stations;

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
const COVER_PATH = "img/logo128.png";
const CBS_COVER_PATH = "img/cbs128.png";
const DF_COVER_PATH = "img/df128.png";
const TDM_COVER_PATH = "img/tdm128.png";
const COVER_PATH_ARRAY = [CBS_COVER_PATH, DF_COVER_PATH, TDM_COVER_PATH];
const ARTIST_TITLE_SPLIT_STRING = ' - ';
const METADATA_SPLIT_CHAR = '|';
const NEXT_TRACK_ACTION_NAME = 'nexttrack';
const PREVIOUS_TRACK_ACTION_NAME = 'previoustrack';
const PLAY_ACTION_NAME = 'play';
const PAUSE_ACTION_NAME = 'pause';
const STOP_ACTION_NAME = 'stop';
const AUDIO_CONTROLS_KEY = 'controls';
const AUDIO_EVENT_PLAYING_NAME = 'playing';
const AUDIO_EVENT_PAUSE_NAME = 'pause';
const AUDIO_EVENT_ERROR_NAME = 'error';
const AUDIO_PLAYER_SOURCE_ID = 'audioPlayerSource';
const LOADING_MSG = 'Loading ';

var previousExtractedCoverHTML = EMPTY_VAL;
var nowPlayingMetadatas = {
    "artist": "",
    "title": "",
    "album": "",
    "label": "",
    "year": "",
    "country": "",
    "ifmxLog": ""
}

var audio;

// channel button actions
document.getElementById("cbsChannelButton").addEventListener("click",
    function () {
        playChannel(0);
    });
document.getElementById("dfChannelButton").addEventListener("click",
    function () {
        playChannel(1);
    });
document.getElementById("tdmChannelButton").addEventListener("click",
    function () {
        playChannel(2);
    });

// stop button
document.getElementById(STOP_BUTTON_ID).addEventListener("click", function () {
    stopAudio();
    reset();
});

function stopAudio() {

    AUDIO_CBS.currentTime = 0;
    AUDIO_CBS.pause();
    AUDIO_DF.currentTime = 0;
    AUDIO_DF.pause();
    AUDIO_TDM.currentTime = 0;
    AUDIO_TDM.pause();

}

function playChannel(channelNumber) {
    clearTimeout(nowPlayingRequestTimer);
    if (audio) {
        audio.pause();
    }
    audio = AUDIO_PLAYERS[channelNumber];
    clearTimeout(nowPlayingRequestTimer);
    this.previousExtractedCoverHTML = EMPTY_VAL;
    var channelTitle = this.fetchedStations[channelNumber].title;
    displayMessage(LOADING_MSG + channelTitle + "...");

    audio.play();

    this.selectedChannel = channelNumber + 1;
    this.currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + channelTitle;
    setLockScreenControls(channelNumber);
    getNowPlaying();

}

// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
async function getNowPlaying() {
    try {
        const response = await fetch(currentNowPlayingUrl);
        const trackMetadata = await response.json();

        if (trackMetadata) {
            if (this.previousTrackTitle != trackMetadata.title) {
                setTrackMetadata(trackMetadata);
                var newTrack = trackMetadata.title;
                this.previousTrackTitle = newTrack;
                feedNowPlaying(newTrack);
                extractCoverFromChannelContent();
            }
        }
        this.nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    } catch (error) {
        displayMessage(error);
        reset();
    }
}

// example of structure of the return string "OMICRON - Positron | The Generation and Motion of a Pulse | Instinct Ambient | 1995 | US | Electronix Surveillance * Insta: @intergalacticfm *  "
function setTrackMetadata(trackMetadata) {
    if (trackMetadata) {
        const trackMetadatas = trackMetadata.title.split(METADATA_SPLIT_CHAR);
        var notCorrupted = trackMetadatas[0].includes(ARTIST_TITLE_SPLIT_STRING);
        var manydash = (trackMetadatas[0].match(/-/g) || []).length != 1;
        var artist_title = trackMetadatas[0];
        var artist = artist_title;
        var title = "";
        if (notCorrupted && !manydash) {
            artist = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[0].trim();
            title = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[1].trim();
        }

        var album = trackMetadatas[1] ? trackMetadatas[1].trim() : EMPTY_VAL;
        var label = trackMetadatas[2] ? trackMetadatas[2].trim() : EMPTY_VAL;
        var year = trackMetadatas[3] ? trackMetadatas[3].trim() : EMPTY_VAL;
        var country = trackMetadatas[4] ? trackMetadatas[4].trim() : EMPTY_VAL;
        var ifmxLog = trackMetadatas[5] ? trackMetadatas[5].trim() : DEFAULT_SCROLLING_TEXT;

        this.nowPlayingMetadatas.artist = artist;
        this.nowPlayingMetadatas.title = title;
        this.nowPlayingMetadatas.album = album;
        this.nowPlayingMetadatas.label = label;
        this.nowPlayingMetadatas.year = year;
        this.nowPlayingMetadatas.country = country;

        setScrollingText(ifmxLog);
        var coverPath = COVER_PATH_ARRAY[this.selectedChannel - 1];

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
    var main = this.nowPlayingMetadatas.artist + ARTIST_TITLE_SPLIT_STRING + this.nowPlayingMetadatas.title;
    var otherInfo = (this.nowPlayingMetadatas.album !== '' ? this.nowPlayingMetadatas.album : EMPTY_VAL) +
        (this.nowPlayingMetadatas.year !== '' ? ARTIST_TITLE_SPLIT_STRING + this.nowPlayingMetadatas.year : EMPTY_VAL) +
        (this.nowPlayingMetadatas.country !== '' ? " , " + this.nowPlayingMetadatas.country : EMPTY_VAL);

    feedHTML(NOW_PLAYING_DIV_ID, main);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, otherInfo);

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

/* cover and track info are fetched from intergalactic.fm, but need parsing */
async function extractCoverFromChannelContent(attempt) {
    if (attempt >= 10) {
        // recursion guard
        return;
    }
    var requestUrl = NOW_PLAYING_PICTURE_REQUEST_PREFIX + this.selectedChannel;
    var response = await fetch(requestUrl);
    var body = await response.text();
    var extractedCoverHTML = extractCoverFromHTML(body);
    //console.log("GETTING ARTWORK...");
    if (extractedCoverHTML != this.previousExtractedCoverHTML) {
        //console.log("NEW ARTWORK!");
        this.previousExtractedCoverHTML = extractedCoverHTML;

        // clean IFM inherited website styling and replace blanco img on error with local one
        var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('https://www.intergalactic.fm/sites/default/files/covers/blanco.png', 'img/blanco.png').replace('this.onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="80%"').replace('height="100"', 'height="80%"');
        feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCleanCoverHTML);
    } else {
        //console.log("STILL OLD ARTWORK!");
        /* main website updates the cover with some delay, so we might request it multiple times before getting the updated one */
        //console.log("RETRYING...");
        setTimeout(function () {
            extractCoverFromChannelContent(attempt + 1);
        }, 2000);

    }
}

function extractCoverFromHTML(body) {
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    return body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
}

if ("mediaSession" in navigator) {
    // play / pause / stop lockscreen commands
    navigator.mediaSession.setActionHandler(PLAY_ACTION_NAME, () => {
        playChannel(index);
    });
    navigator.mediaSession.setActionHandler(PAUSE_ACTION_NAME, () => {
        stopAudio();
        navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, null);
        navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, null);
    });
    navigator.mediaSession.setActionHandler(STOP_ACTION_NAME, () => {
        stopAudio();
        navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, null);
        navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, null);
    });
}

function setLockScreenControls(index) {
    // next track / previous track lockscreen commands
    var nextIndex = index + 1;
    var previousIndex = index - 1;
    if (index == 0) {
        navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, null);
        navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
            playChannel(nextIndex);
        });
    } else
    if (index == 1) {
        navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
            playChannel(previousIndex);
        });
        navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
            playChannel(nextIndex);
        });
    } else
    if (index == 2) {
        navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, null);
        navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
            playChannel(previousIndex);
        });
    }
}

function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    this.previousTrackTitle = EMPTY_VAL;
    this.previousExtractedCoverHTML = EMPTY_VAL;
    this.selectedChannel = EMPTY_VAL;
    document.title = PAGE_TITLE_DEFAULT;
    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    hideElement(modal);
    fetchStations();
    showElement(homeContainer);
    setScrollingText(DEFAULT_SCROLLING_TEXT);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
