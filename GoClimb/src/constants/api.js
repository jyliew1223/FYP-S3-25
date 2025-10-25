// constants/api.js

function withBase(base, endpoints) {
  const result = {};
  for (const key in endpoints) {
    result[key] = `${base}${endpoints[key]}`;
  }
  return result;
}

export const API_ENDPOINTS = {
  BASE_URL: 'https://goclimb-web.onrender.com',
  // BASE_URL: 'http://127.0.0.1:8000/',
  AUTH: withBase('auth/', {
    VERIFY_APP_CHECK_TOKEN: 'verify_app_check_token/',
    VERIFY_ID_TOKEN: 'verify_id_token/',
    SIGN_UP: 'signup/',
  }),
  USER: withBase('user/', {
    GET_USER: 'get_user',
  }),
  POST: withBase('post/', {
    GET_POST_BY_USER_ID: 'get_post_by_user_id/',
  }),
  CRAG: withBase('crag/', {
    GET_CRAG_INFO: 'get_crag_info/',
  }),
};
