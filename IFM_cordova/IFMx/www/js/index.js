// where all streaming url and radio info are fetched from
const STATIONS_JSON_URL = 'https://intergalactic.fm/sd/stations.json';
const DISPLAY_MESSAGE_BOX_ID = 'messageBox';
const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=MV4HVU2D4W3LJ';
const WEBSITE_URL = 'https://intergalactic.fm/';
const ARCHIVE_URL = 'https://videohotmix.net/';
const DEFAULT_SCROLLING_TEXT = 'INTERGALACTIC FM SPACE TRAVELS APP'


window.onload = function () {
    fetchStations();
    setScrollingText(DEFAULT_SCROLLING_TEXT);
    document.addEventListener("deviceready", onDeviceReady, false);
};

// page links actions
document.getElementById("donateRedirect").addEventListener("click",
    function () {
        window.location.href = DONATE_URL;
    });

document.getElementById("websiteRedirect").addEventListener("click",
    function () {
        window.location.href = WEBSITE_URL;
    });

document.getElementById("archiveRedirect").addEventListener("click",
    function () {
        window.location.href = ARCHIVE_URL;
    });

/* requests stations info and stream url from IFM server STATIONS_JSON_URL */
var radio;
async function fetchStations() {

    const response = await fetch(STATIONS_JSON_URL).catch(err => {
        var errorMessage = "Unable to load the playlist."
        if (err) {
            errorMessage += "<br>" + err;
        }
        displayMessage(errorMessage);
    });

    const stationsJson = await response.json();
    var cbsInfo = stationsJson.stations[0];
    var dfInfo = stationsJson.stations[1];
    var tdmInfo = stationsJson.stations[2];
    // init radio
    var stations = [
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
    radio = new Radio(stations);

    // playlist loaded successfuly
    displayMessage("System ready.<br> Select a channel to play.");
}

function setScrollingText(textForScrolling) {
    document.getElementsByClassName("ifmxScrollText")[0].innerHTML = textForScrolling;
}

function displayMessage(message) {
    feedHTML(DISPLAY_MESSAGE_BOX_ID, message);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
