// src/services/api/AuthApi.js

import auth from '@react-native-firebase/auth';
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
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No Firebase user is logged in after signup.');
  }

  // Firebase ID token proves identity
  const idToken = await currentUser.getIdToken(true);
  const email = currentUser.email;

  // Build payload with "username"
  const payload = new SignUpPayload({
    id_token: idToken,
    username: usernameFromClient,
    email: email,
  });

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    'auth/signup/',
    payload,
    true // attach App Check token header
  );

  const httpOk = await request.sendRequest(SignUpResponse);
  const resp = request.Response;

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
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No Firebase session found.');
  }

  // fresh ID token
  const idToken = await currentUser.getIdToken(false);

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
