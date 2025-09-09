var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
var stations;
var previousTrackTitle = EMPTY_VAL;
var previousExtractedCoverHTML = EMPTY_VAL;


/* bing the channel buttons to the playChannel function */
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

/* bing the stop button to stop music from playing */
document.getElementById(STOP_BUTTON_ID).addEventListener("click", function () {
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
        //alert("Error while loading " + channelTitle + ": " + error);
        reset();
        displayMessage(errorMessage);
    }

}

/* iOS and browsers receive event listeners from media session object, not android */
function addAudioEventListeners(audioPlayer) {
    if ("mediaSession" in navigator) {
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
    try {
        const response = await fetch(currentNowPlayingUrl);
        const trackMetadata = await response.json();
        if (trackMetadata) {
            // avoid nullpointer if api is down
            if (previousTrackTitle != trackMetadata.title) {
                /* if we have a new track, by comparing the attribute title, we update the metadatas */
                setTrackMetadata(trackMetadata);
                var newTrack = trackMetadata.title;
                previousTrackTitle = newTrack;
                feedNowPlaying(newTrack);
                extractCoverFromChannelContent(0);
            }
        }
        // restart the timer for polling the now playing api
        nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    } catch (error) {
        //alert("NOW PLAYIN ERROR: " + error);
        var errorMessage = "Error while fetching nowPlaying API: " + error;
        //console.log(errorMessage);
        reset();
        displayMessage(errorMessage);
    }
}

/* init the object metadatas, used to display music info */
var nowPlayingMetadatas = {
    "artist": "",
    "title": "",
    "album": "",
    "label": "",
    "year": "",
    "country": "",
    "ifmxLog": ""
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
        // build the shared object
        nowPlayingMetadatas.artist = artist;
        nowPlayingMetadatas.title = title;
        nowPlayingMetadatas.album = album;
        nowPlayingMetadatas.label = label;
        nowPlayingMetadatas.year = year;
        nowPlayingMetadatas.country = country;
        // we put the extra info of the now playing in the scrolling text so IFMx can say what he wants when he wants
        setScrollingText(ifmxLog);
        var coverPath = COVER_PATH_ARRAY[selectedChannel];
        if ("mediaSession" in navigator) {
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
    if ("mediaSession" in navigator) {
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
function feedNowPlaying(title) {

    var fields = title.split(META_TAGS_SPLIT_CHAR);
    var main = nowPlayingMetadatas.artist + ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.title;
    var otherInfo = (nowPlayingMetadatas.album !== '' ? nowPlayingMetadatas.album : EMPTY_VAL) +
        (nowPlayingMetadatas.year !== '' ? ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.year : EMPTY_VAL) +
        (nowPlayingMetadatas.country !== '' ? " , " + nowPlayingMetadatas.country : EMPTY_VAL);
    // ARTIST - title 
    feedHTML(NOW_PLAYING_DIV_ID, main);
    // ALBUM - YEAR, COUNTRY
    feedHTML(NOW_PLAYING_DIV_EXT_ID, otherInfo);

    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    var btn = document.getElementById("myBtn");
    var span = document.getElementsByClassName("close")[0];
    hideElement(homeContainer);
    showElement(modal);
    // When the user clicks on "back button" (↵), close the modal
    span.onclick = function () {
        hideElement(modal);
        showElement(homeContainer);
    }

}

/* cover image is fetched from IFM server (constants.NOW_PLAYING_PICTURE_REQUEST_PREFIX) as pure HTML, so we need parsing to extract just the image we need to display */
async function extractCoverFromChannelContent(attempt) {
    if (attempt >= 10) {
        // recursion guard to avoid infinite loops
        return;
    }
    var requestUrl = NOW_PLAYING_PICTURE_REQUEST_PREFIX + (selectedChannel + 1);
    var response = await fetch(requestUrl);
    var body = await response.text();
    var extractedCoverHTML = extractCoverFromHTML(body);
    if (extractedCoverHTML != previousExtractedCoverHTML) {
        // if previous known cover is different than the new one, we have the updated cover for the playing track */
        previousExtractedCoverHTML = extractedCoverHTML;
        // clean IFM inherited website styling and replace blanco img on error with local one
        var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('https://www.intergalactic.fm/sites/default/files/covers/blanco.png', 'img/blanco.png').replace('this.onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="90%"').replace('height="100"', 'height="90%"');
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
/* reset the app to initial state */
function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    previousTrackTitle = EMPTY_VAL;
    previousExtractedCoverHTML = EMPTY_VAL;
    selectedChannel = EMPTY_VAL;
    document.title = PAGE_TITLE_DEFAULT;
    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    hideElement(modal);
    fetchStations();
    showElement(homeContainer);
    setScrollingText(DEFAULT_SCROLLING_TEXT);
}
