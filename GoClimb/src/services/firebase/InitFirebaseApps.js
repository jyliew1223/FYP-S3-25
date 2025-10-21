// src/services/firebase/InitFirebaseApps.js

import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import {
  getToken,
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';
import {
  RequestMethod,
  BaseApiResponse,
  CustomApiRequest,
} from '../api/ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

const TAG = 'InitFirebaseApp';

const InitFirebaseApps = async () => {
  //==================================================================
  //Initialize Firebase Instance
  //==================================================================

  console.log(`${TAG}: Firebase initializing...`);

  try {
    const app = getApp();
  } catch (error) {
    console.log(`${TAG}: Firebase initialization failed ❌\n${error.message}`);
    return false;
  }

  //==================================================================
  // Initialize Firebase AppCheck
  //==================================================================

  console.log(`${TAG}: Initializing Firebase AppCheck...`);

  try {
    // Congigure App Check provider
    console.log(`${TAG}: Initializing ReactNativeFirebaseAppCheckProvider...`);

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

    // Initialize App Check with the provider
    const app = getApp();

    console.log(`${TAG}: Initializing Firebase App Check...`);

    const appCheckInstance = await initializeAppCheck(app, {
      provider: rnfbProvider,
      isTokenAutoRefreshEnabled: true,
    });

    const token = await getToken(appCheckInstance, true);
    if (!token || token.length === 0) {
      console.log(`${TAG}: Local AppCheck verification failed`);
      return false;
    }

    console.log(`${TAG}: AppCheck verification passed`);

    // Verify the App Check token via backend
    console.log(`${TAG}: Verifying Firebase App Check Token via backend...`);

    const request = new CustomApiRequest(
      RequestMethod.GET,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.AUTH.VERIFY_APP_CHECK_TOKEN,
      {},
      true,
    );

    const result = await request.sendRequest(BaseApiResponse);
    if (result) {
      console.log(`${TAG}: Backend AppCheck verification passed.`);
    } else {
      console.log(
        `${TAG}: Backend AppCheck verification failed.\n` +
          request.logResponse(),
      );
      return false;
    }
  } catch (err) {
    console.log(
      `${TAG}: Firebase AppCheck initialization failed ❌\n${error.message}`,
    );
    return false;
  }

  //==================================================================
  // Initialize Firebase Auth
  //==================================================================

  console.log(`${TAG}: Firebase Auth initializing...`);

  try {
    //Add listener to auth state changes
    onAuthStateChanged(getAuth(), async user => {
      console.log(
        `${TAG}: onAuthStateChanged triggered, current user: ${user.email}`,
      );
    });

    // Try log in
    if (getAuth().currentUser == null) {
      console.log(
        `${TAG}: Firebase Auth isn't initialized or no user is logged in...`,
      );

      // In dev mode, log in with test user for testing
      if (__DEV__) {
        console.log(`${TAG}: Try log in with testuser...`);

        const TestUserEmail = 'testuser001@gmail.com';
        const TestUserPassword = 'testuser001';

        await signInWithEmailAndPassword(
          getAuth(),
          TestUserEmail,
          TestUserPassword,
        );

        if (getAuth().currentUser == null) {
          console.log(`${TAG}: currentUser stil null after log in...`);
        } else {
          console.log(
            `${TAG}: Firebase Auth initialized, currentUser: ${
              getAuth().currentUser.email
            }`,
          );
        }
      }
    } else {
      let idToken = await getIdToken(getAuth().currentUser, false);
      console.log(
        `${TAG}: Firebase Auth initialized, current user token: ${idToken}`,
      );
    }
  } catch (error) {
    console.log(
      `${TAG}: Firebase Auth initialization failed ❌\n${error.message}`,
    );
    return false;
  }

  return true;
};

export default InitFirebaseApps;
