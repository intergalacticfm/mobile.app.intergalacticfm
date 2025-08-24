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
        }
        return false;
    }
}
