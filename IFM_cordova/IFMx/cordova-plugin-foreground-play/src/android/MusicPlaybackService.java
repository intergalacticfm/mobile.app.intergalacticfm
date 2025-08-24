package fm.intergalactic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;

import androidx.core.app.NotificationCompat;

public class MusicPlaybackService extends Service {
    private static final String CHANNEL_ID = "music_playback";
    private static final int NOTIF_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Music playback", NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(getApplicationInfo().icon)
                .setContentTitle(getApplicationInfo().loadLabel(getPackageManager()))
                .setContentText("Playing music")
                .setOngoing(true)
                .build();

        startForeground(NOTIF_ID, notif);

        // TODO: start your audio player here
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build();
            AudioFocusRequest request = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                request = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(attrs)
                        .setAcceptsDelayedFocusGain(true)
                        .setOnAudioFocusChangeListener(focusChange -> {})
                        .build();
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                am.requestAudioFocus(request);
            }
        }

        // MediaSession to keep service active in lockscreen
        MediaSessionCompat mediaSession = new MediaSessionCompat(this, "MusicService");
        mediaSession.setActive(true);

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        // TODO: stop/release player
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
