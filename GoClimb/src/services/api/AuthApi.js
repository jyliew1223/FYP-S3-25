// src/services/api/AuthApi.js

import { getAuth, getIdToken } from '@react-native-firebase/auth';
import {
  RequestMethod,
  BaseApiPayload,
  BaseApiResponse,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import { UserModel } from './ApiModels';

class SignUpPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      id_token: 'id_token',
      username: 'username',
      email: 'email',
    };
  }

  constructor({ id_token, username, email } = {}) {
    super();
    this.id_token = id_token;
    this.username = username;
    this.email = email;
  }
}

class SignUpResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
    };
  }

  constructor({ status, success, message, errors } = {}) {
    super({ status, success, message, errors });
  }
}

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
  const payload = new SignUpPayload({
    id_token: idToken,
    username: usernameFromClient,
    email: email,
  });

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
  
  const httpOk = await request.sendRequest(SignUpResponse);
  const resp = request.Response;

  console.log('[registerUserInDjango] Request OK:', httpOk);
  console.log('[registerUserInDjango] Response success:', resp?.success);
  console.log('[registerUserInDjango] Response message:', resp?.message);
  console.log('[registerUserInDjango] Response status:', resp?.status);
  console.log('[registerUserInDjango] Response errors:', resp?.errors);
  
  if (!httpOk || !resp?.success) {
    console.log('[registerUserInDjango] FULL RESPONSE DEBUG:');
    console.log(request.logResponse?.());
  }
  
  console.log('[registerUserInDjango] === END ===');

  return {
    ok: httpOk && !!resp?.success,
    status: resp?.status,
    message: resp?.message ?? null,
    errors: resp?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

class GetUserPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      id_token: 'id_token',
    };
  }

  constructor({ id_token } = {}) {
    super();
    this.id_token = id_token;
  }
}

class GetUserResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data', // backend returns the user data in `data`
    };
  }

  constructor({ status, success, message, errors, data } = {}) {
    super({ status, success, message, errors });

    if (data instanceof UserModel) {
      this.data = data;
    } else {
      this.data = UserModel.fromJson(data);
    }
  }
}

export async function fetchCurrentUserFromDjango() {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('No Firebase session found.');
  }

  // Get ID token using the pattern from InitFirebaseApps.js
  const idToken = await getIdToken(currentUser, false);

  const payload = new GetUserPayload({
    id_token: idToken,
  });

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.GET_USER,
    payload,
    true // attach App Check token header
  );

  const httpOk = await request.sendRequest(GetUserResponse);
  const resp = request.Response;

  return {
    ok: httpOk && !!resp?.success,
    status: resp?.status,
    message: resp?.message ?? null,
    user: resp?.data ?? null,
    errors: resp?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

class UpdateUserPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      user_id: 'user_id',
      username: 'username',
      email: 'email',
    };
  }

  constructor({ user_id, username, email } = {}) {
    super();
    this.user_id = user_id;
    this.username = username;
    this.email = email;
  }
}

class UpdateUserResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }

  constructor({ status, success, message, errors, data } = {}) {
    super({ status, success, message, errors });

    if (data instanceof UserModel) {
      this.data = data;
    } else {
      this.data = UserModel.fromJson(data);
    }
  }
}

export async function updateUserInDjango({ username, email }) {
  console.log('[updateUserInDjango] === START ===');
  
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    console.log('[updateUserInDjango] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[updateUserInDjango] Current user UID:', currentUser.uid);

  const payload = new UpdateUserPayload({
    user_id: currentUser.uid,
    username: username,
    email: email,
  });

  console.log('[updateUserInDjango] Payload:', JSON.stringify(payload.toJson()));

  const request = new CustomApiRequest(
    RequestMethod.PUT,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.UPDATE_USER,
    payload,
    true // attach App Check token header
  );

  console.log('[updateUserInDjango] Sending request...');
  const httpOk = await request.sendRequest(UpdateUserResponse);
  const resp = request.Response;

  console.log('[updateUserInDjango] Request OK:', httpOk);
  console.log('[updateUserInDjango] Response:', resp);
  console.log('[updateUserInDjango] === END ===');

  return {
    ok: httpOk && !!resp?.success,
    status: resp?.status,
    message: resp?.message ?? null,
    user: resp?.data ?? null,
    errors: resp?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}

class GetUserByIdPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      user_id: 'user_id',
    };
  }

  constructor({ user_id } = {}) {
    super();
    this.user_id = user_id;
  }
}

class GetUserByIdResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }

  constructor({ status, success, message, errors, data } = {}) {
    super({ status, success, message, errors });

    if (data instanceof UserModel) {
      this.data = data;
    } else {
      this.data = UserModel.fromJson(data);
    }
  }
}

export async function fetchUserByIdFromDjango(userId) {
  console.log('[fetchUserByIdFromDjango] === START ===');
  console.log('[fetchUserByIdFromDjango] Fetching user with ID:', userId);

  const payload = new GetUserByIdPayload({
    user_id: userId,
  });

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.GET_USER_BY_ID,
    payload,
    true // attach App Check token header
  );

  console.log('[fetchUserByIdFromDjango] Sending request...');
  const httpOk = await request.sendRequest(GetUserByIdResponse);
  const resp = request.Response;

  console.log('[fetchUserByIdFromDjango] Request OK:', httpOk);
  console.log('[fetchUserByIdFromDjango] Response:', resp);
  console.log('[fetchUserByIdFromDjango] === END ===');

  return {
    ok: httpOk && !!resp?.success,
    status: resp?.status,
    message: resp?.message ?? null,
    user: resp?.data ?? null,
    errors: resp?.errors ?? null,
    debugRaw: request.logResponse?.(),
  };
}
