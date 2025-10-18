// src/service/firebase/AppCheckStatusCheck.js

import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';

import { firebase } from '@react-native-firebase/app';

import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';

import { CustomApiRequest, RequestMethod } from '../api/ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

const TAG = 'AppCheckStatusCheck';

export default function AppCheckStatusCheck() {
  const [isFirebaseAppCheckInit, setIsFirebaseAppCheckInit] = useState(false);

  const handleFirebaseAppCheckInit = async () => {
    try {
      console.log(
        `${TAG}: Initializing ReactNativeFirebaseAppCheckProvider...`,
      );

      const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
      rnfbProvider.configure({
        android: {
          provider: __DEV__ ? 'debug' : 'playIntegrity',
          debugToken: '7FCE2587-63B8-4E4C-8EDB-017358A9DE84',
        },
        apple: {
          provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
          debugToken: 'YOUR_DEBUG_TOKEN',
        },
        web: {
          provider: 'reCaptchaV3',
          siteKey: 'unknown',
        },
      });

      const app = firebase.app(); // instead of getApp()

      console.log(`${TAG}: Initializing Firebase App Check...`);
      const appCheckInstance = await initializeAppCheck(app, {
        provider: rnfbProvider,
        isTokenAutoRefreshEnabled: true,
      });

      console.log(`${TAG}: Firebase App Check Initialized.`);

      const token = await appCheckInstance.getToken({ forceRefresh: true });
      if (!token || token.length === 0) {
        console.log(`${TAG}: Local AppCheck verification failed`);
        setIsFirebaseAppCheckInit(false);
        return;
      }

      console.log(`${TAG}: AppCheck verification passed`);

      console.log(`${TAG}: Verifying Firebase App Check Token via backend...`);

      const request = new CustomApiRequest(
        RequestMethod.GET,
        API_ENDPOINTS.BASE_URL,
        API_ENDPOINTS.AUTH.VERIFY_APP_CHECK_TOKEN,
        {},
        true,
      );

      const result = await request.sendRequest();
      if (result) {
        console.log(`${TAG}: Backend AppCheck verification passed.`);
        setIsFirebaseAppCheckInit(true);
        return;
      } else {
        console.log(
          `${TAG}: Backend AppCheck verification failed.\n` +
            request.logResponse(),
        );
        setIsFirebaseAppCheckInit(false);
        return;
      }
    } catch (err) {
      console.error(`${TAG} error:`, err);
      setIsFirebaseAppCheckInit(false);
      return;
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Check App Check" onPress={handleFirebaseAppCheckInit} />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Text>
          {isFirebaseAppCheckInit
            ? 'Firebase AppCheck is initialized ✅'
            : 'Firebase AppCheck not initialized ❌'}
        </Text>
      </View>
    </View>
  );
}
