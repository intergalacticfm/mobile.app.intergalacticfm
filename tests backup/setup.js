import {
    vi
} from 'vitest';
import {
    JSDOM
} from 'jsdom';

// --- MOCK AudioContext PRIMA dei moduli reali ---
class MockAudioContext {
    resume() {
        return Promise.resolve();
    }
}
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// --- SETUP JSDOM MINIMO ---
const dom = new JSDOM(`
<!doctype html>
<html>
<body>
    <audio id="player"></audio>

    <div id="nowPlaying"></div>
    <div id="nowPlayingExt"></div>
    <div id="nowPlayingCover"><img/></div>
    <div id="trackInfoModal"></div>
    <div id="container"></div>
    <div id="messageBox"></div>
    <div class="ifmxScrollText"></div>

    <button class="close"></button>
    <button id="cbsChannelButton"></button>
    <button id="dfChannelButton"></button>
    <button id="tdmChannelButton"></button>
    <button id="stopButton"></button>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;

// --- MOCK AUDIO ---
const player = document.getElementById('player');
player.play = vi.fn().mockResolvedValue();
player.load = vi.fn();
player.pause = vi.fn();

// --- MOCK MEDIA SESSION ---
if (!('mediaSession' in global.navigator)) {
    global.navigator.mediaSession = {
        setActionHandler: vi.fn(),
        playbackState: '',
        metadata: null
    };
}

// --- MOCK CORDOVA ---
window.cordova = {
    platformId: 'android',
    plugins: {
        MusicService: {
            start: vi.fn(),
            setPlaying: vi.fn(),
            updateMetadata: vi.fn()
        }
    }
};

// --- COSTANTI E MODULI REALI ---
import * as CONST from '../www/js/constants.js';
Object.keys(CONST).forEach(key => window[key] = CONST[key]);

import '../src/index.js';
import '../src/audio.js';
