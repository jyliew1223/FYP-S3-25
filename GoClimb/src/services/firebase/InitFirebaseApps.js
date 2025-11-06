// src/services/firebase/InitFirebaseApps.js

/**
 * this will init all the firebase function
 * call when app startup
 * after that firebase instance will hanldle wll the firebase related task
 *
 * ------------------------------------------------------------------
 *
 * for logged in user, it will handle by Firebase Auth
 * u can get the current user by using
 *
 *    import { getAuth } from '@react-native-firebase/auth'
 *
 *    let user = getAuth().currentUser
 *
 * current user will be a instance og firebase user, it will contain multiple data, but the most important one is id_token
 * id token is a encypted token which represent user id, firebase wont return a user id by default, instead it returned with a id token
 * u can get the id token using:
 * -> getIdToken(user, force_refresh)
 *    -> user - the user u want
 *    -> force_refresh - telling SDK if u want to refresh the token, usually set it to false for performace issue the token can last for few hour after user logged in
 *
 * Example:
 *
 *    import { getIdToken, getAuth } from '@react-native-firebase/auth';
 *
 *    let idToken = await getIdToken(getAuth().currentUser, false);
 *
 * after u get the id_token u can get user_id by creating a request to our backend endpoint : auth/verify_id_token
 *
 * ----------------------------------------------------------------
 *
 * u can log user in with
 *
 *    import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
 *
 *    await signInWithEmailAndPassword(
 *           getAuth(),
 *           UserEmail,
 *           UserPassword,
 *         );
 *
 * note that this function is a async function which return a promise, us can use promise.then funtion for logic
 * after this u probably will need to query backend again for user id
 *
 * ----------------------------------------------------------------
 *
 * Sign Up for a firebase user
 *
 *    import { getAuth, signUpWithEmailAndPassword } from '@react-native-firebase/auth';
 *
 *    let user = await signUpWithEmailAndPassword({value});
 *
 * after sign up a firebase user, u will need do send a request to backend for creating user entry in our database
 * with endpoint auth/sign_up
 *
 * after u get response from backend, it most likely will contain user data, u can get the user_id from there
 *
 * ----------------------------------------------------------------
 */

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
        debugToken: 'EF346947-BDAD-436D-A3EE-45178EC50E39',
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

    const token =  getToken(appCheckInstance, true);
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
  console.log(`${TAG}: Firebase Apps initialized`);
  return true;
};

export default InitFirebaseApps;
