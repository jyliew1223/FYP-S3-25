// GoClimb/src/services/api/PostsService.js

import auth from '@react-native-firebase/auth';
import {
  RequestMethod,
  BaseApiPayload,
  BaseApiResponse,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

// ---------- Models / Helpers ----------

// Convert a raw "post" from Django into the shape Forum/PostDetail screens expect.
function mapPostFromBackend(raw) {
  if (!raw) return null;

  // createdAt -> timestamp we can timeAgo()
  const createdTs = raw.created_at ? Date.parse(raw.created_at) : Date.now();

  // Figure out authorName with strict priority:
  // 1. If raw.user is object and has username -> use that
  // 2. If raw.user is object and has full_name -> use that
  // 3. If raw.user is object and has email -> use before UID
  // 4. If raw.user is string like "JustinJ | jus@tin.com" -> take part before "|"
  // 5. If raw.user is a bare UID-looking string -> show "Unknown" instead of UID
  let authorName = 'Unknown';

  if (raw.user && typeof raw.user === 'object') {
    if (raw.user.username && raw.user.username.trim()) {
      authorName = raw.user.username.trim();
    } else if (raw.user.full_name && raw.user.full_name.trim()) {
      authorName = raw.user.full_name.trim();
    } else if (raw.user.email && raw.user.email.trim()) {
      // only use email if we don't have username/full_name
      authorName = raw.user.email.trim();
    } else if (raw.user.user_id && raw.user.user_id.trim()) {
      // this is likely the Firebase UID, we do NOT want to show that,
      // so we will only use it if literally nothing else is provided.
      authorName = 'Unknown';
    }
  } else if (raw.user && typeof raw.user === 'string') {
    // backend might send "JustinJ | jus@tin.com"
    const parts = raw.user.split('|').map(p => p.trim());
    if (parts[0]) {
      // parts[0] might still be a UID sometimes; let's detect
      const candidate = parts[0];

      // Heuristic: Firebase UIDs are long mixed-case alphanumeric,
      // usually ~28+ chars, no spaces, not an email.
      const looksLikeUid =
        candidate.length >= 20 &&
        !candidate.includes(' ') &&
        !candidate.includes('@');

      if (!looksLikeUid) {
        authorName = candidate;
      } else {
        // if it's obviously a UID, hide it
        authorName = 'Unknown';
      }
    }
  }

  // first image (optional future enhancement)
  const firstImage =
    Array.isArray(raw.images_download_urls) &&
    raw.images_download_urls.length > 0
      ? raw.images_download_urls[0]
      : null;

  // generate a "title" preview:
  // - prefer formatted_id if backend gives it (e.g. "POST-000010")
  // - else use first ~60 chars of content
  let titleGuess = '';
  if (raw.formatted_id) {
    titleGuess = raw.formatted_id;
  }
  if (!titleGuess && raw.content) {
    const trimmed = String(raw.content).trim();
    titleGuess =
      trimmed.length > 60 ? trimmed.slice(0, 57).trim() + '…' : trimmed;
  }

  return {
    // ID shown in FlatList keyExtractor and for navigation
    id: String(raw.post_id ?? raw.id ?? ''),

    author: {
      // we'll stop exposing UID here since we don't want to show UID anywhere in UI
      id: '',
      name: authorName,
    },

    title: titleGuess || 'Untitled',
    body: raw.content || '',
    tags: raw.tags || [],
    createdAt: createdTs,

    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,

    imageUrl: firstImage,
  };
}


// ---------- Base Payload / Response classes ----------

// Payload for get_random_posts/
class GetRandomPostsPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      count: 'count',
      blacklist: 'blacklist',
    };
  }

  constructor({ count, blacklist }) {
    super();
    this.count = count;
    this.blacklist = blacklist ?? [];
  }
}

// Response for get_random_posts/
class GetRandomPostsResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }

  constructor({ status, success, message, errors, data, __rawData }) {
    super({ status, success, message, errors });

    // Save both raw and mapped
    this.rawData = Array.isArray(__rawData) ? __rawData : Array.isArray(data) ? data : [];
    this.data = this.rawData.map(mapPostFromBackend).filter(Boolean);
  }

  // custom fromJson so we can preserve original data array untouched
  static fromJson(jsonData = {}) {
    const mapping = this.fieldMapping;
    const mappedData = {};

    for (const [internalKey, jsonKey] of Object.entries(mapping)) {
        mappedData[internalKey] = jsonData[jsonKey];
    }

    // pass original `jsonData.data` down as __rawData so constructor can keep both
    return new this({
      ...mappedData,
      __rawData: jsonData.data,
    });
  }
}


// Response for get_post/?post_id=...
class GetPostResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }

  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = mapPostFromBackend(data);
  }
}

// ---------- Service Functions ----------

// 1) Feed / Explore posts
// POST /post/get_random_posts/
export async function fetchRandomPosts({ count = 12, blacklist = [] } = {}) {
  const payload = new GetRandomPostsPayload({
    count,
    blacklist,
  });

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    'post/get_random_posts/', // confirmed working
    payload,
    true
  );

  const ok = await req.sendRequest(GetRandomPostsResponse);
  const res = req.Response;

  // DEBUG: log what backend actually sent us
  console.log('[DEBUG posts rawData]', res?.rawData);
  console.log('[DEBUG posts mapped data]', res?.data);

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? [],
    errors: res?.errors ?? null,
  };
}


// 2) Single post detail
// GET /post/get_post/?post_id=XX
export async function fetchPostById(postId) {
  const path = `post/get_post/?post_id=${encodeURIComponent(postId)}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    path,
    null,
    true
  );

  const ok = await req.sendRequest(GetPostResponse);
  const res = req.Response;

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}

// 3) Placeholder comments fetch
export async function fetchCommentsByPostId(postId) {
  // backend not ready yet → return empty
  return {
    success: true,
    data: [],
  };
}

// 4) Posts by the logged-in user (Profile tab, later)
// POST /post/get_post_by_user_id/
// body: { id_token: str }
// NOTE: your backend doc/version said "id_token", not "user_id", so we're following that.
export async function fetchPostsByCurrentUser() {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No Firebase session found.');
  }
  const idToken = await currentUser.getIdToken(false);

  const payload = {
    id_token: idToken,
  };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    'post/get_post_by_user_id/',
    payload,
    true
  );

  const ok = await req.sendRequest(GetRandomPostsResponse);
  const res = req.Response;

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? [],
    errors: res?.errors ?? null,
  };
}
