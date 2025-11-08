// __tests__/apiAllEndpoints.test.js
import {
  CustomApiRequest,
  RequestMethod,
  BaseApiPayload,
  BaseApiResponse,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import InitFirebaseApps from '../firebase/InitFirebaseApps';
import { metaGetAll } from '@react-native-firebase/app';
import { ActivityIndicator } from 'react-native';

/**
 * Recursively logs all keys and values in an object
 */
function logObject(obj, prefix = '') {
  if (obj === null || obj === undefined) {
    console.log(`${prefix}: ${obj}`);
    return;
  }

  if (typeof obj !== 'object') {
    console.log(`${prefix}: ${obj}`);
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => logObject(item, `${prefix}[${i}]`));
  } else {
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      typeof value === 'object' && value !== null
        ? logObject(value, path)
        : console.log(`${path}:`, value);
    }
  }
}

/**
 * Sends the API request and logs the response
 */
async function testEndpoint(method, payload, endpoint) {
  try {
    const request = new CustomApiRequest(
      (method = method),
      (baseUrl = API_ENDPOINTS.BASE_URL),
      (path = endpoint),
      (payload = payload),
    );
    const response = await request.sendRequest();
    const jsonData = request.JsonObject;

    console.log('\n===============================================');
    console.log(`TESTING ENDPOINT: ${endpoint}`);
    console.log('===============================================');
    console.log(`METHOD: ${method}`);
    console.log(`PAYLOAD:`, payload);
    console.log(`STATUS: ${response.status}`);
    console.log(
      `CONTENT TYPE: ${response.headers?.get?.('Content-Type') || 'unknown'}`,
    );

    if (jsonData) {
      console.log('RESPONSE DATA:');
      logObject(jsonData);
    } else {
      console.warn('No JSON data returned');
    }

    console.log('===============================================');
    return jsonData;
  } catch (error) {
    console.error(`❌ Failed to call endpoint ${endpoint}:`, error);
    return { success: false, error: error.message }; // <- always return an object
  }
}

const payloads = {
  // AUTH
  SIGN_UP: {
    id_token: 'mock_firebase_id_token',
    username: 'newuser',
    email: 'newuser@example.com',
  },
  VERIFY_APP_CHECK_TOKEN: { app_check_token: 'test_app_check_token_123' },
  VERIFY_ID_TOKEN: { id_token: 'mock_firebase_id_token' },

  // USER
  GET_USER: { id_token: 'mock_id_token' },
  GET_MONTHLY_USER_RANKING: { count: 5 },

  // POST
  CREATE_POST: {
    user_id: 'test_user_123',
    content: 'Test post',
    tags: ['climbing'],
  },
  GET_POST: { post_id: 'POST-000007' },
  GET_POSTS_BY_USER_ID: { user_id: 'test_user_123', count: 5, blacklist: [] },
  GET_RANDOM_POSTS: { count: 5, blacklist: [] },

  // CRAG
  GET_CRAG_INFO: { crag_id: 'CRAG-000007' },
  GET_CRAG_MONTHLY_RANKING: { crag_id: 7, count: 5 },
  GET_TRANDING_CRAG: { count: 5 },

  // CLIMB_LOG
  GET_USER_CLIMB_LOG: { user_id: 'test_user_123' },
  GET_USER_CLIMB_STATS: { user_id: 'test_user_123' },

  // POST_LIKE
  LIKE: { user_id: 'test_user_123', post_id: 1 },
  UNLIKE: { user_id: 'test_user_123', post_id: 1 },
  LIKES_COUNT: { post_id: 1 },
  LIKES_USER: { post_id: 1 },

  // COMMENT
  CREATE_COMMENT: {
    post_id: 'POST-000001',
    user_id: 'test_user_123',
    content: 'Test comment',
  },
  DELETE_COMMENT: { comment_id: 'COMMENT-000001' },
  GET_COMMENTS_BY_POST_ID: { post_id: 'POST-000001' },
  GET_COMMENTS_BY_USER_ID: { user_id: 'test_user_123' },

  // ROUTE
  CREATE_ROUTE: {
    crag_id: 'CRAG-000001',
    route_name: 'Test Route',
    route_grade: 5,
  },
  DELETE_ROUTE: { route_id: 'ROUTE-000001' },
  GET_ROUTE_BY_ID: { route_id: 'ROUTE-000001' },
  GET_ROUTES_BY_CRAG_ID: { crag_id: 'CRAG-000001' },
};

export default async function testNewM() {
  {
    console.log('new');




    const payload = { post_id: 'POST-000007' };

    const request = new CustomApiRequest(
      RequestMethod.GET,
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.POST.GET_POST,
      payload,
    );

    await request.sendRequest();

    const jsonData = request.JsonObject;

    logObject(jsonData);
  }
}
