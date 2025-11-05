// src/services/api/CragService.js

import {
  CustomApiRequest,
  RequestMethod,
  BaseApiResponse,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import InitFirebaseApps from '../firebase/InitFirebaseApps';

/**
 * GRADE_TABLE:
 * numeric route_grade -> Font grade
 */
const GRADE_TABLE = {
  1: '4',
  2: '4+',
  3: '5',
  4: '5+',
  5: '6A',
  6: '6A+',
  7: '6B+',
  8: '6C',
  9: '6C+',
  10: '7A',
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

// Normalize a single crag result
function normalizeCrag(raw, fallbackNumericPk) {
  // Extract numeric ID from crag_id string like "CRAG-000007" -> 7
  let numericPk = fallbackNumericPk;
  if (raw?.crag_id && typeof raw.crag_id === 'string') {
    const match = raw.crag_id.match(/CRAG-0*(\d+)/);
    if (match && match[1]) {
      numericPk = parseInt(match[1], 10);
    }
  }

  return {
    // backend returns "crag_id": "CRAG-000007" etc.
    crag_pretty_id: raw?.crag_id ?? 'CRAG-UNKNOWN',
    // Extract numeric PK from the pretty ID for route fetching
    crag_pk: numericPk,

    name: raw?.name ?? 'Unknown Crag',
    description: raw?.description ?? '',
    country:
      raw?.location_details?.country ||
      raw?.location_details?.city ||
      'Unknown',
    // Include lat/lon for map markers
    location_lat: raw?.location_lat ?? null,
    location_lon: raw?.location_lon ?? null,
    images: Array.isArray(raw?.images_urls) ? raw.images_urls : [],
  };
}

// Normalize a single route result
function normalizeRoute(raw) {
  const numericGrade = raw?.route_grade;
  // Handle both old format (crag as number) and new format (crag as object)
  const cragData = typeof raw?.crag === 'object' ? raw.crag : null;
  const cragId = cragData?.crag_id || raw?.crag;
  
  return {
    route_id: raw?.route_id ?? 'ROUTE-UNKNOWN',
    name: raw?.route_name ?? 'Unnamed Route',
    gradeRaw: numericGrade,
    gradeFont: convertNumericGradeToFont(numericGrade),
    cragPk: cragId,
    cragData: cragData, // Store full crag data if available
    images: Array.isArray(raw?.images_urls) ? raw.images_urls : [],
    createdAt: safeTs(raw?.created_at),
  };
}

/**
 * Helper to wrap GET responses because our ApiHelper response
 * still expects JSON with {success, data,...}
 */
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

/**
 * fetchCragInfoGET
 * Uses GET /crag/get_crag_info/?crag_id=<NUMERIC_PK>
 *
 * numericPkCragId: number or string like "3"
 */
async function fetchCragInfoGET(numericPkCragId) {
  await InitFirebaseApps();

  // build query param
  const query = `?crag_id=${encodeURIComponent(
    numericPkCragId
  )}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_CRAG_INFO + query,
    null,
    true
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

/**
 * fetchRoutesByCragIdGET
 * Uses GET /route/get_route_by_crag_id/?crag_id=<NUMERIC_OR_PRETTY>
 *
 * We will first try numeric PK (like 3, 4). If backend
 * expects the pretty "CRAG-000003", you can switch what you pass.
 */
export async function fetchRoutesByCragIdGET(cragIdParam) {
  await InitFirebaseApps();

  const payload = { crag_id: cragIdParam };
  
  console.log('[fetchRoutesByCragIdGET] BASE_URL:', API_ENDPOINTS.BASE_URL);
  console.log('[fetchRoutesByCragIdGET] ENDPOINT:', API_ENDPOINTS.ROUTE.GET_ROUTES_BY_CRAG_ID);
  console.log('[fetchRoutesByCragIdGET] cragIdParam:', cragIdParam);
  console.log('[fetchRoutesByCragIdGET] payload:', payload);

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTES_BY_CRAG_ID,
    payload,
    true
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

/**
 * fetchRouteByIdGET
 * Uses GET /route/get_route_by_id/?route_id=<ROUTE-XXXXX>
 */
export async function fetchRouteByIdGET(routeId) {
  await InitFirebaseApps();

  const payload = { route_id: routeId };

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTE_BY_ID,
    payload,
    true
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

/**
 * fetchRandomCrags
 * Uses the random crags endpoint from your API
 */
export async function fetchRandomCrags(count = 10, blacklist = []) {
  await InitFirebaseApps();

  const payload = { 
    count: count.toString(),
    blacklist: blacklist
  };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CRAG.GET_RANDOM_CRAGS,
    payload,
    true
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
    crags: arr.map((raw) => normalizeCrag(raw, null)),
  };
}

/**
 * fetchAllCragsBootstrap
 * Simple function that uses get_random_crags endpoint
 */
export async function fetchAllCragsBootstrap() {
  console.log('[fetchAllCragsBootstrap] Using random crags endpoint');
  const randomResult = await fetchRandomCrags(10);
  
  if (randomResult.success && randomResult.crags.length > 0) {
    return randomResult.crags;
  }

  // If random crags fails, return empty array
  console.warn('[fetchAllCragsBootstrap] Failed to load crags');
  return [];
}
