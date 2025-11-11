// GoClimb/src/services/api/ClimbLogService.js

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

function mapClimbLogJsonToUi(raw) {
  if (!raw) return null;

  console.log('[DEBUG mapClimbLogJsonToUi raw]', raw);

  return {
    id: String(raw.log_id ?? ''),
    userId: String(raw.user?.user_id ?? ''),
    username: raw.user?.username ?? 'User',
    email: raw.user?.email ?? '',
    route: {
      id: String(raw.route?.route_id ?? ''),
      name: raw.route?.route_name ?? 'Unknown Route',
      grade: raw.route?.route_grade ?? 0,
      crag: {
        id: String(raw.route?.crag?.crag_id ?? ''),
        name: raw.route?.crag?.name ?? 'Unknown Crag',
        lat: raw.route?.crag?.location_lat ?? 0,
        lon: raw.route?.crag?.location_lon ?? 0,
        description: raw.route?.crag?.description ?? '',
        images: raw.route?.crag?.images_urls ?? [],
      },
      images: raw.route?.images_urls ?? [],
    },
    dateClimbed: raw.date_climbed ?? '',
    notes: raw.notes ?? '',
    title: raw.title ?? '',
    status: raw.status ?? true,
    attempt: raw.attempt ?? 1,
  };
}

/* ------------------------ payload/response ------------------------- */

class GetUserClimbLogsPayload extends BaseApiPayload {
  static get fieldMapping() {
    return { ...super.fieldMapping, user_id: 'user_id' };
  }
  constructor({ user_id }) {
    super();
    this.user_id = user_id;
  }
}

class GetUserClimbLogsResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    const arr = Array.isArray(data) ? data : [];
    this.data = arr.map(mapClimbLogJsonToUi).filter(Boolean);
  }
}

class CreateClimbLogPayload extends BaseApiPayload {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      user_id: 'user_id',
      route_id: 'route_id',
      crag_id: 'crag_id',
      date_climbed: 'date_climbed',
      title: 'title',
      notes: 'notes',
      status: 'status',
      attempt: 'attempt',
    };
  }
  constructor({ user_id, route_id, crag_id, date_climbed, title, notes, status, attempt }) {
    super();
    this.user_id = user_id;
    this.route_id = route_id;
    this.crag_id = crag_id;
    this.date_climbed = date_climbed;
    this.title = title;
    this.notes = notes;
    this.status = status;
    this.attempt = attempt;
  }
}

class CreateClimbLogResponse extends BaseApiResponse {
  static get fieldMapping() {
    return { ...super.fieldMapping, data: 'data' };
  }
  constructor({ status, success, message, errors, data }) {
    super({ status, success, message, errors });
    this.data = mapClimbLogJsonToUi(data);
  }
}

/* --------------------------- service calls -------------------------- */

// GET USER CLIMB LOGS
export async function getUserClimbLogs(userId) {
  const payload = new GetUserClimbLogsPayload({ user_id: userId });

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CLIMB_LOG.GET_USER_CLIMB_LOG,
    payload,
    true,
  );
  const ok = await req.sendRequest(GetUserClimbLogsResponse);
  const res = req.Response;

  console.log('[DEBUG getUserClimbLogs]', res?.data);

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? [],
    errors: res?.errors ?? null,
  };
}

// CREATE CLIMB LOG
export async function createClimbLog({ routeId, cragId, dateClimbed, title, notes, status, attempt }) {
  console.log('[createClimbLog] === START ===');
  
  const user = getAuth().currentUser;
  if (!user) {
    console.log('[createClimbLog] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[createClimbLog] Current user UID:', user.uid);

  const payload = {
    user_id: user.uid,
    route_id: routeId,
    crag_id: cragId,
    date_climbed: dateClimbed,
    title: title || '',
    notes: notes || '',
    status: status ?? false,
    attempt: attempt ?? 1,
  };

  console.log('[createClimbLog] Payload:', JSON.stringify(payload));

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CLIMB_LOG.CREATE,
    new CreateClimbLogPayload(payload),
    true,
  );

  const ok = await req.sendRequest(CreateClimbLogResponse);
  const res = req.Response;

  console.log('[createClimbLog] Response:', res);
  console.log('[createClimbLog] === END ===');

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    data: res?.data ?? null,
    errors: res?.errors ?? null,
  };
}

// DELETE CLIMB LOG
export async function deleteClimbLog(logId) {
  console.log('[deleteClimbLog] === START ===');
  console.log('[deleteClimbLog] Input logId:', logId);
  
  const user = getAuth().currentUser;
  if (!user) {
    console.log('[deleteClimbLog] ERROR: No Firebase session found');
    throw new Error('No Firebase session found.');
  }

  console.log('[deleteClimbLog] Current user UID:', user.uid);

  const payload = { log_id: logId };

  console.log('[deleteClimbLog] Payload:', JSON.stringify(payload));

  const req = new CustomApiRequest(
    RequestMethod.DELETE,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CLIMB_LOG.DELETE,
    payload,
    true,
  );
  
  const ok = await req.sendRequest(BaseApiResponse);
  const res = req.Response;

  console.log('[deleteClimbLog] Response:', res);
  console.log('[deleteClimbLog] === END ===');

  return {
    success: ok && !!res?.success,
    status: res?.status,
    message: res?.message ?? null,
    errors: res?.errors ?? null,
  };
}
