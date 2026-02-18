var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
var stations;
var previousTrackHash = window.EMPTY_VAL;
var previousExtractedCoverHTML = window.EMPTY_VAL;

window.addEventListener('DOMContentLoaded', () => {
    // bind the channel buttons to the playChannel function
    document.getElementById(window.CBS_BUTTON_ID).addEventListener(window.CLICK_EVENT_NAME, function () {
        document.getElementById(window.CBS_BUTTON_ID).classList.add(window.IS_DISABLED_CSS_CLASS);
        playChannel(0);
    });
    document.getElementById(window.DF_BUTTON_ID).addEventListener(window.CLICK_EVENT_NAME, function () {
        document.getElementById(window.DF_BUTTON_ID).classList.add(window.IS_DISABLED_CSS_CLASS);
        playChannel(1);
    });
    document.getElementById(window.TDM_BUTTON_ID).addEventListener(window.CLICK_EVENT_NAME, function () {
        document.getElementById(window.TDM_BUTTON_ID).classList.add(window.IS_DISABLED_CSS_CLASS);
        playChannel(2);
    });

    // bind the stop button to stop music from playing
    document.getElementById(window.STOP_BUTTON_ID).addEventListener(window.CLICK_EVENT_NAME, function () {
        stop();
        reset();
    });
});

// stop the audio player
function stop() {
    if (window.AUDIO_PLAYER) {
        window.AUDIO_PLAYER.src = '';
        if (typeof isAndroidMusicServiceAvailable === 'function' && isAndroidMusicServiceAvailable()) {
            cordova.plugins.MusicService.setPlaying(false);
        }
    }
}

// plays the channel stream url
function playChannel(channelNumber) {
    var channelTitle = 'Unknown';
    if (fetchedStations && fetchedStations[channelNumber] && fetchedStations[channelNumber].title) {
        channelTitle = fetchedStations[channelNumber].title;
    }

    try {
        selectedChannel = channelNumber;

        if (fetchedStations && fetchedStations[channelNumber] && fetchedStations[channelNumber].src) {
            window.AUDIO_PLAYER.src = fetchedStations[channelNumber].src;
        }

        window.AUDIO_PLAYER.load();
        audioContext.resume().then(() => {
            window.AUDIO_PLAYER.play();
        });

        setLockscreenTrackCommands();
        addAudioEventListeners(window.AUDIO_PLAYER);
        clearTimeout(nowPlayingRequestTimer);
        previousExtractedCoverHTML = window.EMPTY_VAL;

        displayMessage(window.LOADING_MSG + channelTitle + "...");
        currentNowPlayingUrl = window.NOW_PLAYING_REQUEST_PREFIX + channelTitle;

        getNowPlaying();
    } catch (error) {
        var errorMessage = "Error while loading " + channelTitle + ": " + error;
        console.log(errorMessage);
        reset();
        displayMessage(errorMessage);
    }
}

// iOS and browsers receive event listeners from media session object, not Android
function addAudioEventListeners(audioPlayer) {
    if (window.MEDIASESSION_NAME in navigator) {
        audioPlayer.addEventListener(window.PLAY_ACTION_NAME, () => {
            navigator.mediaSession.playbackState = 'playing';
        });
        audioPlayer.addEventListener(window.PAUSE_ACTION_NAME, () => {
            navigator.mediaSession.playbackState = 'paused';
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                if (navigator.mediaSession.playbackState === "playing") {
                    // no action needed
                }
            }
        });
    }
}

// request now playing from IFM server every constants.NOW_PLAYING_REQUEST_TIMEOUT_MSEC
async function getNowPlaying() {
    var trackMetadata;
    try {
        var response = await fetch(currentNowPlayingUrl);
        if (!response.ok) {
            trackMetadata = setDefaultNowPlayingInfo();
        } else {
            trackMetadata = await response.json();
            if (!trackMetadata || typeof trackMetadata.title !== 'string') {
                trackMetadata = setDefaultNowPlayingInfo();
            } else {
                trackMetadata.title = fixEncoding(trackMetadata.title);
                if (!trackMetadata.image_file) {
                    trackMetadata.image_file = window.DEFAULT_IMAGE_NOT_FOUND;
                }
            }
        }
    } catch (error) {
        console.warn("NowPlaying API error:", error);
        trackMetadata = setDefaultNowPlayingInfo();
    }

    var metaDataHash = trackMetadata.title + trackMetadata.image_file;
    if (previousTrackHash !== metaDataHash) {
        setTrackMetadata(trackMetadata);
        previousTrackHash = metaDataHash;
        feedNowPlaying(trackMetadata);
    }

    nowPlayingRequestTimer = setTimeout(getNowPlaying, window.NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
}

// force UTF-8 decoding
function fixEncoding(str) {
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}

// default info if API fails
function setDefaultNowPlayingInfo() {
    return {
        title: "No info received from Mothership.",
        image_file: window.DEFAULT_IMAGE_NOT_FOUND
    };
}

// object for current track metadata
var nowPlayingMetadatas = {
    artist: "",
    title: "",
    album: "",
    label: "",
    year: "",
    country: "",
    ifmxLog: "",
    artwork_url: ""
};

// safely sets track metadata
function setTrackMetadata(trackMetadata) {
    if (!trackMetadata || typeof trackMetadata.title !== "string") return;
    var rawTitle = trackMetadata.title || window.EMPTY_VAL;
    var trackMetadatas = rawTitle.split(window.METADATA_SPLIT_CHAR);
    var mainPart = trackMetadatas[0] || window.EMPTY_VAL;
    var splitString = window.ARTIST_TITLE_SPLIT_STRING || ' - ';

    var artist = mainPart || '';
    var title = '';

    if (mainPart && mainPart.indexOf(splitString) >= 0) {
        var parts = mainPart.split(splitString);
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts[1].trim();
        }
    }
    nowPlayingMetadatas.artist = artist;
    nowPlayingMetadatas.title = title;
    nowPlayingMetadatas.album = trackMetadatas[1] ? trackMetadatas[1].trim() : '';
    nowPlayingMetadatas.label = trackMetadatas[2] ? trackMetadatas[2].trim() : '';
    nowPlayingMetadatas.year = trackMetadatas[3] ? trackMetadatas[3].trim() : '';
    nowPlayingMetadatas.country = trackMetadatas[4] ? trackMetadatas[4].trim() : '';
    nowPlayingMetadatas.artwork_url = trackMetadata.image_file || window.DEFAULT_IMAGE_NOT_FOUND;

    var ifmxLog = trackMetadatas[5] ? trackMetadatas[5].trim() : window.DEFAULT_SCROLLING_TEXT || '';
    setScrollingText(ifmxLog);

    var coverPath = window.DEFAULT_IMAGE_NOT_FOUND;
    if (window.COVER_PATH_ARRAY && window.COVER_PATH_ARRAY[selectedChannel]) {
        coverPath = window.COVER_PATH_ARRAY[selectedChannel];
    }
    console.log("coverPath: " + coverPath);

    if (window.MEDIASESSION_NAME in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: nowPlayingMetadatas.album,
            artwork: [{
                src: coverPath
            }]
        });
    }

    if (typeof isAndroidMusicServiceAvailable === 'function' &&
        isAndroidMusicServiceAvailable() &&
        typeof cordova !== 'undefined' &&
        cordova.plugins &&
        cordova.plugins.MusicService) {
        cordova.plugins.MusicService.updateMetadata(
            nowPlayingMetadatas.title,
            nowPlayingMetadatas.artist,
            nowPlayingMetadatas.album,
            coverPath
        );
        cordova.plugins.MusicService.setPlaying(true);
    }
}

function setLockscreenTrackCommands() {
    if (window.MEDIASESSION_NAME in navigator) {
        var previousIndex = selectedChannel === 0 ? 2 : (selectedChannel - 1);
        var nextIndex = selectedChannel === 2 ? 0 : (selectedChannel + 1);

        if (selectedChannel === 0) {
            navigator.mediaSession.setActionHandler(window.PREVIOUS_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(window.NEXT_TRACK_ACTION_NAME, () => playChannel(nextIndex));
        } else if (selectedChannel === 1) {
            navigator.mediaSession.setActionHandler(window.PREVIOUS_TRACK_ACTION_NAME, () => playChannel(previousIndex));
            navigator.mediaSession.setActionHandler(window.NEXT_TRACK_ACTION_NAME, () => playChannel(nextIndex));
        } else if (selectedChannel === 2) {
            navigator.mediaSession.setActionHandler(window.NEXT_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(window.PREVIOUS_TRACK_ACTION_NAME, () => playChannel(previousIndex));
        }
    }
}

function feedNowPlaying(nowPlayingMetadata) {
    var meta = nowPlayingMetadata || {};
    var main = (nowPlayingMetadatas.artist || '') + window.ARTIST_TITLE_SPLIT_STRING + (nowPlayingMetadatas.title || '');
    var otherInfo = (nowPlayingMetadatas.album || '') +
        (nowPlayingMetadatas.label ? window.ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.label : '') +
        (nowPlayingMetadatas.year ? window.LINE_BREAK + nowPlayingMetadatas.year : '') +
        (nowPlayingMetadatas.country ? ", " + nowPlayingMetadatas.country : '');

    feedHTML(window.NOW_PLAYING_DIV_ID, main);
    feedHTML(window.NOW_PLAYING_DIV_EXT_ID, otherInfo);
    feedHTML(window.NOW_PLAYING_COVER_DIV_ID, getCoverHTMLfromUrl(meta.image_file || window.DEFAULT_IMAGE_NOT_FOUND));

    var modal = document.getElementById(window.TRACK_INFO_MODAL_ID);
    var homeContainer = document.getElementById(window.CONTAINER_ID);
    var stopButton = document.getElementsByClassName(window.CLOSE)[0];

    if (homeContainer) hideElement(homeContainer);
    if (modal) showElement(modal);
    if (stopButton) showElement(stopButton);
}

function stopButtonAction() {
    stop();
    reset();
}

function getCoverHTMLfromUrl(image_url) {
    return "<img src='" + image_url + "' style='width:90%' onerror=\"imgErrorManagement(this)\"/>";
}

function imgErrorManagement(source) {
    source.src = window.DEFAULT_IMAGE_NOT_FOUND;
    source.onerror = window.EMPTY_VAL;
    return true;
}

function reset() {
    feedHTML(window.NOW_PLAYING_DIV_ID, window.EMPTY_VAL);
    feedHTML(window.NOW_PLAYING_DIV_EXT_ID, window.EMPTY_VAL);
    feedHTML(window.NOW_PLAYING_COVER_DIV_ID, window.EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    previousTrackHash = window.EMPTY_VAL;
    previousExtractedCoverHTML = window.EMPTY_VAL;
    selectedChannel = window.EMPTY_VAL;
    document.title = window.PAGE_TITLE_DEFAULT;
    hideElement(document.getElementsByClassName(window.CLOSE)[0]);
    hideElement(document.getElementById(window.TRACK_INFO_MODAL_ID));
    fetchStations();
    showElement(document.getElementById(window.CONTAINER_ID));
    setScrollingText(window.DEFAULT_SCROLLING_TEXT);
    document.getElementById(window.CBS_BUTTON_ID).classList.remove(window.IS_DISABLED_CSS_CLASS);
    document.getElementById(window.DF_BUTTON_ID).classList.remove(window.IS_DISABLED_CSS_CLASS);
    document.getElementById(window.TDM_BUTTON_ID).classList.remove(window.IS_DISABLED_CSS_CLASS);
}

// expose functions for tests
window.getNowPlaying = getNowPlaying;
window.setTrackMetadata = setTrackMetadata;
window.setDefaultNowPlayingInfo = setDefaultNowPlayingInfo;
window.nowPlayingMetadatas = nowPlayingMetadatas;
window.feedNowPlaying = feedNowPlaying;
window.fixEncoding = fixEncoding;
window.stop = stop;
window.playChannel = playChannel;
