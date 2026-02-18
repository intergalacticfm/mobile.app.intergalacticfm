import {
    vi
} from 'vitest';

/**
 * Inizializza tutti i mock globali e DOM per i test
 */
export function initAllMocks() {
    // MOCK AUDIO
    document.querySelectorAll('audio').forEach(a => {
        a.play = vi.fn();
        a.pause = vi.fn();
        a.load = vi.fn();
    });

    // MOCK FUNZIONI GLOBALI
    if (!window.setScrollingText) {
        window.setScrollingText = vi.fn();
    }
    if (!window.displayMessage) {
        window.displayMessage = (msg) => document.getElementById('messageBox').innerHTML = msg;
    }
    if (!window.stop) {
        window.stop = () => {
            const player = document.getElementById('player');
            player.pause();
            player.setAttribute('src', '');
        };
    }

    // MOCK window.location
    delete window.location;
    window.location = {
        href: ''
    };
}

/**
 * Click su un bottone tramite id
 * @param {string} id
 */
export function clickButton(id) {
    const button = document.getElementById(id);
    if (!button) throw new Error(`Button ${id} not found`);
    button.click();
}

/**
 * Resetta il DOM dei principali elementi per i test
 */
export function resetDOM() {
    document.body.innerHTML = `
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
    `;
}
