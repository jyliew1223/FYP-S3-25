
// Example: UnityModule.java
package com.SIMFYPS330.GoClimb;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
//import com.unity3d.player.UnityPlayerGameActivity;
import android.content.Intent;

public class UnityModule extends ReactContextBaseJavaModule {
    public UnityModule(ReactApplicationContext reactContext) { super(reactContext); }
    @Override
    public String getName() { return "UnityModule"; }

    @ReactMethod
    public void openUnity() {
       // Intent intent = new Intent(getReactApplicationContext(), UnityPlayerGameActivity.class);
       // intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
       // getReactApplicationContext().startActivity(intent);
    }
}          