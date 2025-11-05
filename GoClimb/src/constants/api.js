// constants/api.js

/**
 * @template T
 * @param {string} base
 * @param {T} endpoints
 * @returns {{ [K in keyof T]: string }}
 */
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
    SIGN_UP: 'signup',
    VERIFY_APP_CHECK_TOKEN: 'verify_app_check_token/',
    VERIFY_ID_TOKEN: 'verify_id_token/',
  }),
  USER: withBase('user/', {
    GET_USER: 'get_user',
    GET_MONTTHLY_USER_RANKING: 'get_monthly_user_ranking',
  }),
  POST: withBase('post/', {
    CREATE_POST: 'create_post',
    GET_POST: 'get_post',
    GET_POSTS_BY_USER_ID: 'get_post_by_user_id/',
    GET_RANDOM_POSTS: 'get_random_posts',
  }),
  CRAG: withBase('crag/', {
    GET_CRAG_INFO: 'get_crag_info/',
    GET_CRAG_MONTHLY_RANKING: 'get_crag_monthly_ranking',
    GET_TRANDING_CRAG: 'get_trending_crags',
    GET_RANDOM_CRAGS: 'get_random_crags',
  }),
  CLIMB_LOG: withBase('climb_log/', {
    GET_USER_CLIMB_LOG: 'get_user_climb_logs',
    GET_USER_CLIMB_STATS: 'get_user_climb_stats',
  }),
  POST_LIKE: withBase('post/', {
    LIKE: 'like/',
    UNLIKE: 'unlike/',
    LIKES_COUNT: 'likes/count/',
    LIKES_USERS: 'likes/users/',
  }),
  COMMENT: withBase('comment/', {
    CREATE_COMMENT: 'create_post_comment',
    DELETE_COMMENT: 'delete_post_comment',
    GET_COMMENTS_BY_POST_ID: 'get_post_comments_by_post_id',
    GET_COMMENTS_BY_USER_ID: 'get_post_comments_by_user_id',
  }),
  ROUTE: withBase('route/', {
    CREATE_ROUTE: 'create_route',
    DELETE_ROUTE: 'delete_route',
    GET_ROUTE_BY_ID: 'get_route_by_id',
    GET_ROUTES_BY_CRAG_ID: 'get_route_by_crag_id',
  }),
};
