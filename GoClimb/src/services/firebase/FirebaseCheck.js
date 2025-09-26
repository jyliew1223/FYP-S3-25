import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {getApp, getApps, initializeApp} from '@react-native-firebase/app';
import appCheck, {
  getAppCheck,
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';

import {
  BaseApiResponse,
  CustomApiRequest,
  RequestMethod,
} from '../api/ApiHelper';
import {API_ENDPOINTS} from '../../constants/api';

export function FirebaseCheck() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        //   // Activate App Check for development
        //   appCheck().activate(new DebugProvider(), true);

        // Get token
        // Initialize App Check
        console.log(
          'Step 1: Initializing ReactNativeFirebaseAppCheckProvider...',
        );
        const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
        rnfbProvider.configure({
          android: {
            provider: __DEV__ ? 'debug' : 'playIntegrity',
            debugToken: '7FCE2587-63B8-4E4C-8EDB-017358A9DE84',
          },
          apple: {
            provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
            debugToken:
              'some token you have configured for your project firebase web console',
          },
          web: {
            provider: 'reCaptchaV3',
            siteKey: 'unknown',
          },
        });
        console.log('Step 1: Done!');

        console.log('Step 2: Initializing Firebase App Check...');
        const appCheckInstance = await initializeAppCheck(getApp(), {
          provider: rnfbProvider,
          isTokenAutoRefreshEnabled: true,
        });
        console.log('Step 2: Done!');

        try {
          // `appCheckInstance` is the saved return value from initializeAppCheck
          const {token} = await appCheckInstance.getToken(true);

          if (token.length > 0) {
            console.log('AppCheck verification passed');
          }
        } catch (error) {
          console.log('AppCheck verification failed: ' + error);
        }

        // Send request with App Check token in header
        const request = new CustomApiRequest(
          RequestMethod.GET,
          API_ENDPOINTS.BASE_URL,
          API_ENDPOINTS.AUTH.VERIFY_APP_CHECK_TOKEN,
          {},
          true,
        );

        const result = await request.sendRequest();
        console.log('API response:', request.logResponse(BaseApiResponse));

        setIsInitialized(!!result);
      } catch (err) {
        console.error('Firebase/AppCheck error:', err);
        setIsInitialized(false);
      }
    };

    init();
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {isInitialized ? (
        <Text>Firebase App Check is connected ✅</Text>
      ) : (
        <Text>Firebase App Check not initialized ❌</Text>
      )}
    </View>
  );
}
