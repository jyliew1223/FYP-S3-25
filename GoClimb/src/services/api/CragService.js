// src/services/api/CragService.js

import {
  CustomApiRequest,
  RequestMethod,
  BaseApiResponse,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';
import InitFirebaseApps from '../firebase/InitFirebaseApps';

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
  await InitFirebaseApps();

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

export async function fetchAllCragsBootstrap() {
  console.log('[fetchAllCragsBootstrap] Using random crags endpoint');
  const randomResult = await fetchRandomCrags(10);

  if (randomResult.success && randomResult.crags.length > 0) {
    return randomResult.crags;
  }

  console.warn('[fetchAllCragsBootstrap] Failed to load crags');
  return [];
}
