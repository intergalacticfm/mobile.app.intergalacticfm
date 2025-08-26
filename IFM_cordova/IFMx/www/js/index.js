var fetchedStations;
let audioContext;

window.onload = function () {
    if (!fetchedStations) {
        fetchStations();
    }
    setScrollingText(DEFAULT_SCROLLING_TEXT);
    // unlock iOS audio context
    if (!audioContext) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
    document.addEventListener("deviceready", onDeviceReady, false);
};

var cordova;

function onDeviceReady() {
    console.log("DEVICE IS READY!");
    cordova.plugins.MusicService.start(
        () => console.log("Music service started"),
        (err) => console.error("Failed to start music service:", err)
    );

    // lockscreen controls
    this.cordova = cordova;
    cordova.plugins.MusicService.setEventListener(function (event) {
        if (event === "pause") {
            console.log("lockscreen command PAUSE!");
        } else if (event === "play") {
            console.log("lockscreen command PLAY!");
        }
    });

}



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

    // init radio
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
    // preload
    /*
    CBS_AUDIO_PLAYER.src = cbsInfo.url;
    CBS_AUDIO_PLAYER.load();
    DF_AUDIO_PLAYER.src = dfInfo.url;
    DF_AUDIO_PLAYER.load();
    TDM_AUDIO_PLAYER.src = tdmInfo.url;
    TDM_AUDIO_PLAYER.load();
    */

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

function showElement(element) {
    element.style.display = "block";
}

function hideElement(element) {
    element.style.display = "none";
}

function disableChannel(channelButtonId) {
    document.getElementById(channelButtonId).style.display = "none";
}
