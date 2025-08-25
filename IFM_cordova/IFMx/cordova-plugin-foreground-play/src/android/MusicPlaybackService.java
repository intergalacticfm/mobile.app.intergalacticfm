package fm.intergalactic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.io.InputStream;

public class MusicPlaybackService extends Service {
    private static final String CHANNEL_ID = "music_playback";
    private static final int NOTIF_ID = 1001;

    private MediaSessionCompat mediaSession;
    private AudioManager audioManager;

    @Override
    public void onCreate() {
        super.onCreate();

        // Creazione canale notifiche per Android O+
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Music playback", NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }

        // Configura MediaSession
        mediaSession = new MediaSessionCompat(this, "MusicService");
        mediaSession.setActive(true);

        // Configura AudioFocus
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build();

            AudioFocusRequest request = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(focusChange -> {})
                    .build();

            audioManager.requestAudioFocus(request);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        // Notifica di base per restare in foreground
        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(getApplicationInfo().icon)
                .setContentTitle("Playing music")
                .setOngoing(true)
                .build();

        startForeground(NOTIF_ID, notif);

        if (intent != null && "ACTION_UPDATE_METADATA".equals(intent.getAction())) {
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            String album = intent.getStringExtra("album");
            String cover = "www/"+intent.getStringExtra("cover"); // es: "www/img/tdm128.png"

            // Carica cover da assets
            Bitmap coverBitmap = getBitmapFromAssets(cover);

            // Aggiorna metadati
            MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album);

            if (coverBitmap != null) {
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, coverBitmap);
            }

            mediaSession.setMetadata(metaBuilder.build());

            // Stato playback
            PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                    .setActions(
                            PlaybackStateCompat.ACTION_PLAY |
                                    PlaybackStateCompat.ACTION_PAUSE |
                                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    )
                    .setState(PlaybackStateCompat.STATE_PLAYING,
                            PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                            1.0f)
                    .build();
            mediaSession.setPlaybackState(state);

            // Notifica con controlli media
            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(artist)
                    .setSmallIcon(getApplicationInfo().icon)
                    .setLargeIcon(coverBitmap)
                    .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                            .setMediaSession(mediaSession.getSessionToken())
                            .setShowActionsInCompactView(0, 1, 2))
                    .addAction(new NotificationCompat.Action(
                            android.R.drawable.ic_media_previous, "Previous", null))
                    .addAction(new NotificationCompat.Action(
                            android.R.drawable.ic_media_pause, "Pause", null))
                    .addAction(new NotificationCompat.Action(
                            android.R.drawable.ic_media_next, "Next", null))
                    .setOngoing(true)
                    .build();

            startForeground(NOTIF_ID, notification);
        }

        return START_STICKY; // mantiene vivo il service
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Helper per caricare immagini da assets
    private Bitmap getBitmapFromAssets(String filePath) {
        if (filePath == null) return null;
        try (InputStream is = getAssets().open(filePath)) {
            return BitmapFactory.decodeStream(is);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}
