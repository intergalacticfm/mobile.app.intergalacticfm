package fm.intergalactic;

import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import org.apache.cordova.*;
import org.json.JSONArray;

public class MusicController extends CordovaPlugin {
    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext cb) {
        Context app = cordova.getActivity().getApplicationContext();
        if ("start".equals(action)) {
            ContextCompat.startForegroundService(app, new Intent(app, MusicPlaybackService.class));
            cb.success(); return true;
        } else if ("stop".equals(action)) {
            app.stopService(new Intent(app, MusicPlaybackService.class));
            cb.success(); return true;
        }
        return false;
    }
}
