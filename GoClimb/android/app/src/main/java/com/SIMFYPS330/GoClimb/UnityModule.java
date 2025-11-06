// package com.SIMFYPS330.GoClimb;

// import com.facebook.react.bridge.ReactApplicationContext;
// import com.facebook.react.bridge.ReactContextBaseJavaModule;
// import com.facebook.react.bridge.ReactMethod;
// import com.unity3d.player.UnityPlayerGameActivity;
// import com.unity3d.player.UnityPlayer;
// import android.content.Intent;

// public class UnityModule extends ReactContextBaseJavaModule {

//     public UnityModule(ReactApplicationContext reactContext) {
//         super(reactContext);
//     }

//     @Override
//     public String getName() {
//         return "UnityModule";
//     }

//     @ReactMethod
//     public void openUnity() {
//         Intent intent = new Intent(getReactApplicationContext(), UnityPlayerGameActivity.class);
//         intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//         getReactApplicationContext().startActivity(intent);
//     }

//     @ReactMethod
//     public void openUnityWithData(String path, String normalizationJson, String routeJson) {
//         // Open Unity first
//         Intent intent = new Intent(getReactApplicationContext(), UnityPlayerGameActivity.class);
//         intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//         getReactApplicationContext().startActivity(intent);
        
//         // Try to send the message after a delay
//         new Thread(() -> {
//             try {
//                 Thread.sleep(3000); // Wait 3 seconds for Unity to load
                
//                 // Combine the 3 parameters into JSON format
//                 String combinedData = String.format(
//                     "{\"path\":\"%s\",\"normalizationJson\":\"%s\",\"routeJson\":\"%s\"}", 
//                     path != null ? path : "", 
//                     normalizationJson != null ? normalizationJson : "", 
//                     routeJson != null ? routeJson : ""
//                 );
                
//                 UnityPlayer.UnitySendMessage("UnityReceiverManager", "OnModelReceivedPath", combinedData);
//             } catch (Exception e) {
//                 // Handle errors silently
//             }
//         }).start();
//     }

//     @ReactMethod
//     public void sendMessage(String gameObject, String methodName, String message) {
//         try {
//             UnityPlayer.UnitySendMessage(gameObject, methodName, message);
//         } catch (Exception e) {
//             // Silently handle any errors
//         }
//     }
// }