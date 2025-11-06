// src/utils/TestRankingAPI.js
// This is a test file to help you verify your API connection

import { RankingService } from '../services/api/RankingService';
import { SafeApiRequest } from '../services/api/SafeApiRequest';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Test basic API connection without App Check
 */
export const testBasicConnection = async () => {
  console.log('🔌 Testing basic API connection...');
  
  try {
    const response = await SafeApiRequest.get(
      API_ENDPOINTS.BASE_URL,
      'health/', // Assuming you have a health check endpoint
      {}
    );
    
    console.log('Basic connection result:', {
      success: response.success,
      status: response.status,
      message: response.message
    });
    
    return response.success;
  } catch (error) {
    console.error('Basic connection failed:', error);
    return false;
  }
};

/**
 * Test function to verify ranking API connection
 * Call this from your app to test if the backend is working
 */
export const testRankingAPI = async () => {
  console.log('🧪 Testing Ranking API Connection...');
  
  try {
    // Test 1: Most Climbs
    console.log('📊 Testing Most Climbs endpoint...');
    const mostClimbsResponse = await RankingService.getMostClimbs('all');
    console.log('Most Climbs Result:', {
      success: mostClimbsResponse.success,
      message: mostClimbsResponse.message,
      dataCount: mostClimbsResponse.rankings?.length || 0
    });

    // Test 2: Highest Grades
    console.log('📈 Testing Highest Grades endpoint...');
    const highestGradesResponse = await RankingService.getHighestGrades('all');
    console.log('Highest Grades Result:', {
      success: highestGradesResponse.success,
      message: highestGradesResponse.message,
      dataCount: highestGradesResponse.rankings?.length || 0
    });

    // Test 3: Top Climbers
    console.log('🏆 Testing Top Climbers endpoint...');
    const topClimbersResponse = await RankingService.getTopClimbers('all');
    console.log('Top Climbers Result:', {
      success: topClimbersResponse.success,
      message: topClimbersResponse.message,
      dataCount: topClimbersResponse.rankings?.length || 0
    });

    // Summary
    const allSuccessful = mostClimbsResponse.success && 
                         highestGradesResponse.success && 
                         topClimbersResponse.success;

    console.log('🎯 API Test Summary:', {
      allEndpointsWorking: allSuccessful,
      mostClimbs: mostClimbsResponse.success,
      highestGrades: highestGradesResponse.success,
      topClimbers: topClimbersResponse.success
    });

    return allSuccessful;

  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return false;
  }
};

// You can call this function from your app like this:
// import { testRankingAPI } from './src/utils/TestRankingAPI';
// testRankingAPI();