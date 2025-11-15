// src/services/api/AuthApi.js

import { getAuth, getIdToken } from '@react-native-firebase/auth';
import {
  RequestMethod,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import { UserModel } from './ApiModels';

// Removed SignUpPayload class - using plain object instead

// Removed SignUpResponse class - using direct JSON parsing instead

export async function registerUserInDjango(usernameFromClient) {
  console.log('[registerUserInDjango] === START ===');
  
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    console.log('[registerUserInDjango] ERROR: No Firebase user logged in');
    throw new Error('No Firebase user is logged in after signup.');
  }

  console.log('[registerUserInDjango] Current user UID:', currentUser.uid);
  console.log('[registerUserInDjango] Current user email:', currentUser.email);

  // Get ID token using the pattern from InitFirebaseApps.js line 215
  const idToken = await getIdToken(currentUser, false);
  console.log('[registerUserInDjango] Got ID token, length:', idToken?.length);
  
  const email = currentUser.email;

  // Build payload with ONLY id_token, username, and email
  // Backend will extract user_id from the id_token
  const payload = {
    id_token: idToken,
    username: usernameFromClient,
    email: email,
  };

  console.log('[registerUserInDjango] Payload:', JSON.stringify({
    username: usernameFromClient,
    email: email,
    id_token_length: idToken?.length,
  }));

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    'auth/signup/',
    payload,
    true // attach App Check token header
  );

  console.log('[registerUserInDjango] Sending request to:', API_ENDPOINTS.BASE_URL + 'auth/signup/');
  
  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[registerUserInDjango] Response success:', response?.success);
  console.log('[registerUserInDjango] Response message:', response?.message);
  console.log('[registerUserInDjango] Response status:', response?.status);
  console.log('[registerUserInDjango] Response errors:', response?.errors);
  
  if (!response?.success) {
    console.log('[registerUserInDjango] FULL RESPONSE DEBUG:');
    console.log(request.logResponse?.());
  }
  
  console.log('[registerUserInDjango] === END ===');

  return {
    ok: !!response?.success,
    status: response?.status,
    message: response?.message ?? null,
    errors: response?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

// Removed GetUserPayload class - using plain object instead

// Removed GetUserResponse class - using direct JSON parsing instead

export async function fetchCurrentUserFromDjango() {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('No Firebase session found.');
  }

  // Get ID token using the pattern from InitFirebaseApps.js
  const idToken = await getIdToken(currentUser, false);

  const payload = {
    id_token: idToken,
  };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.GET_USER,
    payload,
    true // attach App Check token header
  );

  await request.sendRequest();
  const response = request.JsonObject;

  return {
    ok: !!response?.success,
    status: response?.status,
    message: response?.message ?? null,
    user: response?.data ? UserModel.fromJson(response.data) : null,
    errors: response?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

// Removed UpdateUserPayload class - using plain object instead

// Removed UpdateUserResponse class - using direct JSON parsing instead

export async function updateUserInDjango({ username, email, profile_picture }) {
  console.log('[updateUserInDjango] === START ===');
  
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    console.log('[updateUserInDjango] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[updateUserInDjango] Current user UID:', currentUser.uid);

  const payload = {
    user_id: currentUser.uid,
    username: username,
    email: email,
  };

  // Only include profile_picture if it's provided
  if (profile_picture !== undefined) {
    payload.profile_picture = profile_picture;
  }

  console.log('[updateUserInDjango] Payload:', JSON.stringify(payload));

  const request = new CustomApiRequest(
    RequestMethod.PUT,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.UPDATE_USER,
    payload,
    true // attach App Check token header
  );

  console.log('[updateUserInDjango] Sending request...');
  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[updateUserInDjango] Response:', response);
  console.log('[updateUserInDjango] === END ===');

  return {
    ok: !!response?.success,
    status: response?.status,
    message: response?.message ?? null,
    user: response?.data ? UserModel.fromJson(response.data) : null,
    errors: response?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

// Removed GetUserByIdPayload class - using plain object instead

// Removed GetUserByIdResponse class - using direct JSON parsing instead

export async function fetchUserByIdFromDjango(userId) {
  console.log('[fetchUserByIdFromDjango] === START ===');
  console.log('[fetchUserByIdFromDjango] Fetching user with ID:', userId);

  const payload = {
    user_id: userId,
  };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.GET_USER_BY_ID,
    payload,
    true // attach App Check token header
  );

  console.log('[fetchUserByIdFromDjango] Sending request...');
  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[fetchUserByIdFromDjango] Response:', response);
  console.log('[fetchUserByIdFromDjango] === END ===');

  return {
    ok: !!response?.success,
    status: response?.status,
    message: response?.message ?? null,
    user: response?.data ? UserModel.fromJson(response.data) : null,
    errors: response?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}
