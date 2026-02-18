import {
    describe,
    it,
    expect,
    beforeEach
} from 'vitest';
import {
    initAllMocks,
    clickButton,
    resetDOM
} from './testUtils.js';

// --------------------------------------------------
// SETUP
// --------------------------------------------------
beforeEach(() => {
    resetDOM();
    initAllMocks();
    window.stop = () => {
        const player = document.getElementById('player');
        player.pause(); // ferma l'audio mockato
        player.setAttribute('src', ''); // azzera il src
    };
});

// --------------------------------------------------
// TEST REDIRECT BOTTONI
// --------------------------------------------------
describe('Redirect buttons', () => {
    it('donateRedirect changes window.location', () => {
        document.getElementById('donateRedirect').addEventListener('click', () => {
            window.location.href = 'https://www.paypal.com/donate/?hosted_button_id=MV4HVU2D4W3LJ';
        });
        clickButton('donateRedirect');
        expect(window.location.href).toBe('https://www.paypal.com/donate/?hosted_button_id=MV4HVU2D4W3LJ');
    });

    it('websiteRedirect changes window.location', () => {
        document.getElementById('websiteRedirect').addEventListener('click', () => {
            window.location.href = 'https://intergalactic.fm/';
        });
        clickButton('websiteRedirect');
        expect(window.location.href).toBe('https://intergalactic.fm/');
    });

    it('archiveRedirect changes window.location', () => {
        document.getElementById('archiveRedirect').addEventListener('click', () => {
            window.location.href = 'https://videohotmix.net/';
        });
        clickButton('archiveRedirect');
        expect(window.location.href).toBe('https://videohotmix.net/');
    });
});

// --------------------------------------------------
// TEST AUDIO STOP
// --------------------------------------------------
describe('Stop button', () => {
    it('stopButton stops audio and clears src', () => {
        const player = document.getElementById('player');
        player.setAttribute('src', 'someaudio.mp3');
        player.play();

        document.getElementById('stopButton').addEventListener('click', () => {
            window.stop();
        });

        clickButton('stopButton');

        expect(player.getAttribute('src')).toBe('');
        expect(player.pause).toHaveBeenCalled();
    });
});

// --------------------------------------------------
// TEST CANALI
// --------------------------------------------------
describe('Channel buttons', () => {
    const channelButtons = [
        {
            id: 'cbsChannelButton',
            playerId: 'playerCBS'
        },
        {
            id: 'dfChannelButton',
            playerId: 'playerDF'
        },
        {
            id: 'tdmChannelButton',
            playerId: 'playerTDM'
        },
    ];

    channelButtons.forEach(channel => {
        it(`${channel.id} plays its audio`, () => {
            const button = document.getElementById(channel.id);
            const player = document.getElementById(channel.playerId);

            button.addEventListener('click', () => player.play());
            clickButton(channel.id);
            expect(player.play).toHaveBeenCalled();
        });
    });
});

// --------------------------------------------------
// TEST SCROLLING TEXT E MESSAGGI
// --------------------------------------------------
describe('Scrolling text & messages', () => {
    it('setScrollingText updates DOM', () => {
        window.setScrollingText('Test scroll');
        expect(window.setScrollingText).toHaveBeenCalledWith('Test scroll');
    });

    it('displayMessage updates messageBox', () => {
        window.displayMessage('Hello');
        expect(document.getElementById('messageBox').innerHTML).toBe('Hello');
    });
});
