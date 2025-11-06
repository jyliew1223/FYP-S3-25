// src/services/api/SafeApiRequest.js
// A safer API request wrapper that handles App Check failures gracefully

import { 
  CustomApiRequest, 
  RequestMethod, 
  BaseApiResponse 
} from './ApiHelper';

/**
 * Safe API Request wrapper that handles App Check failures
 */
class SafeApiRequest {
  
  /**
   * Makes an API request with fallback for App Check failures
   * @param {string} method - HTTP method
   * @param {string} baseUrl - Base URL
   * @param {string} path - API path
   * @param {object} payload - Request payload
   * @param {Function} ResponseClass - Response class constructor
   * @returns {Promise<BaseApiResponse>}
   */
  static async makeRequest(method, baseUrl, path, payload = {}, ResponseClass = BaseApiResponse) {
    try {
      // First try with App Check token
      console.log(`SafeApiRequest: Attempting request with App Check token...`);
      
      const requestWithAppCheck = new CustomApiRequest(
        method,
        baseUrl,
        path,
        payload,
        true // Try with App Check token
      );

      const successWithAppCheck = await requestWithAppCheck.sendRequest(ResponseClass);
      
      if (successWithAppCheck) {
        console.log(`SafeApiRequest: Request successful with App Check token`);
        return requestWithAppCheck.Response;
      }

      // If that fails, check if it's an App Check error
      const response = requestWithAppCheck.Response;
      if (response && response.status === 403) {
        console.log(`SafeApiRequest: App Check failed (403), retrying without token...`);
        
        // Retry without App Check token
        const requestWithoutAppCheck = new CustomApiRequest(
          method,
          baseUrl,
          path,
          payload,
          false // No App Check token
        );

        const successWithoutAppCheck = await requestWithoutAppCheck.sendRequest(ResponseClass);
        
        if (successWithoutAppCheck) {
          console.log(`SafeApiRequest: Request successful without App Check token`);
          return requestWithoutAppCheck.Response;
        } else {
          console.error(`SafeApiRequest: Request failed even without App Check token`);
          return requestWithoutAppCheck.Response;
        }
      } else {
        console.error(`SafeApiRequest: Request failed with App Check token (non-403 error)`);
        return response;
      }

    } catch (appCheckError) {
      console.log(`SafeApiRequest: App Check error caught: ${appCheckError.message}`);
      console.log(`SafeApiRequest: Retrying without App Check token...`);
      
      try {
        // Retry without App Check token
        const requestWithoutAppCheck = new CustomApiRequest(
          method,
          baseUrl,
          path,
          payload,
          false // No App Check token
        );

        const success = await requestWithoutAppCheck.sendRequest(ResponseClass);
        
        if (success) {
          console.log(`SafeApiRequest: Fallback request successful`);
          return requestWithoutAppCheck.Response;
        } else {
          console.error(`SafeApiRequest: Fallback request also failed`);
          return requestWithoutAppCheck.Response;
        }

      } catch (fallbackError) {
        console.error(`SafeApiRequest: Both requests failed:`, fallbackError);
        return new ResponseClass({
          success: false,
          message: `Network error: ${fallbackError.message}`,
          status: 0
        });
      }
    }
  }

  /**
   * Convenience method for GET requests
   */
  static async get(baseUrl, path, payload = {}, ResponseClass = BaseApiResponse) {
    return await this.makeRequest(RequestMethod.GET, baseUrl, path, payload, ResponseClass);
  }

  /**
   * Convenience method for POST requests
   */
  static async post(baseUrl, path, payload = {}, ResponseClass = BaseApiResponse) {
    return await this.makeRequest(RequestMethod.POST, baseUrl, path, payload, ResponseClass);
  }

  /**
   * Convenience method for PUT requests
   */
  static async put(baseUrl, path, payload = {}, ResponseClass = BaseApiResponse) {
    return await this.makeRequest(RequestMethod.PUT, baseUrl, path, payload, ResponseClass);
  }

  /**
   * Convenience method for DELETE requests
   */
  static async delete(baseUrl, path, payload = {}, ResponseClass = BaseApiResponse) {
    return await this.makeRequest(RequestMethod.DELETE, baseUrl, path, payload, ResponseClass);
  }
}

export { SafeApiRequest };