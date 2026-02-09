var fetchedStations;
let audioContext;

window.onload = function () {
    if (!fetchedStations) {
        fetchStations();
    }

    setScrollingText(DEFAULT_SCROLLING_TEXT);
    refreshScrollingTextAnimation();
    // unlock iOS audio context
    if (!audioContext) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
    document.addEventListener(DEVICE_READY_EVENT_NAME, onDeviceReady, false);
    /* prevent all pinch-zoom actions */
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());
};

var cordova;

/*
this function is for using the android plugin, cordova libraries will not be available before this event has triggered
*/
function onDeviceReady() {
    //console.log("DEVICE IS READY!");
    if (cordova.plugins.MusicService) {
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

// page links actions
document.getElementById("donateRedirect").addEventListener(CLICK_EVENT_NAME,
    function () {
        window.location.href = DONATE_URL;
    });

document.getElementById("websiteRedirect").addEventListener(CLICK_EVENT_NAME,
    function () {
        window.location.href = WEBSITE_URL;
    });

document.getElementById("archiveRedirect").addEventListener(CLICK_EVENT_NAME,
    function () {
        window.location.href = ARCHIVE_URL;
    });

/* requests stations info and stream url from IFM server constants.STATIONS_JSON_URL */
async function fetchStations() {
    const response = await fetch(STATIONS_JSON_URL).then((response) => {
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
    displayMessage(SYSTEM_READY_MSG);
}

/* the rolling text right after the ifm logo, set as default in constants.DEFAULT_SCROLLING_TEXT */
function setScrollingText(textForScrolling) {
    document.getElementsByClassName("ifmxScrollText")[0].innerHTML = textForScrolling;
}

function refreshScrollingTextAnimation() {
    const el = document.querySelector(".ifmxScrollText");
    el.style.animation = NONE;
    void el.offsetWidth;
    el.style.animation = EMPTY_VAL;
}

/* set the message displayed after the channels */
function displayMessage(message) {
    feedHTML(DISPLAY_MESSAGE_BOX_ID, message);
}

/* utility function for changing inner html given an element id */
function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
/* utility function for showing an element in html, used for the "now playing" modal */
function showElement(element) {
    element.style.display = BLOCK;
}
/* utility function for hiding an element in html, used for the "now playing" modal */
function hideElement(element) {
    element.style.display = NONE;
}
