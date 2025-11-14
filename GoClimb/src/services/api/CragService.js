// src/services/api/CragService.js

import { CustomApiRequest, RequestMethod, BaseApiResponse } from './ApiHelper';
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

class GenericGetResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
    };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = data ?? null;
  }
}

async function fetchCragInfoGET(numericPkCragId) {

  const query = `?crag_id=${encodeURIComponent(numericPkCragId)}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_CRAG_INFO + query,
    null,
    true,
  );

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchCragInfoGET] req', numericPkCragId);
  console.log('[fetchCragInfoGET] res', res);

  if (!ok || !res?.success) {
    return {
      success: false,
      crag: null,
    };
  }

  return {
    success: true,
    crag: normalizeCrag(res.data, numericPkCragId),
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

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchRoutesByCragIdGET] cragIdParam:', cragIdParam);
  console.log('[fetchRoutesByCragIdGET] response:', res);

  if (!ok || !res?.success) {
    return {
      success: false,
      routes: [],
    };
  }

  const arr = Array.isArray(res.data) ? res.data : [];
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

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchRouteByIdGET] req', routeId);
  console.log('[fetchRouteByIdGET] res', res);

  if (!ok || !res?.success) {
    return {
      success: false,
      route: null,
    };
  }

  return {
    success: true,
    route: normalizeRoute(res.data),
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

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchRandomCrags] req', payload);
  console.log('[fetchRandomCrags] res', res);

  if (!ok || !res?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(res.data) ? res.data : [];
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

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchTrendingCrags] response:', res);

  if (!ok || !res?.success) {
    return {
      success: false,
      crags: [],
    };
  }

  const arr = Array.isArray(res.data) ? res.data : [];
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

  // If images are provided, use FormData for multipart upload
  if (cragData.images && cragData.images.length > 0) {
    const formData = new FormData();
    formData.append('name', cragData.name);
    formData.append('location_lat', String(cragData.location_lat));
    formData.append('location_lon', String(cragData.location_lon));
    formData.append('description', cragData.description || '');

    // Append each image
    cragData.images.forEach((image, index) => {
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
      name: cragData.name,
      location_lat: cragData.location_lat,
      location_lon: cragData.location_lon,
      description: cragData.description || '',
    };
  }

    const req = new CustomApiRequest(
      RequestMethod.POST,
      API_ENDPOINTS.BASE_URL,
      '/crag/create_crag/',
      payload,
      true
    );

    const ok = await req.sendRequest(GenericGetResponse);
    const res = req.Response;

    console.log('[createCrag] response without images:', res);

    if (!ok || !res?.success) {
      return {
        success: false,
        message: res?.message || 'Failed to create crag',
        crag: null,
      };
    }

    return {
      success: true,
      message: res.message,
      crag: normalizeCrag(res.data, null),
    };
  }
}

export async function createRoute(routeData) {
  let payload;

  // If images are provided, use FormData for multipart upload
  if (routeData.images && routeData.images.length > 0) {
    const formData = new FormData();
    formData.append('crag_id', routeData.crag_id);
    formData.append('route_name', routeData.route_name);
    formData.append('route_grade', String(routeData.route_grade));

    // Append each image
    routeData.images.forEach((image, index) => {
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
      crag_id: routeData.crag_id,
      route_name: routeData.route_name,
      route_grade: routeData.route_grade,
    };
  }

    const req = new CustomApiRequest(
      RequestMethod.POST,
      API_ENDPOINTS.BASE_URL,
      '/route/create_route/',
      payload,
      true
    );

    const ok = await req.sendRequest(GenericGetResponse);
    const res = req.Response;

    console.log('[createRoute] response without images:', res);

    if (!ok || !res?.success) {
      return {
        success: false,
        message: res?.message || 'Failed to create route',
        route: null,
      };
    }

    return {
      success: true,
      message: res.message,
      route: normalizeRoute(res.data),
    };
  }
}