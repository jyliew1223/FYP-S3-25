// GoClimb/src/services/api/ClimbLogService.js

import { getAuth } from '@react-native-firebase/auth';
import {
  RequestMethod,
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

// Removed GetUserClimbLogsPayload class - using plain object instead

// Removed GetUserClimbLogsResponse class - using direct JSON parsing instead

// Removed CreateClimbLogPayload class - using plain object instead

// Removed CreateClimbLogResponse class - using direct JSON parsing instead

/* --------------------------- service calls -------------------------- */

// GET USER CLIMB LOGS
export async function getUserClimbLogs(userId) {
  const payload = { user_id: userId };

  const req = new CustomApiRequest(
    RequestMethod.POST,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.CLIMB_LOG.GET_USER_CLIMB_LOG,
    payload,
    true,
  );
  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[DEBUG getUserClimbLogs]', response?.data);

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch climb logs',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Climb logs fetched successfully',
    data: Array.isArray(response.data) ? response.data.map(mapClimbLogJsonToUi).filter(Boolean) : [],
    errors: null,
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
    payload,
    true,
  );

  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[createClimbLog] Response:', response);
  console.log('[createClimbLog] === END ===');

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to create climb log',
      errors: response?.errors || {},
      data: null
    };
  }

  return {
    success: true,
    message: response.message || 'Climb log created successfully',
    data: response.data ? mapClimbLogJsonToUi(response.data) : null,
    errors: null,
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
  
  await req.sendRequest();
  const response = req.JsonObject;

  console.log('[deleteClimbLog] Response:', response);
  console.log('[deleteClimbLog] === END ===');

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to delete climb log',
      errors: response?.errors || {}
    };
  }

  return {
    success: true,
    message: response.message || 'Climb log deleted successfully',
    errors: null
  };
}
