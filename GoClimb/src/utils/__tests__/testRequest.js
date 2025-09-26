import {
  CustomApiRequest,
  BaseApiResponse,
  RequestMethod
} from '../apihelper.js';
import { ClimbLogData } from '../apimodels.js';


/**
 * User Climb Log API response class
 * Extends BaseApiResponse to include data field for climb logs
 */
class UserClimbLogResponse extends BaseApiResponse {
  /**
   * Field mapping configuration for JSON deserialization
   * Inherits from parent and adds data field
   */
  static get fieldMapping() {
    return {
      ...super.fieldMapping,
      data: 'data'
    };
  }

  /**
   * Creates a new UserClimbLogResponse instance
   * @param {Object} options - Response options
   * @param {boolean} [options.success] - Whether the request was successful
   * @param {string} [options.message] - Response message
   * @param {*} [options.errors] - Any errors that occurred
   * @param {ClimbLogData[]} [options.data] - Array of climb log data
   */
  constructor({ success, message, errors, data } = {}) {
    super({ success, message, errors });
    this.data = data ?? [];
  }

  /**
   * Override fromJson to handle array of ClimbLogData deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {UserClimbLogResponse} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle array of climb log data
    if (Array.isArray(jsonData.data)) {
      instance.data = jsonData.data.map(logData => ClimbLogData.fromJson(logData));
    }

    return instance;
  }
}

// Example of payload (if needed, GET usually has no body)
const payload = null;

// Fake fetch using node-fetch or real endpoint if you have one
// For demonstration, we’ll mock the fetch response
global.fetch = async () => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({
    success: true,
    message: "Climb logs fetched successfully.",
    data: [
      {
        log_id: "CLIMBLOG-2",
        user: {
          user_id: "user-123",
          full_name: "Test User01",
          email: "Email01",
          profile_picture: null,
          role: "member",
          status: false
        },
        route: {
          route_id: 2,
          formatted_id: "ROUTE-2",
          route_name: "Skyline Traverse",
          route_grade: 10,
          route_type: "Sport",
          crag: {
            crag_id: "CRAG-2",
            name: "Bukit Takun",
            location_lat: 3.2986,
            location_lon: 101.6312,
            description: "A scenic limestone hill popular for sport climbing.",
            image_urls: [
              "https://example.com/takun1.jpg",
              "https://example.com/takun2.jpg"
            ]
          }
        },
        date_climbed: "2025-09-22",
        notes: "Felt good, tricky crux at the middle."
      }
    ]
  })
});

async function testUserClimbLogs() {
  const request = new CustomApiRequest(
    RequestMethod.GET,
    "https://fakeapi.com", // not used because we mock fetch
    "/user/climb/logs",
    payload
  );

  const success = await request.sendRequest(UserClimbLogResponse);

  console.log("Request success:", success);
  console.log("Response data:", request.response);
  
  if (request.response && request.response.data) {
    console.log("Number of climb logs:", request.response.data.length);
    console.log("First climb log:", request.response.data[0]);
    console.log("Route info:", request.response.data[0]?.route);
    console.log("Crag info:", request.response.data[0]?.route?.crag);
  }
  
  console.log(request.logResponse(UserClimbLogResponse));
}

testUserClimbLogs().catch(console.error);
