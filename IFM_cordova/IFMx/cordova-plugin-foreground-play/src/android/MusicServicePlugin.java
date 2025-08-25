package fm.intergalactic;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;

public class MusicServicePlugin extends CordovaPlugin {

    private static CordovaWebView webView;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        webView = this.webView; // salva il riferimento alla WebView
        // eventuali azioni JS possono essere implementate qui
        return true;
    }

    // Metodo statico richiamabile dal Service
    public static void sendEventToJS(String eventName) {
        if (webView != null) {
            final String js = String.format("cordova.plugins.MusicService.setEventListenerCallback('%s');", eventName);
            webView.getEngine().evaluateJavascript(js, null);
        }
    }
}
