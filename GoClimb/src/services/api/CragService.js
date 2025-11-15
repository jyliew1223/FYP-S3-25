// src/services/api/CragService.js

import { CustomApiRequest, RequestMethod } from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

const GRADE_TABLE = {
  1: '4',
  2: '5',
  3: '5+',
  4: '6A',
  5: '6A+',
  6: '6B',
  7: '6B+',
  8: '6C',
  9: '6C+',
  10: '7A',
  11: '7A+',
  12: '7B',
  13: '7B+',
  14: '7C',
  15: '7C+',
  16: '8A',
  17: '8A+',
  18: '8B',
  19: '8B+',
  20: '8C',
  21: '8C+',
  22: '9A',
};

export function convertNumericGradeToFont(n) {
  if (n == null) return '—';
  const asNum = Number(n);
  return GRADE_TABLE[asNum] || String(asNum);
}

function safeTs(str) {
  try {
    return str ? Date.parse(str) : Date.now();
  } catch {
    return Date.now();
  }
}

function normalizeCrag(raw, fallbackNumericPk) {
  let numericPk = fallbackNumericPk;
  if (raw?.crag_id && typeof raw.crag_id === 'string') {
    const match = raw.crag_id.match(/CRAG-0*(\d+)/);
    if (match && match[1]) {
      numericPk = parseInt(match[1], 10);
    }
  }

  return {
    crag_pretty_id: raw?.crag_id ?? 'CRAG-UNKNOWN',
    crag_pk: numericPk,

    name: raw?.name ?? 'Unknown Crag',
    description: raw?.description ?? '',
    // Preserve the full location_details structure
    location_details: raw?.location_details || null,
    // Keep country for backward compatibility
    country:
      raw?.location_details?.country ||
      raw?.location_details?.city ||
      'Unknown',

    location_lat: raw?.location_lat ?? null,
    location_lon: raw?.location_lon ?? null,
    images: Array.isArray(raw?.images_urls) ? raw.images_urls : [],
  };
}

function normalizeRoute(raw) {
  const numericGrade = raw?.route_grade;
  const cragData = typeof raw?.crag === 'object' ? raw.crag : null;
  const cragId = cragData?.crag_id || raw?.crag;

  return {
    route_id: raw?.route_id ?? 'ROUTE-UNKNOWN',
    name: raw?.route_name ?? 'Unnamed Route',
    gradeRaw: numericGrade,
    gradeFont: convertNumericGradeToFont(numericGrade),
    cragPk: cragId,
    cragData: cragData,
    images: Array.isArray(raw?.images_urls) ? raw.images_urls : [],
    createdAt: safeTs(raw?.created_at),
  };
}

// Removed GenericGetResponse class - using direct JSON parsing instead

export async function fetchCragInfoGET(cragId) {

  const query = `?crag_id=${encodeURIComponent(cragId)}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_CRAG_INFO + query,
    null,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchCragInfoGET] req', cragId);
  console.log('[fetchCragInfoGET] response', response);

  if (!response?.success) {
    return {
      success: false,
      crag: null,
    };
  }

  return {
    success: true,
    crag: normalizeCrag(response.data, null),
  };
}

export async function fetchRoutesByCragIdGET(cragIdParam) {

  const payload = { crag_id: cragIdParam };

  console.log('[fetchRoutesByCragIdGET] BASE_URL:', API_ENDPOINTS.BASE_URL);
  console.log(
    '[fetchRoutesByCragIdGET] ENDPOINT:',
    API_ENDPOINTS.ROUTE.GET_ROUTES_BY_CRAG_ID,
  );
  console.log('[fetchRoutesByCragIdGET] cragIdParam:', cragIdParam);
  console.log('[fetchRoutesByCragIdGET] payload:', payload);

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTES_BY_CRAG_ID,
    payload,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchRoutesByCragIdGET] cragIdParam:', cragIdParam);
  console.log('[fetchRoutesByCragIdGET] response:', response);

  if (!response?.success) {
    return {
      success: false,
      routes: [],
    };
  }

  const arr = Array.isArray(response.data) ? response.data : [];
  return {
    success: true,
    routes: arr.map(normalizeRoute),
  };
}

export async function fetchRouteByIdGET(routeId) {
  const payload = { route_id: routeId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTE_BY_ID,
    payload,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchRouteByIdGET] req', routeId);
  console.log('[fetchRouteByIdGET] response', response);

  if (!response?.success) {
    return {
      success: false,
      route: null,
    };
  }

  return {
    success: true,
    route: normalizeRoute(response.data),
  };
}

export async function fetchRandomCrags(count = 10, blacklist = []) {

  const payload = {
    count: count.toString(),
    blacklist: blacklist,
  };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_RANDOM_CRAGS,
    payload,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchRandomCrags] req', payload);
  console.log('[fetchRandomCrags] response', response);

  if (!response?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(response.data) ? response.data : [];
  return {
    success: true,
    crags: arr.map(raw => normalizeCrag(raw, null)),
  };
}

export async function fetchAllCragsBootstrap() {
  console.log('[fetchAllCragsBootstrap] Using random crags endpoint');
  const randomResult = await fetchRandomCrags(10);

  if (randomResult.success && randomResult.crags.length > 0) {
    return randomResult.crags;
  }

  console.warn('[fetchAllCragsBootstrap] Failed to load crags');
  return [];
}

export async function fetchAllModelsByCragId(crag_id) {
  console.log(
    '[fetchAllModelsByCragId] fetch all models related to crag: ' +
    crag_id.toString(),
  );

  const payload = {
    crag_id: crag_id,
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG_MODEL.GET_MODELS_BY_CRAG_ID,
    payload,
  );

  await request.sendRequest();

  return request.JsonObject.data;
}

export async function fetchAllCrag() {

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_ALL,
    null,
    true
  );

  const ok = await req.sendRequest();
  const res = req.JsonObject;

  console.log('[fetchAllCrag] response:', res);
  console.log('[fetchAllCrag] raw data:', res?.data);

  if (!ok || !res?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(res.data) ? res.data : [];
  console.log('[fetchAllCrag] processing array:', arr);

  return {
    success: true,
    crags: arr, // Return raw data temporarily for debugging
  };
}

export async function fetchTrendingCrags(count = 5) {
  const payload = { count: String(count) };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/crag/get_trending_crags/',
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchTrendingCrags] response:', response);

  if (!response?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(response.data) ? response.data : [];
  return {
    success: true,
    crags: arr.map(item => ({
      ...normalizeCrag(item.crag, null),
      growth: item.growth,
      growth_rate: item.growth_rate,
      current_count: item.current_count,
    })),
  };
}

// Client-side route search - fetches all crags and their routes, then filters
export async function searchRoutes(query) {
  try {
    // Get all crags
    const cragsResult = await fetchAllCrag();
    if (!cragsResult.success || !cragsResult.crags) {
      return { success: false, routes: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const allRoutes = [];

    // Fetch routes for each crag and filter by search term
    for (const crag of cragsResult.crags.slice(0, 10)) { // Limit to first 10 crags for performance
      const cragId = crag.crag_id || crag.crag_pretty_id;
      if (!cragId) continue;

      const routesResult = await fetchRoutesByCragIdGET(cragId);
      if (routesResult.success && routesResult.routes) {
        // Filter routes that match the search term
        const matchingRoutes = routesResult.routes.filter(route =>
          route.name.toLowerCase().includes(searchTerm)
        );
        allRoutes.push(...matchingRoutes);
      }
    }

    return {
      success: true,
      routes: allRoutes.slice(0, 20), // Limit to 20 results
    };
  } catch (error) {
    console.log('[searchRoutes] error:', error);
    return { success: false, routes: [] };
  }
}

export async function createCrag(cragData) {
  let payload;

  console.log('[createCrag] === DEBUGGING IMAGE UPLOAD ===');
  console.log('[createCrag] cragData received:', cragData);
  console.log('[createCrag] cragData.images:', cragData.images);
  console.log('[createCrag] images array length:', cragData.images ? cragData.images.length : 'undefined');

  // If images are provided, use FormData for multipart upload
  if (cragData.images && cragData.images.length > 0) {
    console.log('[createCrag] ✅ Images detected, using FormData');
    
    const formData = new FormData();
    formData.append('name', cragData.name);
    formData.append('location_lat', String(cragData.location_lat));
    formData.append('location_lon', String(cragData.location_lon));
    formData.append('description', cragData.description || '');
    if (cragData.user_id) {
      formData.append('user_id', cragData.user_id);
    }

    console.log('[createCrag] FormData text fields added');

    // Append each image
    cragData.images.forEach((image, index) => {
      console.log(`[createCrag] Processing image ${index}:`, image);
      
      const fileUri = image.fileCopyUri || image.uri;
      const fileName = image.name || `image_${index}.jpg`;
      const fileType = image.type || 'image/jpeg';

      console.log(`[createCrag] Image ${index} details:`, {
        fileUri,
        fileName,
        fileType,
        originalImage: image
      });

      formData.append('images', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });

      console.log(`[createCrag] ✅ Image ${index} appended to FormData`);
    });

    // Log FormData contents (if possible)
    console.log('[createCrag] FormData created with parts:', formData._parts ? formData._parts.length : 'unknown');
    if (formData._parts) {
      formData._parts.forEach(([key, value], index) => {
        console.log(`[createCrag] FormData part ${index}: ${key} =`, 
          typeof value === 'object' && value.name ? `File: ${value.name}` : value);
      });
    }

    payload = formData;
  } else {
    console.log('[createCrag] ❌ No images detected, using JSON payload');
    // No images, use regular JSON payload
    payload = {
      name: cragData.name,
      location_lat: cragData.location_lat,
      location_lon: cragData.location_lon,
      description: cragData.description || '',
    };
    
    if (cragData.user_id) {
      payload.user_id = cragData.user_id;
    }
  }

  console.log('[createCrag] Final payload type:', payload instanceof FormData ? 'FormData' : 'JSON');
  console.log('[createCrag] === END DEBUGGING ===');

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    '/crag/create_crag/',
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[createCrag] response without images:', response);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to create crag',
      crag: null,
    };
  }

  return {
    success: true,
    message: response.message,
    crag: normalizeCrag(response.data, null),
  };
}

export async function fetchUserCrags(userId) {
  const payload = { user_id: userId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_BY_USER_ID,
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchUserCrags] response:', response);

  if (!response?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(response.data) ? response.data : [];
  return {
    success: true,
    crags: arr.map(raw => normalizeCrag(raw, null)),
  };
}

export async function fetchUserRoutes(userId) {
  const payload = { user_id: userId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_BY_USER_ID,
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[fetchUserRoutes] response:', response);

  if (!response?.success) {
    return {
      success: false,
      routes: [],
    };
  }

  const arr = Array.isArray(response.data) ? response.data : [];
  return {
    success: true,
    routes: arr.map(normalizeRoute),
  };
}

export async function deleteCrag(cragId) {
  const payload = { crag_id: cragId };

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.DELETE_CRAG,
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[deleteCrag] response:', response);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to delete crag',
    };
  }

  return {
    success: true,
    message: response.message || 'Crag deleted successfully',
  };
}

export async function deleteRoute(routeId) {
  const payload = { route_id: routeId };

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.DELETE_ROUTE,
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[deleteRoute] response:', response);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to delete route',
    };
  }

  return {
    success: true,
    message: response.message || 'Route deleted successfully',
  };
}

export async function createRoute(routeData) {
  let payload;

  console.log('[createRoute] === DEBUGGING IMAGE UPLOAD ===');
  console.log('[createRoute] routeData received:', routeData);
  console.log('[createRoute] routeData.images:', routeData.images);
  console.log('[createRoute] images array length:', routeData.images ? routeData.images.length : 'undefined');

  // If images are provided, use FormData for multipart upload
  if (routeData.images && routeData.images.length > 0) {
    console.log('[createRoute] ✅ Images detected, using FormData');
    
    const formData = new FormData();
    formData.append('crag_id', routeData.crag_id);
    formData.append('route_name', routeData.route_name);
    formData.append('route_grade', String(routeData.route_grade));
    if (routeData.user_id) {
      formData.append('user_id', routeData.user_id);
    }

    console.log('[createRoute] FormData text fields added');

    // Append each image
    routeData.images.forEach((image, index) => {
      console.log(`[createRoute] Processing image ${index}:`, image);
      
      const fileUri = image.fileCopyUri || image.uri;
      const fileName = image.name || `image_${index}.jpg`;
      const fileType = image.type || 'image/jpeg';

      console.log(`[createRoute] Image ${index} details:`, {
        fileUri,
        fileName,
        fileType,
        originalImage: image
      });

      formData.append('images', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });

      console.log(`[createRoute] ✅ Image ${index} appended to FormData`);
    });

    // Log FormData contents (if possible)
    console.log('[createRoute] FormData created with parts:', formData._parts ? formData._parts.length : 'unknown');
    if (formData._parts) {
      formData._parts.forEach(([key, value], index) => {
        console.log(`[createRoute] FormData part ${index}: ${key} =`, 
          typeof value === 'object' && value.name ? `File: ${value.name}` : value);
      });
    }

    payload = formData;
  } else {
    console.log('[createRoute] ❌ No images detected, using JSON payload');
    // No images, use regular JSON payload
    payload = {
      crag_id: routeData.crag_id,
      route_name: routeData.route_name,
      route_grade: routeData.route_grade,
    };
    
    if (routeData.user_id) {
      payload.user_id = routeData.user_id;
    }
  }

  console.log('[createRoute] Final payload type:', payload instanceof FormData ? 'FormData' : 'JSON');
  console.log('[createRoute] === END DEBUGGING ===');

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    '/route/create_route/',
    payload,
    true
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[createRoute] response without images:', response);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to create route',
      route: null,
    };
  }

  return {
    success: true,
    message: response.message,
    route: normalizeRoute(response.data),
  };
}