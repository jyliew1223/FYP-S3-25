import { getAuth } from '@react-native-firebase/auth';
import {
  RequestMethod,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
function toTs(value) {
  try {
    return value ? Date.parse(value) : Date.now();
  } catch {
    return Date.now();
  }
}



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

  const authorName = getAuthorName(raw.user);
  return {
    id: String(raw.comment_id ?? raw.id ?? ''),
    author: { id: String(raw.user?.user_id ?? ''), name: authorName },
    text: raw.content || '',
    createdAt: toTs(raw.created_at),
  };
}

export async function fetchPostsByUserId(userId, { count = 20, blacklist = [] } = {}) {
  const payload = {
    user_id: userId,
    count,
    blacklist: Array.isArray(blacklist) ? blacklist : []
  };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.GET_POSTS_BY_USER_ID,
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to load user posts',
      errors: response?.errors || {},
      data: []
    };
  }

  // Map the posts to UI format
  const mappedPosts = Array.isArray(response.data) 
    ? response.data.map(mapPostJsonToUi).filter(Boolean)
    : [];



  return {
    success: true,
    message: response.message || 'User posts loaded successfully',
    data: mappedPosts,
    errors: null
  };
}

// FEED POSTS
export async function fetchRandomPosts({ count = 12, blacklist = [] } = {}) {
  const payload = {
    count,
    blacklist: Array.isArray(blacklist) ? blacklist : []
  };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.GET_RANDOM_POSTS,
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to load posts',
      errors: response?.errors || {},
      data: []
    };
  }

  // Map the posts to UI format
  const mappedPosts = Array.isArray(response.data) 
    ? response.data.map(mapPostJsonToUi).filter(Boolean)
    : [];



  return {
    success: true,
    message: response.message || 'Posts loaded successfully',
    data: mappedPosts,
    errors: null
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
  await req.sendRequest();
  const response = req.JsonObject;



  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch post',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Post fetched successfully',
    data: response.data ? mapPostJsonToUi(response.data) : null,
    errors: null
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
  await req.sendRequest();
  const response = req.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch comments',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Comments fetched successfully',
    data: Array.isArray(response.data) ? response.data.map(mapCommentJsonToUi).filter(Boolean) : [],
    errors: null,
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
    {
      post_id: postId,
      user_id: user.uid,
      content,
    },
    true,
  );
  await req.sendRequest();
  const response = req.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to create comment',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Comment created successfully',
    data: response.data ? mapCommentJsonToUi(response.data) : null,
    errors: null,
  };
}

// DELETE COMMENT
export async function deleteComment(commentId) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('No Firebase session found.');
  }

  const payload = { comment_id: commentId };

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.COMMENT.DELETE_COMMENT,
    payload,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to delete comment',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Comment deleted successfully',
    data: response.data || null,
    errors: null
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
  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[DEBUG getLikeCount]', {
    postId,
    success: response?.success,
    response,
  });

  if (response?.success && response?.data) {
    // Get count from the raw JSON data
    const count = response.data.count ?? response.data.likes_count ?? response.data.like_count ?? 0;
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

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.LIKE,
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to like post',
      errors: response?.errors || {}
    };
  }

  return {
    success: true,
    message: response.message || 'Post liked successfully',
    errors: null
  };
}

export async function unlikePost(postId) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No Firebase session found.');

  const payload = { post_id: postId, user_id: user.uid };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST_LIKE.UNLIKE,
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to unlike post',
      errors: response?.errors || {}
    };
  }

  return {
    success: true,
    message: response.message || 'Post unliked successfully',
    errors: null
  };
}

// CREATE POST
export async function createPost({ title, content, tags, images = [] }) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No Firebase session found.');

  let payload;

  // If images are provided, use FormData for multipart upload
  if (images && images.length > 0) {
    const formData = new FormData();
    formData.append('user_id', user.uid);
    formData.append('title', title);
    formData.append('content', content);
    
    // Append tags as JSON string or individual items
    formData.append('tags', JSON.stringify(tags));

    // Append each image
    images.forEach((image, index) => {
      const fileUri = image.fileCopyUri || image.uri;
      const fileName = image.name || `image_${index}.jpg`;
      const fileType = image.type || 'image/jpeg';

      formData.append('images', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });
    });

    payload = formData;
  } else {
    // No images, use regular JSON payload
    payload = {
      user_id: user.uid,
      title,
      content,
      tags,
    };
  }

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.CREATE_POST,
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[DEBUG createPost response]', response);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to create post',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Post created successfully',
    data: mapPostJsonToUi(response.data),
    errors: null
  };
}

// DELETE POST
export async function deletePost(postId) {
  console.log('[deletePost] === START ===');
  console.log('[deletePost] Input postId:', postId);
  
  const user = getAuth().currentUser;
  if (!user) {
    console.log('[deletePost] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[deletePost] Current user UID:', user.uid);

  const payload = { post_id: postId };

  console.log('[deletePost] Payload:', JSON.stringify(payload));
  console.log('[deletePost] Endpoint:', API_ENDPOINTS.POST.DELETE_POST);

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.POST.DELETE_POST,
    payload,
    true,
  );
  
  console.log('[deletePost] Sending request...');
  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[deletePost] Response:', response);
  console.log('[deletePost] === END ===');

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to delete post',
      errors: response?.errors || {}
    };
  }

  return {
    success: true,
    message: response.message || 'Post deleted successfully',
    errors: null
  };
}
