// src/services/api/RankingService.js

import { 
  BaseApiResponse,
  BaseApiModel 
} from './ApiHelper';
import { SafeApiRequest } from './SafeApiRequest';
import { API_ENDPOINTS } from '../../constants/api';

/**
 * Ranking data model - represents a single ranking entry
 */
class RankingModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      id: 'id',
      userId: 'user_id',
      name: 'name',
      email: 'email',
      profilePicture: 'profile_picture',
      routesCount: 'routes_count',
      averageGrade: 'average_grade',
      maxGrade: 'max_grade',
      totalClimbs: 'total_climbs',
      rank: 'rank',
    };
  }

  constructor(data = {}) {
    super();
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.name = data.name || 'Unknown User';
    this.email = data.email || null;
    this.profilePicture = data.profilePicture || null;
    this.routesCount = data.routesCount || 0;
    this.averageGrade = data.averageGrade || null;
    this.maxGrade = data.maxGrade || null;
    this.totalClimbs = data.totalClimbs || 0;
    this.rank = data.rank || 0;
  }

  // Helper method to get display image
  get image() {
    return this.profilePicture || 'https://via.placeholder.com/80';
  }
}

/**
 * Ranking API response model
 */
class RankingResponse extends BaseApiResponse {
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data',
      rankings: 'rankings',
      totalCount: 'total_count',
      timeframe: 'timeframe',
    };
  }

  constructor(data = {}) {
    super(data);
    this.data = data.data || [];
    this.rankings = data.rankings || [];
    this.totalCount = data.totalCount || 0;
    this.timeframe = data.timeframe || 'all';
    
    // Convert raw data to RankingModel instances
    if (this.data && Array.isArray(this.data)) {
      this.rankings = this.data.map((item, index) => {
        const ranking = RankingModel.fromJson(item);
        ranking.rank = index + 1; // Add rank based on position
        return ranking;
      });
    }
  }
}

/**
 * Ranking Service - handles all ranking-related API calls
 */
class RankingService {
  
  /**
   * Fetch most climbs ranking
   * @param {string} timeframe - 'week', 'month', or 'all'
   * @returns {Promise<RankingResponse>}
   */
  static async getMostClimbs(timeframe = 'all') {
    console.log(`RankingService: Fetching most climbs ranking for ${timeframe}`);
    
    const payload = { timeframe };
    
    const response = await SafeApiRequest.get(
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.RANKING.GET_MOST_CLIMBS,
      payload,
      RankingResponse
    );
    
    if (response.success) {
      console.log('RankingService: Most climbs ranking fetched successfully');
    } else {
      console.error('RankingService: Failed to fetch most climbs ranking:', response.message);
    }
    
    return response;
  }

  /**
   * Fetch highest grades ranking
   * @param {string} timeframe - 'week', 'month', or 'all'
   * @returns {Promise<RankingResponse>}
   */
  static async getHighestGrades(timeframe = 'all') {
    console.log(`RankingService: Fetching highest grades ranking for ${timeframe}`);
    
    const payload = { timeframe };
    
    const response = await SafeApiRequest.get(
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.RANKING.GET_HIGHEST_GRADES,
      payload,
      RankingResponse
    );
    
    if (response.success) {
      console.log('RankingService: Highest grades ranking fetched successfully');
    } else {
      console.error('RankingService: Failed to fetch highest grades ranking:', response.message);
    }
    
    return response;
  }

  /**
   * Fetch top climbers ranking
   * @param {string} timeframe - 'week', 'month', or 'all'
   * @returns {Promise<RankingResponse>}
   */
  static async getTopClimbers(timeframe = 'all') {
    console.log(`RankingService: Fetching top climbers ranking for ${timeframe}`);
    
    const payload = { timeframe };
    
    const response = await SafeApiRequest.get(
      API_ENDPOINTS.BASE_URL,
      API_ENDPOINTS.RANKING.GET_TOP_CLIMBERS,
      payload,
      RankingResponse
    );
    
    if (response.success) {
      console.log('RankingService: Top climbers ranking fetched successfully');
    } else {
      console.error('RankingService: Failed to fetch top climbers ranking:', response.message);
    }
    
    return response;
  }

  /**
   * Generic method to fetch any ranking type
   * @param {string} type - 'mostClimbs', 'highestBoulder', or 'topClimbers'
   * @param {string} timeframe - 'week', 'month', or 'all'
   * @returns {Promise<RankingResponse>}
   */
  static async getRanking(type, timeframe = 'all') {
    switch (type) {
      case 'mostClimbs':
        return await this.getMostClimbs(timeframe);
      case 'highestBoulder':
        return await this.getHighestGrades(timeframe);
      case 'topClimbers':
        return await this.getTopClimbers(timeframe);
      default:
        console.error(`RankingService: Unknown ranking type: ${type}`);
        return new RankingResponse({ 
          success: false, 
          message: `Unknown ranking type: ${type}` 
        });
    }
  }
}

export { RankingService, RankingModel, RankingResponse };