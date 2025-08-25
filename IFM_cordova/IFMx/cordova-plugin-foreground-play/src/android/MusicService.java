package fm.intergalactic;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.os.Build;

public class MusicService extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("start")) {
            Intent serviceIntent = new Intent(cordova.getActivity(), MusicPlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                cordova.getActivity().startForegroundService(serviceIntent);
            } else {
                cordova.getActivity().startService(serviceIntent);
            }
            callbackContext.success();
            return true;
        } else if (action.equals("stop")) {
            Intent serviceIntent = new Intent(cordova.getActivity(), MusicPlaybackService.class);
            cordova.getActivity().stopService(serviceIntent);
            callbackContext.success();
            return true;
        }else if ("updateMetadata".equals(action)) {
            String title = args.optString(0, "");
            String artist = args.optString(1, "");
            String album = args.optString(2, "");
            String cover = args.optString(3, "");

            Intent i = new Intent(cordova.getActivity(), MusicPlaybackService.class);
            i.setAction("ACTION_UPDATE_METADATA");
            i.putExtra("title", title);
            i.putExtra("artist", artist);
            i.putExtra("album", album);
            i.putExtra("cover", cover);
            cordova.getActivity().startService(i);
            callbackContext.success();
            return true;

        } else if ("setPlaying".equals(action)) {
            boolean playing = args.optBoolean(0, true);
            Intent i = new Intent(cordova.getActivity(), MusicPlaybackService.class);
            i.setAction("ACTION_SET_PLAYING");
            i.putExtra("playing", playing);
            cordova.getActivity().startService(i);
            callbackContext.success();
            return true;
        }
        return false;
    }
}
