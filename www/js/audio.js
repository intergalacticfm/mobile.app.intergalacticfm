var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
var stations;
var previousTrackHash = EMPTY_VAL;
var previousExtractedCoverHTML = EMPTY_VAL;


/* bing the channel buttons to the playChannel function */
document.getElementById(CBS_BUTTON_ID).addEventListener(CLICK_EVENT_NAME,
    function () {
        document.getElementById(CBS_BUTTON_ID).classList.add(IS_DISABLED_CSS_CLASS);
        playChannel(0);
    });
document.getElementById(DF_BUTTON_ID).addEventListener(CLICK_EVENT_NAME,
    function () {
        document.getElementById(DF_BUTTON_ID).classList.add(IS_DISABLED_CSS_CLASS);
        playChannel(1);
    });
document.getElementById(TDM_BUTTON_ID).addEventListener(CLICK_EVENT_NAME,
    function () {
        document.getElementById(TDM_BUTTON_ID).classList.add(IS_DISABLED_CSS_CLASS);
        playChannel(2);
    });

/* bing the stop button to stop music from playing */
document.getElementById(STOP_BUTTON_ID).addEventListener(CLICK_EVENT_NAME, function () {
    stop();
    reset();
});

/* stop the audio player */
function stop() {
    AUDIO_PLAYER.src = '';
    if (cordova && cordova.plugins.MusicService != null) {
        /* android plugin receives the playback state */
        cordova.plugins.MusicService.setPlaying(false);
    }
}
/* plays the channels stream url */
function playChannel(channelNumber) {
    var channelTitle = fetchedStations[channelNumber].title;
    try {
        /* scope variable that can be used in other functions to always have the knowledge of the current selected channel */
        selectedChannel = channelNumber;
        /* set the source to the audio player */
        AUDIO_PLAYER.src = fetchedStations[channelNumber].src;
        /* load the stream: not very needed since there is no preload */
        AUDIO_PLAYER.load();
        /* audio context object is used to speed up where possible iOS to load, doesn't really improve */
        audioContext.resume().then(() => {
            AUDIO_PLAYER.play();
        });
        /* all the rest of needed functionalities */
        setLockscreenTrackCommands();
        addAudioEventListeners(AUDIO_PLAYER);
        clearTimeout(nowPlayingRequestTimer);
        previousExtractedCoverHTML = EMPTY_VAL;

        var channelTitle = fetchedStations[channelNumber].title;
        displayMessage(LOADING_MSG + channelTitle + "...");
        currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + channelTitle;
        /* starts the now playing function */
        getNowPlaying();
    } catch (error) {
        var errorMessage =
            "Error while loading " + channelTitle + ": " + error;
        console.log(errorMessage);
        reset();
        displayMessage(errorMessage);
    }

}

/* iOS and browsers receive event listeners from media session object, not android */
function addAudioEventListeners(audioPlayer) {
    if (MEDIASESSION_NAME in navigator) {
        audioPlayer.addEventListener(PLAY_ACTION_NAME, () => {
            navigator.mediaSession.playbackState = 'playing';
        });
        audioPlayer.addEventListener(PAUSE_ACTION_NAME, () => {
            navigator.mediaSession.playbackState = 'paused';
        });
        /* coming back from lockscreen action */
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                if (navigator.mediaSession.playbackState == "playing") {
                    /* binded but no action is required for now */
                }
            }
        });
    }
}

/* request now playing from IFM server every constants.NOW_PLAYING_REQUEST_TIMEOUT_MSEC */
async function getNowPlaying() {
    let trackMetadata;
    try {
        const response = await fetch(currentNowPlayingUrl);
        if (!response.ok) {
            trackMetadata = setDefaultNowPlayingInfo();
        } else {
            trackMetadata = await response.json();
            trackMetadata.title = fixEncoding(trackMetadata.title);
        }
    } catch (error) {
        console.warn("NowPlaying API error:", error);
        trackMetadata = setDefaultNowPlayingInfo();
    }

    var metaDataHash = trackMetadata.title + trackMetadata.image_file;
    if (previousTrackHash != metaDataHash) {
        /* if we have a new track, by comparing the attribute title, we update the metadatas */
        setTrackMetadata(trackMetadata);
        var newTrack = metaDataHash;
        previousTrackHash = newTrack;
        feedNowPlaying(trackMetadata);
    }
    // restart the timer for polling the now playing api
    nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
}

/* some titles arrives in non-UTF8 format, so needs a forcing decoding */
function fixEncoding(str) {
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}
/* in case there is no info on playing track, we show default value instead of crashing */
function setDefaultNowPlayingInfo() {
    return {
        "title": "Error - No info received from Mothership.",
        "image_file": DEFAULT_IMAGE_NOT_FOUND
    };
}

/* init the object metadatas, used to display music info */
var nowPlayingMetadatas = {
    "artist": "",
    "title": "",
    "album": "",
    "label": "",
    "year": "",
    "country": "",
    "ifmxLog": "",
    "artwork_url": ""
}
// example of structure of the return string "OMICRON - Positron | The Generation and Motion of a Pulse | Instinct Ambient | 1995 | US | Electronix Surveillance * Insta: @intergalacticfm *  "
/* this function parse the response of the now playing metadata from IFM server */
function setTrackMetadata(trackMetadata) {
    if (trackMetadata) {
        const trackMetadatas = trackMetadata.title.split(METADATA_SPLIT_CHAR);
        var notCorrupted = trackMetadatas[0].includes(ARTIST_TITLE_SPLIT_STRING);
        var manydash = (trackMetadatas[0].match(/-/g) || []).length != 1;
        var artist_title = trackMetadatas[0];
        var artist = artist_title;
        var title = EMPTY_VAL;
        if (notCorrupted && !manydash) {
            artist = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[0].trim();
            title = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[1].trim();
        }
        var album = trackMetadatas[1] ? trackMetadatas[1].trim() : EMPTY_VAL;
        var label = trackMetadatas[2] ? trackMetadatas[2].trim() : EMPTY_VAL;
        var year = trackMetadatas[3] ? trackMetadatas[3].trim() : EMPTY_VAL;
        var country = trackMetadatas[4] ? trackMetadatas[4].trim() : EMPTY_VAL;
        var ifmxLog = trackMetadatas[5] ? trackMetadatas[5].trim() : DEFAULT_SCROLLING_TEXT;
        // build the shared object
        nowPlayingMetadatas.artist = artist;
        nowPlayingMetadatas.title = title;
        nowPlayingMetadatas.album = album;
        nowPlayingMetadatas.label = label;
        nowPlayingMetadatas.year = year;
        nowPlayingMetadatas.country = country;
        nowPlayingMetadatas.artwork_url = trackMetadata.image_file;
        // we put the extra info of the now playing in the scrolling text so IFMx can say what he wants when he wants
        setScrollingText(ifmxLog);
        var coverPath = COVER_PATH_ARRAY[selectedChannel];
        if (MEDIASESSION_NAME in navigator) {
            // iOS metadata update
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: album,
                artwork: [{
                    src: coverPath
                }]
            });
        }
        if (cordova && cordova.plugins.MusicService) {
            // Android metadata update
            cordova.plugins.MusicService.updateMetadata(
                nowPlayingMetadatas.title,
                nowPlayingMetadatas.artist,
                nowPlayingMetadatas.album,
                COVER_PATH_ARRAY[selectedChannel]);
            /* android plugin receives the playback state */
            cordova.plugins.MusicService.setPlaying(true);
        }
    }
}


function setLockscreenTrackCommands() {
    /* iOS lockscreen commands for next, prev track */
    if (MEDIASESSION_NAME in navigator) {
        /* if channel is the first, we only move forward. if channel is last we only move backward */
        var previousIndex = selectedChannel == 0 ? 2 : (selectedChannel - 1);
        var nextIndex = selectedChannel == 2 ? 0 : (selectedChannel + 1);
        if (selectedChannel == 0) {
            // cbs
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
                playChannel(nextIndex);
            });
        } else
        if (selectedChannel == 1) {
            // df
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
                playChannel(previousIndex);
            });
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
                playChannel(nextIndex);
            });
        } else
        if (selectedChannel == 2) {
            // tdm
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
                playChannel(previousIndex);
            });
        }
    }
}

/* populate the now playing modal with track info and cover */
function feedNowPlaying(nowPlayingMetadata) {
    var main = nowPlayingMetadatas.artist + ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.title;
    var otherInfo = (nowPlayingMetadatas.album !== EMPTY_VAL ? nowPlayingMetadatas.album : EMPTY_VAL) +
        (nowPlayingMetadatas.label !== EMPTY_VAL ? ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.label : EMPTY_VAL) +
        (nowPlayingMetadatas.year !== EMPTY_VAL ? LINE_BREAK + nowPlayingMetadatas.year : EMPTY_VAL) +
        (nowPlayingMetadatas.country !== EMPTY_VAL ? " , " + nowPlayingMetadatas.country : EMPTY_VAL);
    // ARTIST - title 
    var fixedMain = formatTitleCase(main);
    feedHTML(NOW_PLAYING_DIV_ID, fixedMain);
    // ALBUM - YEAR, COUNTRY
    feedHTML(NOW_PLAYING_DIV_EXT_ID, otherInfo);
    // COVER
    feedHTML(NOW_PLAYING_COVER_DIV_ID, getCoverHTMLfromUrl(nowPlayingMetadata.image_file));

    var modal = document.getElementById(TRACK_INFO_MODAL_ID);
    var homeContainer = document.getElementById(CONTAINER_ID);
    var stopButton = document.getElementsByClassName(CLOSE)[0];
    hideElement(homeContainer);
    showElement(modal);
    showElement(stopButton);
}

function stopButtonAction() {
    stop();
    reset();
}
/* requested by the imperious leader: artist name should be formatted Titlecase */
function formatTitleCase(string) {
    if (!string) return EMPTY_VAL;
    string = string.toLowerCase();
    return string.split(SPACE).map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(SPACE);
}

/* build the html for the cover artwork */
function getCoverHTMLfromUrl(image_url) {
    return "<img src='" + image_url + "' style='width:90%' onerror=\"imgErrorManagement(this)\"/>";
}

function imgErrorManagement(source) {
    source.src = DEFAULT_IMAGE_NOT_FOUND;
    source.onerror = EMPTY_VAL;
    return true;
}

/* reset the app to initial state */
function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    previousTrackHash = EMPTY_VAL;
    previousExtractedCoverHTML = EMPTY_VAL;
    selectedChannel = EMPTY_VAL;
    document.title = PAGE_TITLE_DEFAULT;
    hideElement(document.getElementsByClassName(CLOSE)[0]);
    hideElement(document.getElementById(TRACK_INFO_MODAL_ID));
    fetchStations();
    showElement(document.getElementById(CONTAINER_ID));
    setScrollingText(DEFAULT_SCROLLING_TEXT);
    document.getElementById(CBS_BUTTON_ID).classList.remove(IS_DISABLED_CSS_CLASS);
    document.getElementById(DF_BUTTON_ID).classList.remove(IS_DISABLED_CSS_CLASS);
    document.getElementById(TDM_BUTTON_ID).classList.remove(IS_DISABLED_CSS_CLASS);
}
