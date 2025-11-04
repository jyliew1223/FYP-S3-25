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
  return {
    // backend returns "crag_id": "CRAG-000007" etc.
    crag_pretty_id: raw?.crag_id ?? 'CRAG-UNKNOWN',
    // but we ALSO track numeric PK we asked for, so we can pass it back later
    crag_pk: fallbackNumericPk ?? null,

    name: raw?.name ?? 'Unknown Crag',
    description: raw?.description ?? '',
    country:
      raw?.location_details?.country ||
      raw?.location_details?.city ||
      'Unknown',
    images: Array.isArray(raw?.images_urls) ? raw.images_urls : [],
  };
}

// Normalize a single route result
function normalizeRoute(raw) {
  const numericGrade = raw?.route_grade;
  return {
    route_id: raw?.route_id ?? 'ROUTE-UNKNOWN',
    name: raw?.route_name ?? 'Unnamed Route',
    gradeRaw: numericGrade,
    gradeFont: convertNumericGradeToFont(numericGrade),
    cragPk: raw?.crag ?? null,
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

  const query = `?crag_id=${encodeURIComponent(cragIdParam)}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTES_BY_CRAG_ID + query,
    null,
    true
  );

  const ok = await req.sendRequest(GenericGetResponse);
  const res = req.Response;

  console.log('[fetchRoutesByCragIdGET] req', cragIdParam);
  console.log('[fetchRoutesByCragIdGET] res', res);

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

  const query = `?route_id=${encodeURIComponent(routeId)}`;

  const req = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.ROUTE.GET_ROUTE_BY_ID + query,
    null,
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
 * fetchAllCragsBootstrap
 *
 * We do NOT yet have a "list all crags" endpoint.
 * So:
 * 1. We keep an array of known numeric PKs we care about (from Django admin list)
 *    - In your screenshot: Toast Bunch | 3, Green Attack | 4
 * 2. For each one, we call fetchCragInfoGET(pk)
 * 3. We build an array of crag objects for the UI
 *
 * Later, if backend gives you /crag/list_all/, you replace this with that.
 */
export async function fetchAllCragsBootstrap() {
  // Update this list if you add more crags in Django.
  const KNOWN_NUMERIC_IDS = [3, 4];

  const results = [];
  for (const pk of KNOWN_NUMERIC_IDS) {
    const info = await fetchCragInfoGET(pk);
    if (info.success && info.crag) {
      results.push(info.crag);
    } else {
      console.warn('[fetchAllCragsBootstrap] failed pk=', pk, info);
    }
  }

  return results;
}
