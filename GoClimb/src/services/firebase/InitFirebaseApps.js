//serivce/firebase/InitFirebasse.js

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

export default function InitFirebaseApps() {
  let isFirebaseInit = false;

  const handleInitFirebase = async () => {
    console.log(`${TAG}: Firebase initializing...`);
    try {
      const app = getApp(); // default app
      console.log(`${TAG}: Firebase app name: ${app.name}`);
    } catch (error) {
      console.log(
        `${TAG}: Firebase initialization failed ❌\n${error.message}`,
      );
      return;
    }

    console.log(`${TAG}: Initializing Firebase AppCheck...`);
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
      console.log(`${TAG}: ReactNativeFirebaseAppCheckProvider Initialized...`);

      const app = getApp();

      console.log(`${TAG}: Initializing Firebase App Check...`);
      const appCheckInstance = await initializeAppCheck(app, {
        provider: rnfbProvider,
        isTokenAutoRefreshEnabled: true,
      });

      console.log(`${TAG}: Firebase App Check Initialized.`);

      const token = await getToken(appCheckInstance, true);
      if (!token || token.length === 0) {
        console.log(`${TAG}: Local AppCheck verification failed`);
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

      console.log(`${TAG}: Sending request...`);

      const result = await request.sendRequest(BaseApiResponse);
      if (result) {
        console.log(`${TAG}: Backend AppCheck verification passed.`);
      } else {
        console.log(
          `${TAG}: Backend AppCheck verification failed.\n` +
            request.logResponse(),
        );
        return;
      }
    } catch (err) {
      console.log(
        `${TAG}: Firebase AppCheck initialization failed ❌\n${error.message}`,
      );
      return;
    }

    console.log(`${TAG}: Firebase Auth initializing...`);
    try {
      onAuthStateChanged(getAuth(), async user => {
        console.log(
          `${TAG}: onAuthStateChanged triggered, current user: ${user.email}`,
        );
      });

      if (getAuth().currentUser == null) {
        console.log(
          `${TAG}: Firebase Auth isn't initialized or no user is logged in...`,
        );

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
      return;
    }

    isFirebaseInit = true;
  };

  handleInitFirebase();

  return isFirebaseInit;
}
