// constants/api.js
export const API_ENDPOINTS = {
  BASE_URL: 'https://goclimb-web.onrender.com',
  // BASE_URL: 'http://127.0.0.1:8000/',
  AUTH: {
    VERIFY_APP_CHECK_TOKEN: 'auth/verify_app_check_token/',
    VERIFY_ID_TOKEN: 'auth/verify_id_token/',
  },
  USER: {
    GET_USER: '/user/get_user',
  },
  POST: {
    GET_POST_BY_USER_ID: '/post/get_post_by_user_id/',
  },
};
