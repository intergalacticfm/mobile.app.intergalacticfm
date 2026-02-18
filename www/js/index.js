var fetchedStations;
let audioContext;

window.onload = function () {
    if (!fetchedStations) {
        fetchStations();
    }

    setScrollingText(window.DEFAULT_SCROLLING_TEXT);
    refreshScrollingTextAnimation();
    // unlock iOS audio context
    if (!audioContext) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
    document.addEventListener(window.DEVICE_READY_EVENT_NAME, onDeviceReady, false);
    /* prevent all pinch-zoom actions */
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());

    // page links actions
    document.getElementById("donateRedirect").addEventListener(window.CLICK_EVENT_NAME,
        function () {
            window.location.href = window.DONATE_URL;
        });

    document.getElementById("websiteRedirect").addEventListener(window.CLICK_EVENT_NAME,
        function () {
            window.location.href = window.WEBSITE_URL;
        });

    document.getElementById("archiveRedirect").addEventListener(window.CLICK_EVENT_NAME,
        function () {
            window.location.href = window.ARCHIVE_URL;
        });
};

var cordova;

/*
this function is for using the android plugin, cordova libraries will not be available before this event has triggered
*/
function onDeviceReady() {
    //console.log("DEVICE IS READY!");
    if (isAndroidMusicServiceAvailable()) {
        // android
        cordova.plugins.MusicService.start(
            () => console.log("Music service started"),
            (err) => console.error("Failed to start music service:", err)
        );
        // android menu backbutton to behave like the app backbutton
        document.addEventListener("backbutton", (e) => {
            e.preventDefault();
            stopButtonAction();
        }, false);
    }
}

function isAndroidMusicServiceAvailable() {
    return (
        window.cordova &&
        cordova.platformId === "android" &&
        cordova.plugins &&
        cordova.plugins.MusicService &&
        typeof cordova.plugins.MusicService.setPlaying === "function"
    );
}


/* requests stations info and stream url from IFM server constants.STATIONS_JSON_URL */
async function fetchStations() {
    const response = await fetch(window.STATIONS_JSON_URL).then((response) => {
        if (response.status >= 400 && response.status < 600) {
            var errorMessage = "Unable to load the playlist: " + response.status + " - " +
                response.statusText;
            displayMessage(errorMessage);
        }
        return response;
    });

    const stationsJson = await response.json();
    var cbsInfo = stationsJson.stations[0];
    var dfInfo = stationsJson.stations[1];
    var tdmInfo = stationsJson.stations[2];

    // init stations object shared with audio.js 
    fetchedStations = [
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
                ];

    // playlist loaded successfuly
    displayMessage(window.SYSTEM_READY_MSG);
}

/* the rolling text right after the ifm logo, set as default in constants.DEFAULT_SCROLLING_TEXT */
function setScrollingText(textForScrolling) {
    document.getElementsByClassName("ifmxScrollText")[0].innerHTML = textForScrolling;
}
window.setScrollingText = setScrollingText;


function refreshScrollingTextAnimation() {
    const el = document.querySelector(".ifmxScrollText");
    el.style.animation = window.NONE;
    void el.offsetWidth;
    el.style.animation = window.EMPTY_VAL;
}

/* set the message displayed after the channels */
function displayMessage(message) {
    feedHTML(window.DISPLAY_MESSAGE_BOX_ID, message);
}
window.displayMessage = displayMessage;

/* utility function for changing inner html given an element id */
function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
/* utility function for showing an element in html, used for the "now playing" modal */
function showElement(element) {
    element.style.display = window.BLOCK;
}
/* utility function for hiding an element in html, used for the "now playing" modal */
function hideElement(element) {
    element.style.display = window.NONE;
}
