import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from 'vitest';
import * as constants from '../www/js/constants.js';
import {
    fetchedStations,
    fetchStations
} from '../www/js/index.js';
import {
    playChannel
} from '../www/js/audio.js';

// --- MOCK AudioContext PRIMA dei moduli reali ---
class MockAudioContext {
    resume() {
        return Promise.resolve();
    }
}
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

describe('Channel button behaviour (real DOM, CBS button)', () => {

    beforeEach(async () => {
        // --- Pulizia DOM ---
        document.body.innerHTML = '';

        // Container e modal
        const container = document.createElement('div');
        container.id = constants.CONTAINER_ID;
        container.style.display = 'block';
        document.body.appendChild(container);

        const modal = document.createElement('div');
        modal.id = constants.TRACK_INFO_MODAL_ID;
        modal.style.display = 'none';
        document.body.appendChild(modal);

        // Bottoni canale
  [constants.CBS_BUTTON_ID, constants.DF_BUTTON_ID, constants.TDM_BUTTON_ID].forEach(id => {
            const btn = document.createElement('button');
            btn.id = id;
            document.body.appendChild(btn);
        });

        // Bottone STOP
        const stopButton = document.createElement('button');
        stopButton.id = constants.STOP_BUTTON_ID;
        stopButton.className = constants.CLOSE;
        document.body.appendChild(stopButton);

        // Now Playing divs
        const nowPlayingDiv = document.createElement('div');
        nowPlayingDiv.id = constants.NOW_PLAYING_DIV_ID;
        document.body.appendChild(nowPlayingDiv);

        const nowPlayingExtDiv = document.createElement('div');
        nowPlayingExtDiv.id = constants.NOW_PLAYING_DIV_EXT_ID;
        document.body.appendChild(nowPlayingExtDiv);

        const nowPlayingCoverDiv = document.createElement('div');
        nowPlayingCoverDiv.id = constants.NOW_PLAYING_COVER_DIV_ID;
        const img = document.createElement('img'); // placeholder
        nowPlayingCoverDiv.appendChild(img);
        document.body.appendChild(nowPlayingCoverDiv);

        // Scroll text e message box
        const scrollDiv = document.createElement('div');
        scrollDiv.className = constants.IFMX_SCROLL_TEXT_CLASS_NAME;
        document.body.appendChild(scrollDiv);

        const messageBox = document.createElement('div');
        messageBox.id = constants.DISPLAY_MESSAGE_BOX_ID;
        document.body.appendChild(messageBox);

        // --- Link della pagina per evitare TypeError ---
  [constants.DONATE_LINK_ID, constants.WEBSITE_LINK_ID, constants.ARCHIVE_LINK_ID].forEach(id => {
            const link = document.createElement('button'); // button basta per il test
            link.id = id;
            document.body.appendChild(link);
        });

        // Audio player
        const audio = document.createElement('audio');
        audio.id = constants.PLAYER_HTML_ID;
        audio.play = vi.fn().mockResolvedValue();
        audio.load = vi.fn();
        audio.pause = vi.fn();
        document.body.appendChild(audio);

        // --- Dispatch DOMContentLoaded per inizializzare AUDIO_PLAYER ---
        window.dispatchEvent(new Event('DOMContentLoaded'));

        // --- Mock AudioContext ---
        class MockAudioContext {
            resume() {
                return Promise.resolve();
            }
        }
        window.AudioContext = MockAudioContext;
        window.webkitAudioContext = MockAudioContext;

        // --- Mock fetch per stazioni e now playing ---
        vi.stubGlobal('fetch', vi.fn((url) => {
            if (url === constants.STATIONS_JSON_URL) {
                return Promise.resolve({
                    status: 200,
                    json: () => Promise.resolve({
                        stations: [
                            {
                                name: "Cybernetic Broadcasting System",
                                url: "https://radio.intergalactic.fm/x",
                                nowplaying: "https://tracks.intergalactic.fm/station/1.json?limit=1&offset=0"
                            },
                            {
                                name: "Disco Fetish",
                                url: "https://radio.intergalactic.fm/xx",
                                nowplaying: "https://tracks.intergalactic.fm/station/2.json?limit=1&offset=0"
                            },
                            {
                                name: "The Dream Machine",
                                url: "https://radio.intergalactic.fm/xxx",
                                nowplaying: "https://tracks.intergalactic.fm/station/3.json?limit=1&offset=0"
                            }
          ]
                    })
                });
            } else if (url.startsWith(constants.NOW_PLAYING_REQUEST_PREFIX)) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        station_message: "Alone and Unafraid",
                        image_file: "https://www.intergalactic.fm/sites/default/files/covers/nwo18.jpg",
                        title: " INTERGALACTIC FM - Just Do What We Say ...",
                        poll_after: 4
                    })
                });
            }
        }));

        // Popola fetchedStations
        await fetchStations();
    });

    it('clicking CBS channel button hides container and shows the now playing modal', async () => {
        const container = document.getElementById(constants.CONTAINER_ID);
        const modal = document.getElementById(constants.TRACK_INFO_MODAL_ID);
        const coverDiv = document.getElementById(constants.NOW_PLAYING_COVER_DIV_ID);

        // Stato iniziale
        expect(container.style.display).not.toBe('none');
        expect(modal.style.display).toBe('none');
        expect(coverDiv.querySelector('img')).not.toBeNull();

        // Click CBS tramite playChannel
        await playChannel(0);

        // Attende microtask per feedNowPlaying
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verifica DOM aggiornato
        expect(container.style.display).toBe('none');
        expect(modal.style.display).toBe('block');

        // Verifica fetchedStations popolato correttamente
        expect(fetchedStations.length).toBe(3);
        expect(fetchedStations[0].src).toBe("https://radio.intergalactic.fm/x");
    });

});
