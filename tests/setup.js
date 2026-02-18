import {
    vi
} from 'vitest';
import {
    JSDOM
} from 'jsdom';

// --------------------------------------------------
// SETUP JSDOM
// --------------------------------------------------
const dom = new JSDOM(`
<!doctype html>
<html>
<body>
    <audio id="player"></audio>
    <audio id="playerCBS"></audio>
    <audio id="playerDF"></audio>
    <audio id="playerTDM"></audio>

    <div id="nowPlaying"></div>
    <div id="nowPlayingExt"></div>
    <div id="nowPlayingCover"></div>
    <div id="trackInfoModal"></div>
    <div id="container"></div>
    <div id="messageBox"></div>
    <div class="ifmxScrollText"></div>

    <button class="close"></button>
    <button id="cbsChannelButton"></button>
    <button id="dfChannelButton"></button>
    <button id="tdmChannelButton"></button>
    <button id="stopButton"></button>
    <button id="donateRedirect"></button>
    <button id="websiteRedirect"></button>
    <button id="archiveRedirect"></button>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;

// --------------------------------------------------
// MOCK FUNZIONI GLOBALI NECESSARIE
// --------------------------------------------------
window.hideElement = vi.fn();
window.showElement = vi.fn();
window.setScrollingText = vi.fn();
window.feedHTML = vi.fn();
window.displayMessage = vi.fn();

// --------------------------------------------------
// MOCK AUDIO
// --------------------------------------------------
document.querySelectorAll('audio').forEach(a => {
    a.play = vi.fn();
    a.pause = vi.fn();
    a.load = vi.fn();
});

// --------------------------------------------------
// MOCK MEDIA SESSION
// --------------------------------------------------
if (!('mediaSession' in global.navigator)) {
    global.navigator.mediaSession = {
        setActionHandler: vi.fn(),
        playbackState: '',
        metadata: null,
    };
}

// --------------------------------------------------
// MOCK CORDOVA
// --------------------------------------------------
window.cordova = {
    platformId: 'android',
    plugins: {
        MusicService: {
            start: vi.fn(),
            setPlaying: vi.fn(),
            updateMetadata: vi.fn(),
        },
    },
};

// --------------------------------------------------
// IMPORT DELLE COSTANTI REALI
// --------------------------------------------------
import * as CONST from '../www/js/constants.js';
Object.keys(CONST).forEach(key => window[key] = CONST[key]);
// --------------------------------------------------
// IMPORT DEL CODICE REALE
// --------------------------------------------------
import '../src/index.js';
import '../src/audio.js';
