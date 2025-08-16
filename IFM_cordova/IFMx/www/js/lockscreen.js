document.addEventListener('deviceready', function () {
    //function lockscreenControls() {
    // Creiamo i controlli
    MusicControls.create({
        track: 'Titolo Brano',
        artist: 'Nome Artista',
        album: 'Nome Album',
        //cover       : 'https://example.com/cover.jpg', // oppure percorso locale file://
        isPlaying: true,
        dismissable: true,

        hasPrev: true,
        hasNext: true,
        hasClose: true,
        ticker: 'In riproduzione...'
    }, onSuccess, onError);

    // Ascoltiamo gli eventi dei controlli
    MusicControls.subscribe(eventsHandler);
    MusicControls.listen(); // attiva il listener
});
//}

function onSuccess() {
    alert('Controlli creati');
}

function onError() {
    console.error('Errore creazione controlli');
}

function eventsHandler(action) {
    const message = JSON.parse(action).message;
    switch (message) {
        case 'music-controls-next':
            console.log('Next pressed');
            // metti qui il tuo player.next()
            break;
        case 'music-controls-previous':
            console.log('Previous pressed');
            // player.previous()
            break;
        case 'music-controls-pause':
            console.log('Pause pressed');
            MusicControls.updateIsPlaying(false); // aggiorna lockscreen
            // player.pause()
            break;
        case 'music-controls-play':
            console.log('Play pressed');
            MusicControls.updateIsPlaying(true);
            // player.play()
            break;
        case 'music-controls-destroy':
            console.log('Close pressed');
            MusicControls.destroy();
            break;
        default:
            break;
    }
}
