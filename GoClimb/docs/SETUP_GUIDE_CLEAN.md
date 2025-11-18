# React Native + Unity Integration Guide

This guide walks you through setting up a React Native project with Unity integration on Windows.

## Prerequisites

- Python 3.x
- Node.js and npm
- Android Studio
- Java JDK 17
- Unity (with Android build support)

## 1. Environment Setup


## Create virtual environment
```powershell
python -m venv .venv

```

### Configure Java Environment

Add these lines to `.venv\Scripts\Activate.ps1`:

```powershell
# Java configuration
$env:JAVA_HOME="C:\Users\PC\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
java --version

# Set Android SDK
$env:ANDROID_HOME="C:\Users\PC\AppData\Local\Android\Sdk"
$env:PATH="$env:PATH;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:ANDROID_HOME\platform-tools"

# Add adb to PATH
$env:PATH="$env:PATH;C:\Users\PC\AppData\Local\Android\Sdk\platform-tools"

# Check if adb works
adb --version
```

## Activate virtual environment
```powershell
& .venv\Scripts\Activate.ps1
```

## 2. React Native Project Setup

### Create Project

```bash
# Create React Native project with Unity-compatible version
npx @react-native-community/cli init GoClimb --version 0.72.0
cd GoClimb
```

### Configure Android Build Settings

#### Update `android/build.gradle`:

```gradle
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

// And add global settings
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

#### Update `gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-all.zip
```

#### Create `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\PC\\AppData\\Local\\Android\\Sdk
```

## 3. Unity Integration

### File Structure Setup

1. Export UnityLibrary from Unity and copy to `android/unityLibrary/`
2. Copy `keepUnitySymbols.gradle` to `android/`
3. Copy AAR files to `android/app/libs/`

### Configure Gradle Files

#### Update `android/settings.gradle`:

```gradle
include ':app', ':unityLibrary'
```

#### Update `android/app/build.gradle`:

```gradle
dependencies {
    implementation fileTree(dir: "libs", include: ["*.aar"])
    implementation project(':unityLibrary')
    // ... other dependencies
}

// This buildConfig need to be set to every Module
android{
    buildFeatures {
        buildConfig true
    }
}
```

#### Configure `android/unityLibrary/build.gradle`:

```gradle
// Can comment out
// allprojects {
//     repositories {
//         google()
//         mavenCentral()
//     }
// }

// Update apply from path
apply from: '../keepUnitySymbols.gradle'

// Configure dependencies
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

// Configure StreamingAssets
def unityStreamingAssets = file("$projectDir/src/main/Unity/StreamingAssets")

android {
    compileSdk rootProject.ext.compileSdkVersion
    
    defaultConfig {
        minSdk rootProject.ext.minSdkVersion
        targetSdk rootProject.ext.targetSdkVersion
    }

    // Add toString()
    androidResources {
        noCompress = ['.unity3d', '.ress', '.resource', '.obb', '.bundle', '.unityexp'] + unityStreamingAssets.toString().tokenize(', ')
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
    }

    buildFeatures {
        viewBinding true
        buildConfig true
    }
}
```

### Build Project

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

### Fix Unity Manifest

Edit `unityLibrary/src/main/AndroidManifest.xml` and remove this block to prevent duplicate app installation:

```xml
<intent-filter>
    <category android:name="android.intent.category.LAUNCHER" />
    <action android:name="android.intent.action.MAIN" />
</intent-filter>
```

## 4. React Native Bridge Setup

### Create Unity Package

Create `android/app/src/main/java/com/goclimb/UnityPackage.java`:

```java
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

### Create Unity Module

Create `android/app/src/main/java/com/goclimb/UnityModule.java`:

```java
package com.goclimb;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.unity3d.player.UnityPlayerGameActivity;
import android.content.Intent;

public class UnityModule extends ReactContextBaseJavaModule {
    public UnityModule(ReactApplicationContext reactContext) { 
        super(reactContext); 
    }
    
    @Override
    public String getName() { 
        return "UnityModule"; 
    }

    @ReactMethod
    public void openUnity() {
        Intent intent = new Intent(getReactApplicationContext(), UnityPlayerGameActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
}
```

### Register Package

Update `MainApplication.java`:

```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new UnityPackage()); // Add this line
    return packages;
}
```

## 5. React Native Implementation

### Use Unity Module in React Native

```javascript
import React from 'react';
import { View, Button, NativeModules } from 'react-native';

const { UnityModule } = NativeModules;

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Open Unity"
        onPress={() => {
          UnityModule.openUnity();
        }}
      />
    </View>
  );
}
```

## 6. Building and Running

### Build Project

```bash
# Navigate to android directory
cd android

# Build project
./gradlew build

# Or clean build if needed
./gradlew clean build --refresh-dependencies
```

### Run Application

```bash
# Start Metro bundler
npx react-native start

# Run on Android (in separate terminal)
npx react-native run-android

# Run on specific device
adb devices  # Get device ID
npx react-native run-android --deviceId YOUR_DEVICE_ID
```

## Troubleshooting

### Common Issues

- **AGP Version**: Don't upgrade Android Gradle Plugin when prompted - Unity compatibility issues
- **JVM Version**: Use JVM 17 in Android Studio (File → Settings → Build, Execution, Deployment → Gradle)
- **Duplicate Apps**: Remove launcher intent-filter from Unity manifest
- **Build Failures**: Ensure all paths and dependencies are correctly configured

### Java Environment Variables

If Java environment isn't set up correctly:

```powershell
$env:JAVA_HOME="C:\Users\PC\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
java --version
```