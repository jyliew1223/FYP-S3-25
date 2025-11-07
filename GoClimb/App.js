// GoClimb/App.js
import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

import { downloadFolderFromJson } from './src/services/firebase/FileDownloadHelper';
import InitFirebaseApps from './src/services/firebase/InitFirebaseApps';
import UnityView from '@azesmway/react-native-unity';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { UNSTABLE_UnhandledLinkingContext } from '@react-navigation/native';
import ModelPicker from './src/components/ModelPicker';

const downloadJson = `
{
      "folder": "crags/CRAG-000004/models/MODEL-000003/",
      "files": [
        {
          "name": "Image_0.001.png",
          "path": "crags/CRAG-000004/models/MODEL-000003/Image_0.001.png",
          "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/models/MODEL-000003/Image_0.001.png?Expires=1762438263&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=cK%2Bp5pbJ8heNdSQ%2FdqwNxNQlAmwxf85sd5ElIQg8liRFSN69crvceLJmlnzEshi28YAlZMltDjHHwvXMxCynj5cyXAQ2r0Bs8S%2FH6FvkNBKhn1NU%2F8%2FI5JPIkPgluj4heca96C5ZXPN9MhjlSU3bb6KNEFWvVg4Hamg5jIxRhJ6l4Zdqvh0717Zi%2BE9T5VLSyUK6Lm9e%2FjmwZkQclHNEB%2FG38Zg4y21vkjk2v%2FbEUiJS8KyxShROAwstEto46wYbFeoVbZIfZtxBDq%2F7qLqSpuO1TstH5mkX30yqZFEX7FUT49KR4Kpo1vTkQY0Gm3wVjztXYxp4gO67HiFH7yC08A%3D%3D"
        },
        {
          "name": "Image_1.001.png",
          "path": "crags/CRAG-000004/models/MODEL-000003/Image_1.001.png",
          "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/models/MODEL-000003/Image_1.001.png?Expires=1762438263&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=lxnG9Imq7Wr4L4ycvqin%2B9soXOv8twrHykjtElfi77X8S5DpJt9xaaBKfHYQ%2BNZuec8iMq5XVyvopbSi2BBqAFc%2BQQu0GPFzOUoaEEsTVb1%2BOEpnAmXFVGhIxuT%2FH9HggCBplPZMhuHGRjjln8OSv%2FrBwLZSw29n2qeTjIIyHXHn6EpeDQ5o43rFDt42xyE1%2FkVMjIyvyoviF2qhHWlTao2Tq0D2vyib82GQ5NVX51qdg3K0RDWoDWQo93taqGTHYNuLgDW%2B%2B3KY5iv7ggQTJbjNnv5Xm12CQ90v2uK9VjOEbgIjvO93LBVmkmHlDjHCZGvNKps1adx0RyiKpLU7YQ%3D%3D"
        },
        {
          "name": "TestModel.fbx",
          "path": "crags/CRAG-000004/models/MODEL-000003/TestModel.fbx",
          "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/models/MODEL-000003/TestModel.fbx?Expires=1762438263&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=ZvM2U54UoHAJYpAOngCBRR77B9dkPsQv8BqBU6u8d5PkL51Mz52il734At5gIChzPrEFbNN3majU9D2WIpxTGHxpdBfg%2FNjJUJCpRbJsq%2Fg%2Fule1KPWeeja%2FwZgCEgskM163rf3nYtDxYFit2dJ2yRbffr5QAR%2FY0f4l4Yjujw0uMZu8DeXIxpi33P6hBABf9zrKRrDZVjQIcLegJQ8t4amxUmPWdXjbZUOnhMSTemvvyxe7PoQZ%2B38OanQ1ZUte0gGISxfx78EqgdE%2F0L578D7NwkNsZIK44rKb0a1DnRjXecUXA%2FrrH9oH8oYa2NkVBFpKDF3zgkVuwp3PbYEt0g%3D%3D"
        },
        {
          "name": "test.glb",
          "path": "crags/CRAG-000004/models/MODEL-000003/test.glb",
          "download_url": "https://storage.googleapis.com/goclimb-39075.firebasestorage.app/crags/CRAG-000004/models/MODEL-000003/test.glb?Expires=1762438263&GoogleAccessId=firebase-adminsdk-fbsvc%40goclimb-39075.iam.gserviceaccount.com&Signature=lRDsHyWZxl1TFciIkFxDoQWH2rjfUdhsbqne0SaH%2FOvWeVGpltt2G0uAVk%2ByfAGYYtZtsy9FE2iYV3IGynmGmjKk4qfUXX2QvJpM9JGtkd9zIw0hiwM76DIUZ8bUU4uY1mcBiltoRojJdkFv04Sd5n70q4rSc7khRdQtr36qTsInaUEEZSDQHn7vDOpTvb5PgokgBgU5oczzK9PyetW91dSpGuVQYm22ilSnQrAtX8dCD0Kqmo%2BnHpX3o3MX3y23UMpGK6PPeF7HGnyYM00p%2Bs%2BM9si5RklorqDcd4ZtAoRGBh6hlqtHmAJL6D0Nl8xMIbgm4Uy8YwgtvzCN2rvMOw%3D%3D"
        }
      ]
    }
`;

const jsonData = {
  path: '/storage/emulated/0/Android/data/com.SIMFYPS330.GoClimb/files/GoClimb/crags/CRAG-000004/models/MODEL-000003//test.glb',
  normalizationJson: {
    scale: 0.001,
    pos_offset: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
    rot_offset: {
      x: 90.0,
      y: 0.0,
      z: 0.0,
    },
  },
  routeJson: {
    route_name: 'default_route',
    points: [
      {
        order: 1,
        pos: {
          x: 0.0,
          y: 0.0,
          z: 0.0,
        },
      },
      {
        order: 2,
        pos: {
          x: 1.0,
          y: 0.0,
          z: 0.0,
        },
      },
      {
        order: 3,
        pos: {
          x: 0.0,
          y: 1.0,
          z: 0.0,
        },
      },
      {
        order: 4,
        pos: {
          x: 0.0,
          y: 0.0,
          z: 1.0,
        },
      },
      {
        order: 5,
        pos: {
          x: 1.0,
          y: 1.0,
          z: 1.0,
        },
      },
    ],
  },
};

const Unity = () => {
  const unityRef = useRef(null);

  const sendMessageToUnity = () => {
    if (unityRef?.current) {
      console.log('Sending message to Unity...');

      // Send the 3 parameters as separate calls or combine them
      const path = jsonData.path;
      const normalizationJson = JSON.stringify(jsonData.normalizationJson);
      const routeJson = JSON.stringify(jsonData.routeJson);

      // Combine all 3 parameters into one message
      const combinedMessage = JSON.stringify(jsonData);

      unityRef.current.postMessage(
        'UnityReceiverManager',
        'OnModelReceivedPath',
        combinedMessage,
      );

      console.log('Message sent to Unity:', combinedMessage);
    } else {
      console.log('Unity ref not available');
    }
  };

  useEffect(() => {
    // Send message after Unity is loaded (with longer delay)
    const timer = setTimeout(() => {
      sendMessageToUnity();
    }, 3000); // Wait 3 seconds for Unity to fully load

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <UnityView
        ref={unityRef}
        style={{ flex: 1 }}
        onUnityMessage={result => {
          console.log('onUnityMessage', result.nativeEvent.message);
        }}
      />
      {/* Test button - remove this in production */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 1000,
          padding: 10,
          backgroundColor: '#007AFF',
          borderRadius: 5,
        }}
        onPress={sendMessageToUnity}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Send Message</Text>
      </TouchableOpacity>
    </View>
  );
};

function AppInner() {
  const { navTheme } = useTheme();
  return <RootNavigator navTheme={navTheme} />;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await InitFirebaseApps();
      } catch (err) {
        console.error('App initialization failed:', err);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // render your app after initialization
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          {/* <Unity /> */}
          <ModelPicker cragId={'CRAG-000004'} />
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
