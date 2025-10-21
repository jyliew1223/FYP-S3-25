
## Create VENV
```ini
 python -m venv .venv               
```
## Set Up VENV
- Open .venv\Scripts\Activate.ps1 in a text editor.
- Add these lines at the end:
```ini
# Add below this line
$env:VIRTUAL_ENV = $VenvDir

$env:JAVA_HOME="C:\Users\PC\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
java --version      
  
```
## Start VENV
```ini
 & .venv\Scripts\Activate.ps1          
```
## Create new React Native project with Unity Compatable version
```ini
npx @react-native-community/cli init GoClimb --version 0.72.0
```
## CD into GoClimb
```ini
cd GoClimb          
```
## Check android/build.gradle:
```CSharp
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 29      // Change minSdkVersion to 29
        compileSdkVersion = 36  // Change compileSdkVersion to 39
        targetSdkVersion = 36   // Change targetSdkVersion to 39
    }
    repositories {
        // need to contain these field in repository
        google()
        mavenCentral()
    }
    dependencies {
        // Change gradle version to 8.2.0
        classpath("com.android.tools.build:gradle:8.2.0")
    }
}

// and add global settings
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}           
```
## Update gradle/wrapper/gradle-wrapper.properties:
```ini
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-all.zip
```
## Export UnityLibrary and copy it to android/
GoClimb/android/unityLibrary/

## Copy keepUnitySymbols.gradle to android/
GoClimb/android/keepUnitySymbols.gradle

## Copy arr files android/app/libs
GoClimb/android/app/libs/some.aar

## Update settings.gradle:
```CSharp
// add unityLibrary
include ':app',':unityLibrary'
```
## Add dependency in app/build.gradle:
```CSharp
dependencies {
    // add aar files
    implementation fileTree(dir: "libs", include: ["*.aar"])
    // add unityLibrary
    implementation project(':unityLibrary')
}         
```
## In unityLibrary/build.gradle, ensure:
```CSharp
// Not Tested: Can try comment out
// allprojects {
//     repositories {
//         google()
//         mavenCentral() // add in
//     }
// }

// change this from
apply from: '../shared/keepUnitySymbols.gradle' 
// to
apply from: '../keepUnitySymbols.gradle'    

// Comment out arr referenced by Unity as those will be added as global library
dependencies {
    implementation 'com.google.ar:core:1.45.0'
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    // implementation(name: 'IngameDebugConsole', ext:'aar')
    // implementation(name: 'VuforiaEngine', ext:'aar')
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core:1.9.0'
    implementation 'androidx.games:games-activity:3.0.5'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'

}

// add this to tell unity where is the StreamingAssets
def unityStreamingAssets = file("$projectDir/src/main/Unity/StreamingAssets")


android {

    // change this
    compileSdk rootProject.ext.compileSdkVersion
    
    // change these
    defaultConfig {
        minSdk rootProject.ext.minSdkVersion
        targetSdk rootProject.ext.targetSdkVersion
    }

    // need to add toString()
    androidResources {
        noCompress = ['.unity3d', '.ress', '.resource', '.obb', '.bundle', '.unityexp'] + unityStreamingAssets.toString().tokenize(', ')
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
    }

    buildFeatures {
        // Optional: disable unused features
        viewBinding true
    }
}   
```

## This value is needed by all Module level object
```ini
android {
    buildFeatures {
        buildConfig true // <--- enable BuildConfig generation
    }
}
```

## Add local.properties to andriod/
this is to tell unity what sdk to use
andriod/local.properties
```ini
sdk.dir=C\:\\Users\\PC\\AppData\\Local\\Android\\Sdk
```

## Build Project
cd into android/
Build Project
```bash
./gradlew build
```
Or Clean Build
```bash
./gradlew clean build --refresh-dependencies
```

Wait until the build is finish

## Edit unityLibrary/src/main/AndroidManifest
```ini
# remove this block, if not there will have 2 app get installed when running
      <intent-filter>
        <category android:name="android.intent.category.LAUNCHER" />
        <action android:name="android.intent.action.MAIN" />
      </intent-filter>         
```

## Add your UnityModule package
Create a package for your module, e.g., UnityPackage.java:
```java
// Example: UnityPackage.java
package com.goclimb;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class UnityPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new UnityModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}      
```

## Use a native module to start UnityActivity from React Native:
```java
// Example: UnityModule.java
package com.goclimb;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.unity3d.player.UnityPlayerGameActivity;
import android.content.Intent;

public class UnityModule extends ReactContextBaseJavaModule {
    public UnityModule(ReactApplicationContext reactContext) { super(reactContext); }
    @Override
    public String getName() { return "UnityModule"; }

    @ReactMethod
    public void openUnity() {
        Intent intent = new Intent(getReactApplicationContext(), UnityPlayerGameActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
}          
```

## Then, in MainApplication.java, register it:
```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new UnityPackage()); // <-- add this line
    return packages;
}           
```

## Call UnityModule from React Native
```js
import React from 'react';
import { View, Button, NativeModules } from 'react-native';

const { UnityModule } = NativeModules;

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Open Unity"
        onPress={() => {
          UnityModule.openUnity(); // Calls your Unity activity
        }}
      />
    </View>
  );
}       
```

## That’s it! Now, when you run the app:
```ini
npx react-native run-android           
```

## Running on specific device
get the device id
```ini
adb devices     
```
it will return
```ini
List of devices attached
R58M78H27LB     device     
```
then run
```ini
npx react-native run-android --deviceId R58M78H27LB 
```


## Start React Native server
```ini
npx react-native start
```


## Extra Setting Up Java in VENV
```ini
$env:JAVA_HOME="C:\Users\PC\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
java --version
```






# Below is Outdated info
## Build Extra Module via Android Studio
save all the files and open android studio in android/ folder
!!! if AGP show dont upgrade ur AGP if not unity will not work
error will be prompted for using a wrong JVM version for this project need to use JVM 17

Go to:
File->Settings->Build, Execution, Deployment->Gradle

change Gradle JDK to any version that uses JVM 17

## Add Vuforia and other External Asset as Module
Steps:
1. Create a New Android Library Module (and then modify it):
    - In Android Studio, go to File > New > New Module...
    - Select "Android Library" from the list of templates. Click Next.
    - Give your library module a name (e.g., vuforia-engine).- 
    - Choose a module name (usually the same as the library name).
    - Select a "Minimum SDK" (this usually doesn't matter too much for an AAR-only module, but you can match your project's minSdkVersion).
    - Click Finish.
2. Prepare the New Module for the AAR:
    - Once the new module (e.g., vuforia-engine) is created, navigate to its directory in the Project view (e.g., YourProject/vuforia-engine).
    - Delete the src directory (and its contents like main/java, main/res) inside this new module. You won't need these for an AAR-only module.
    - Create a libs folder inside the new module's root directory (e.g., YourProject/vuforia-engine/libs).
    - Copy your VuforiaEngine.aar file into this newly created libs folder (YourProject/vuforia-engine/libs/VuforiaEngine.aar).
3. Configure the build.gradle of the New Module:
    - Open the build.gradle file for your newly created module (e.g., YourProject/vuforia-engine/build.gradle or build.gradle.kts).
    - Modify it to look something like this:

```bash
**If using Groovy DSL (`build.gradle`):**
 // In YourProject/vuforia-engine/build.gradle

 plugins {
     id 'com.android.library'
     // Add kotlin-android if your main project uses it and you might add Kotlin files here later (optional for AAR-only)
     // id 'org.jetbrains.kotlin.android'
 }

 android {
     // Use the compileSdkVersion and minSdkVersion relevant for VuforiaEngine.aar
     // or match your main project's versions.
     namespace 'com.example.vuforiaengine' // CHANGE THIS to a unique namespace
     compileSdkVersion 34 // Or your project's compileSdkVersion

     defaultConfig {
         minSdkVersion 21 // Or your project's minSdkVersion
         // targetSdkVersion 34 // Not strictly needed for an AAR-only wrapper

         testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
     }

     buildTypes {
         release {
             minifyEnabled false
             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
         }
     }
     // Add compileOptions if needed for Java version compatibility
     compileOptions {
         sourceCompatibility JavaVersion.VERSION_1_8
         targetCompatibility JavaVersion.VERSION_1_8
     }
     // If you had kotlin-android plugin:
     // kotlinOptions {
     //     jvmTarget = '1.8'
     // }
 }

 dependencies {
     // This line tells Gradle to compile the AAR file from the libs folder
     implementation files('libs/VuforiaEngine.aar')

     // You generally won't need other dependencies here unless VuforiaEngine.aar
     // itself has transitive dependencies that aren't AARs and need to be declared.
     // api files('libs/VuforiaEngine.aar') // Use 'api' if :unityLibrary needs to directly access VuforiaEngine classes
 }
 ```


 **If using Kotlin DSL (`build.gradle.kts`):**
 ```bash
 // In YourProject/vuforia-engine/build.gradle.kts

 plugins {
     id("com.android.library")
     // Add kotlin-android if your main project uses it (optional for AAR-only)
     // id("org.jetbrains.kotlin.android")
 }

 android {
     // Use the compileSdkVersion and minSdkVersion relevant for VuforiaEngine.aar
     // or match your main project's versions.
     namespace = "com.example.vuforiaengine" // CHANGE THIS to a unique namespace
     compileSdk = 34 // Or your project's compileSdkVersion

     defaultConfig {
         minSdk = 21 // Or your project's minSdkVersion
         // targetSdk = 34 // Not strictly needed for an AAR-only wrapper

         testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
     }

     buildTypes {
         release {
             isMinifyEnabled = false
             proguardFiles(
                 getDefaultProguardFile("proguard-android-optimize.txt"),
                 "proguard-rules.pro"
             )
         }
     }
     // Add compileOptions if needed for Java version compatibility
     compileOptions {
         sourceCompatibility = JavaVersion.VERSION_1_8
         targetCompatibility = JavaVersion.VERSION_1_8
     }
     // If you had kotlin-android plugin:
     // kotlinOptions {
     //     jvmTarget = "1.8"
     // }
 }

 dependencies {
     // This line tells Gradle to compile the AAR file from the libs folder
     implementation(files("libs/VuforiaEngine.aar"))

     // You generally won't need other dependencies here.
     // api(files("libs/VuforiaEngine.aar")) // Use 'api' if :unityLibrary needs to directly access VuforiaEngine classes
 }      
```
4. Add the New Module as a Dependency to :unityLibrary:
    - Open the build.gradle (or build.gradle.kts) file for your :unityLibrary module.
    - Remove the old files('libs/VuforiaEngine.aar') dependency.- Add the new module as a dependency:

 **If using Groovy (`build.gradle`):**
 ```bash
 dependencies {
     // ... other dependencies of :unityLibrary         implementation project(':vuforia-engine') // Use the name you gave the module
 }
 ```


 **If using Kotlin DSL (`build.gradle.kts`):**
 ```bash
 dependencies {
     // ... other dependencies of :unityLibrary
     implementation(project(":vuforia-engine")) // Use the name you gave the module
 }
 ```

5. Ensure the Module is Included in settings.gradle(.kts):
    - Android Studio should have automatically added your new module (e.g., :vuforia-engine) to your project's settings.gradle (or settings.gradle.kts) file. Double-check that it's there. // In C:/Users/PC/Desktop/ReactNative/GoClimb/android/settings.gradle // [2] include ':app', ':unityLibrary', ':vuforia-engine' // Ensure your new module is listed // ... other includes

6. Sync Project with Gradle Files:
    - Click on "Sync Now" in the bar that appears at the top of Android Studio, or go to File > Sync Project with Gradle Files.