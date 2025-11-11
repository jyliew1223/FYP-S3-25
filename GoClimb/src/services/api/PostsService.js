// GoClimb/src/services/api/PostsService.js

import { getAuth } from '@react-native-firebase/auth';
import {
  RequestMethod,
  BaseApiPayload,
  BaseApiResponse,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

/* ----------------------------- helpers ----------------------------- */
function toTs(value) {
  try {
    return value ? Date.parse(value) : Date.now();
  } catch {
    return Date.now();
  }
}

/* -------------------------- model mapping -------------------------- */

function getAuthorName(rawUser) {
  // backend may send user as UID string OR object { user_id, username, email }
  if (!rawUser) return 'User';
  if (typeof rawUser === 'string') return 'User';
  if (rawUser.username) return rawUser.username;
  if (rawUser.email) return rawUser.email;
  return 'User';
}

function mapPostJsonToUi(raw) {
  if (!raw) return null;

  console.log('[DEBUG mapPostJsonToUi raw]', raw);

  const postId = String(raw.post_id ?? '');
  const authorName = getAuthorName(raw.user);
  const createdTs = toTs(raw.created_at);

  // prefer serialized title; fallback to content snippet
  let uiTitle = '';
  if (typeof raw.title === 'string' && raw.title.trim()) {
    uiTitle = raw.title.trim();
  } else if (typeof raw.content === 'string' && raw.content.trim()) {
    const trimmed = raw.content.trim();
    uiTitle = trimmed.length > 70 ? trimmed.slice(0, 67).trim() + '…' : trimmed;
  } else {
    uiTitle = 'Untitled';
  }

  const likes = Number(raw.likes ?? raw.likes_count ?? raw.like_count ?? 0);
  const comments = Number(
    raw.comments ?? raw.comments_count ?? raw.comment_count ?? 0,
  );

  const imageUrl =
    Array.isArray(raw.images_urls) && raw.images_urls.length
      ? raw.images_urls[0]
      : null;

  const images = Array.isArray(raw.images_urls) ? raw.images_urls : [];

  return {
    id: postId,
    author: { id: String(raw.user?.user_id ?? ''), name: authorName },
    title: uiTitle,
    body: raw.content || '',
    tags: raw.tags || [],
    createdAt: createdTs,
    likes,
    comments, // fallback until we hydrate with fetchCommentCountForPost
    imageUrl, // Keep for backward compatibility
    images, // All images array
  };
}

function mapCommentJsonToUi(raw) {
  if (!raw) return null;

  console.log('[DEBUG mapCommentJsonToUi raw]', raw);

  const authorName = getAuthorName(raw.user);
  return {
    id: String(raw.comment_id ?? raw.id ?? ''),
    author: { id: String(raw.user?.user_id ?? ''), name: authorName },
    text: raw.content || '',
    createdAt: toTs(raw.created_at),
  };
}

/* ------------------------ payload/response ------------------------- */

class GetRandomPostsPayload extends BaseApiPayload {
  static get fieldMapping() {
    return { ...super.fieldMapping, count: 'count', blacklist: 'blacklist' };
  }
  constructor({ count, blacklist }) {
    super();
    this.count = count;
    this.blacklist = Array.isArray(blacklist) ? blacklist : [];
  }
}

class GetRandomPostsResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    const arr = Array.isArray(data) ? data : [];
    this.data = arr.map(mapPostJsonToUi).filter(Boolean);
  }
}

class GetPostResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = mapPostJsonToUi(data);
  }
}

class GetCommentsResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    const arr = Array.isArray(data) ? data : [];
    this.data = arr.map(mapCommentJsonToUi).filter(Boolean);
  }
}

class CreateCommentPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      post_id: 'post_id',
      user_id: 'user_id',
      content: 'content',
    };
  }
  constructor({ post_id, user_id, content }) {
    super();
    this.post_id = post_id;
    this.user_id = user_id;
    this.content = content;
  }
}

class CreateCommentResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = mapCommentJsonToUi(data);
  }
}

/* -- CreatePost payload/response ----------------------------------- */

class CreatePostPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      user_id: 'user_id',
      title: 'title',
      content: 'content',
      tags: 'tags',
    };
  }
  constructor({ user_id, title, content, tags }) {
    super();
    this.user_id = user_id;
    this.title = title;
    this.content = content;
    this.tags = tags;
  }
}

class CreatePostResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = mapPostJsonToUi(data);
  }
}

/* --------------------------- service calls -------------------------- */

// FEED POSTS
export async function fetchRandomPosts({ count = 12, blacklist = [] } = {}) {
  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.GET_RANDOM_POSTS,
    new GetRandomPostsPayload({ count, blacklist }),
    true,
  );
  const ok = await req.sendRequest(GetRandomPostsResponse);
  const res = req.Response;

  console.log('[DEBUG fetchRandomPosts mapped]', res?.data);

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? [],
    errors: res?.errors ?? null,
  };
}

// SINGLE POST
export async function fetchPostById(postId) {
  const payload = { post_id: postId };

  // Try POST first
  let req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.GET_POST,
    payload,
    true,
  );
  let ok = await req.sendRequest(GetPostResponse);
  let res = req.Response;

  console.log('[DEBUG fetchPostById mapped]', res?.data);

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}

// COMMENTS LIST
export async function fetchCommentsByPostId(postId) {
  const payload = { post_id: postId };

  // Try POST first
  let req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.COMMENT.GET_COMMENTS_BY_POST_ID,
    payload,
    true,
  );
  let ok = await req.sendRequest(GetCommentsResponse);
  let res = req.Response;

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? [],
    errors: res?.errors ?? null,
  };
}

// comment count helper for Forum
export async function fetchCommentCountForPost(postId) {
  const res = await fetchCommentsByPostId(postId);
  if (res?.success) {
    return res.data.length;
  }
  return 0;
}

// CREATE COMMENT
export async function createComment({ postId, content }) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No Firebase session found.');

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.COMMENT.CREATE_COMMENT,
    new CreateCommentPayload({
      post_id: postId,
      user_id: user.uid,
      content,
    }),
    true,
  );
  const ok = await req.sendRequest(CreateCommentResponse);
  const res = req.Response;

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}

// DELETE COMMENT
export async function deleteComment(commentId) {
  console.log('[deleteComment] === START ===');
  console.log('[deleteComment] Input commentId:', commentId);
  console.log('[deleteComment] commentId type:', typeof commentId);

  const user = getAuth().currentUser;
  if (!user) {
    console.log('[deleteComment] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[deleteComment] Current user UID:', user.uid);

  const payload = { comment_id: commentId };

  console.log('[deleteComment] Payload:', JSON.stringify(payload));
  console.log('[deleteComment] Endpoint:', API_ENDPOINTS.COMMENT.DELETE_COMMENT);
  console.log('[deleteComment] Full URL:', API_ENDPOINTS.BASE_URL + '/' + API_ENDPOINTS.COMMENT.DELETE_COMMENT);

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.COMMENT.DELETE_COMMENT,
    payload,
    true,
  );

  console.log('[deleteComment] Sending request...');
  const ok = await req.sendRequest(BaseApiResponse);
  const res = req.Response;
  const jsonObj = req.JsonObject;

  console.log('[deleteComment] Request OK:', ok);
  console.log('[deleteComment] Response object:', res);
  console.log('[deleteComment] Raw JSON:', jsonObj);
  console.log('[deleteComment] === END ===');

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}

// LIKE STATUS CHECK
export async function checkIfUserLikedPost(postId) {
  const user = getAuth().currentUser;
  if (!user) {
    console.log('[DEBUG checkIfUserLikedPost] No user logged in');
    return false;
  }

  const payload = { post_id: postId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.LIKES_USERS,
    payload,
    true,
  );
  const ok = await req.sendRequest();
  const res = req.JsonObject;

  console.log('[DEBUG checkIfUserLikedPost]', {
    postId,
    ok,
    success: res?.success,
    users: res?.data?.users,
    currentUserId: user.uid,
  });

  if (ok && res?.success && res?.data?.users) {
    const userLiked = res.data.users.some(u => u.user_id === user.uid);
    console.log('[DEBUG checkIfUserLikedPost] userLiked:', userLiked);
    return userLiked;
  }

  console.log('[DEBUG checkIfUserLikedPost] Returning false (no match)');
  return false;
}

// GET LIKE COUNT
export async function getLikeCount(postId) {
  const payload = { post_id: postId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.LIKES_COUNT,
    payload,
    true,
  );
  const ok = await req.sendRequest(BaseApiResponse);
  const res = req.Response;
  const jsonData = req.JsonObject;

  console.log('[DEBUG getLikeCount]', {
    postId,
    ok,
    success: res?.success,
    jsonData,
  });

  if (ok && res?.success && jsonData?.data) {
    // Get count from the raw JSON data
    const count = jsonData.data.count ?? jsonData.data.likes_count ?? jsonData.data.like_count ?? 0;
    console.log('[DEBUG getLikeCount] Extracted count:', count);
    return { success: true, count };
  }

  return { success: false, count: 0 };
}

// LIKE / UNLIKE
export async function likePost(postId) {
  const user = getAuth().currentUser;

  if (!user) throw new Error('No Firebase session found.');

  const payload = { post_id: postId, user_id: user.uid };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.LIKE,
    payload,
    true,
  );
  const ok = await req.sendRequest(BaseApiResponse);
  const res = req.Response;
  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
  };
}

export async function unlikePost(postId) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No Firebase session found.');

  const payload = { post_id: postId, user_id: user.uid };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.UNLIKE,
    payload,
    true,
  );
  const ok = await req.sendRequest(BaseApiResponse);
  const res = req.Response;
  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
  };
}

// CREATE POST
export async function createPost({ title, content, tags }) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No Firebase session found.');

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.CREATE_POST,
    new CreatePostPayload({
      user_id: user.uid,
      title,
      content,
      tags,
    }),
    true,
  );

  const ok = await req.sendRequest(CreatePostResponse);
  const res = req.Response;

  console.log('[DEBUG createPost response]', res);

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}
