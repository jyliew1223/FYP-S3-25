// GoClimb/src/services/api/RankingsService.js

// Removed getAuth import - not used in this service
import {
  CustomApiRequest,
  RequestMethod,
} from './ApiHelper';
import { API_ENDPOINTS } from '../../constants/api';

/* ==================== PAYLOADS ==================== */

// Removed GetMonthlyUserRankingPayload class - using plain object instead

// Removed GetMonthlyUserRankingResponse class - using direct JSON parsing instead

/* ==================== API CALLS ==================== */

/**
 * Fetch weekly user rankings (most climbs)
 * @param {number} count - Number of top users to fetch
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function fetchWeeklyUserRankings(count = 50) {
  console.log('[RankingsService] Fetching weekly user rankings, count:', count);

  const payload = { count: String(count) };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/ranking/get_weekly_user_ranking/',
    payload,
    true
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[RankingsService] Weekly user rankings response:', {
    success: response?.success,
    dataCount: response?.data?.length,
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch weekly rankings',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Weekly rankings loaded successfully',
    data: response.data || [],
    errors: null
  };
}

/**
 * Fetch monthly user rankings (most climbs)
 * @param {number} count - Number of top users to fetch
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function fetchMonthlyUserRankings(count = 50) {
  console.log('[RankingsService] Fetching monthly user rankings, count:', count);

  const payload = { count: String(count) };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    API_ENDPOINTS.USER.GET_MONTTHLY_USER_RANKING,
    payload,
    true
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[RankingsService] Monthly user rankings response:', {
    success: response?.success,
    dataCount: response?.data?.length,
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch monthly rankings',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Monthly rankings loaded successfully',
    data: response.data || [],
    errors: null
  };
}

/**
 * Fetch all-time user rankings (most climbs)
 * @param {number} count - Number of top users to fetch
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function fetchAllTimeUserRankings(count = 50) {
  console.log('[RankingsService] Fetching all-time user rankings, count:', count);

  const payload = { count: String(count) };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/ranking/get_alltime_user_ranking/',
    payload,
    true
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[RankingsService] All-time user rankings response:', {
    success: response?.success,
    dataCount: response?.data?.length,
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch all-time rankings',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'All-time rankings loaded successfully',
    data: response.data || [],
    errors: null
  };
}

/**
 * Fetch average grade rankings
 * @param {number} count - Number of top users to fetch
 * @param {string} timeframe - 'weekly', 'monthly', or 'alltime'
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function fetchAverageGradeRankings(count = 50, timeframe = 'weekly') {
  console.log('[RankingsService] Fetching average grade rankings, count:', count, 'timeframe:', timeframe);

  const payload = { 
    count: String(count),
    timeframe: timeframe
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/ranking/get_average_grade_ranking/',
    payload,
    true
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[RankingsService] Average grade rankings response:', {
    success: response?.success,
    dataCount: response?.data?.length,
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch average grade rankings',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Average grade rankings loaded successfully',
    data: response.data || [],
    errors: null
  };
}

/**
 * Fetch top climbers (combined score)
 * @param {number} count - Number of top users to fetch
 * @param {string} timeframe - 'weekly', 'monthly', or 'alltime'
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function fetchTopClimbers(count = 50, timeframe = 'weekly') {
  console.log('[RankingsService] Fetching top climbers, count:', count, 'timeframe:', timeframe);

  const payload = { 
    count: String(count),
    timeframe: timeframe
  };

  const request = new CustomApiRequest(
    RequestMethod.GET,
    API_ENDPOINTS.BASE_URL,
    '/ranking/get_top_climbers/',
    payload,
    true
  );

  await request.sendRequest();
  const response = request.JsonObject;

  console.log('[RankingsService] Top climbers response:', {
    success: response?.success,
    dataCount: response?.data?.length,
  });

  if (!response?.success) {
    return {
      success: false,
      message: response?.message || 'Failed to fetch top climbers',
      errors: response?.errors || {},
      data: []
    };
  }

  return {
    success: true,
    message: response.message || 'Top climbers loaded successfully',
    data: response.data || [],
    errors: null
  };
}

/* ==================== FORMATTING ==================== */

/**
 * Format ranking data for display
 * @param {Array} rankings - Raw ranking data from API
 * @param {string} type - Ranking type (mostClimbs, highestBoulder, topClimbers)
 * @returns {Array} Formatted ranking data
 */
export function formatRankingsForDisplay(rankings, type) {
  if (!rankings || rankings.length === 0) return [];

  return rankings.map((item, index) => {
    let formattedItem = {
      id: item.user?.user_id || String(index),
      rank: item.rank || index + 1,
      userId: item.user?.user_id,
      name: item.user?.username || 'Unknown User',
      profilePicture: item.user?.profile_picture_url,
    };

    // Add type-specific data
    switch (type) {
      case 'mostClimbs':
        formattedItem.score = item.total_routes || 0;
        formattedItem.scoreLabel = 'routes';
        break;
      case 'highestBoulder':
        formattedItem.score = item.average_grade ? item.average_grade.toFixed(1) : '0.0';
        formattedItem.scoreLabel = 'avg grade';
        formattedItem.secondaryInfo = `${item.total_routes || 0} routes`;
        break;
      case 'topClimbers':
        formattedItem.score = item.total_score || 0;
        formattedItem.scoreLabel = 'points';
        formattedItem.secondaryInfo = `${item.total_routes || 0} routes • ${item.average_grade ? item.average_grade.toFixed(1) : '0.0'} avg`;
        break;
      default:
        formattedItem.score = 0;
        formattedItem.scoreLabel = '';
    }

    return formattedItem;
  });
}
