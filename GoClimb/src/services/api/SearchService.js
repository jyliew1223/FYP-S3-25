// GoClimb/src/services/api/SearchService.js

import {
  RequestMethod,
  CustomApiRequest,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

// Search Users
export async function searchUsers({ query, limit = 10 }) {
  const payload = {
    query,
    limit
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/user/search/',
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to search users',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Users found successfully',
    data: response.data || [],
    errors: null
  };
}

// Search Posts
export async function searchPosts({ query, limit = 10 }) {
  const payload = {
    query,
    limit
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/post/search/',
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to search posts',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Posts found successfully',
    data: response.data || [],
    errors: null
  };
}

// Search Crags
export async function searchCrags({ query, limit = 10 }) {
  const payload = {
    query,
    limit
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/crag/search/',
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to search crags',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Crags found successfully',
    data: response.data || [],
    errors: null
  };
}

// Search Posts by Tags
export async function searchPostsByTags({ tags, limit = 10 }) {
  const payload = {
    tags: Array.isArray(tags) ? tags : [tags],
    limit
  };

  const request = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    '/post/search_by_tags/',
    payload,
    true,
  );

  await request.sendRequest();
  const response = request.JsonObject;

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to search posts by tags',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Posts found successfully',
    data: response.data || [],
    errors: null
  };
}