package fm.intergalactic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
    private NotificationManager notificationManager;

    @Override
    public void onCreate() {
        super.onCreate();

        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Android notification channel creation
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Music playback", NotificationManager.IMPORTANCE_LOW);
            if (notificationManager != null) notificationManager.createNotificationChannel(ch);
        }

        // MediaSession configuration
        mediaSession = new MediaSessionCompat(this, "MusicService");
        mediaSession.setActive(true);

        // Show basic notification to avoid inactivity crash
        Notification initialNotification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Music Service")
                .setContentText("Starting…")
                .setSmallIcon(getApplicationInfo().icon)
                .setOngoing(true)
                .build();

        startForeground(NOTIF_ID, initialNotification);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "ACTION_UPDATE_METADATA".equals(intent.getAction())) {
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            String album = intent.getStringExtra("album");
            String cover = "www/" + intent.getStringExtra("cover");

            Bitmap coverBitmap = getBitmapFromAssets(cover);

            // Metadata update
            MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album);

            if (coverBitmap != null) {
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, coverBitmap);
            }

            mediaSession.setMetadata(metaBuilder.build());

            // Playback state
            PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                    .setState(PlaybackStateCompat.STATE_PLAYING,
                            PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                            1.0f)
                    .build();
            mediaSession.setPlaybackState(state);

            // Notification update
            Notification updatedNotification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(artist)
                    .setSmallIcon(getApplicationInfo().icon)
                    .setLargeIcon(coverBitmap)
                    .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                            .setMediaSession(mediaSession.getSessionToken()))
                    .setOngoing(true)
                    .build();

            if (notificationManager != null) {
                notificationManager.notify(NOTIF_ID, updatedNotification);
            }
        }

        return START_STICKY;
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
