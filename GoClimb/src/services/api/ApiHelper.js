// src/services/api/ApiHelper.js

import { getApp } from '@react-native-firebase/app';
import appCheck, { getToken } from '@react-native-firebase/app-check';

/**
 * Base API payload class - extend as needed
 */
class BaseApiPayload {
  /**
   * Field mapping configuration for JSON deserialization
   * Override this in subclasses to change JSON key mappings
   */
  static get fieldMapping() {}

  /**
   * Converts this instance to JSON using field mapping
   * @returns {Object} - JSON object with mapped keys
   */
  toJson() {
    const mapping = this.constructor.fieldMapping;
    const jsonData = {};

    for (const [internalKey, jsonKey] of Object.entries(mapping)) {
      if (this[internalKey] !== undefined) {
        jsonData[jsonKey] = this[internalKey];
      }
    }

    return jsonData;
  }
}

/**
 * Base API response data class - extend as needed
 */
class BaseApiModel {
  /**
   * Field mapping configuration for JSON deserialization
   * Override this in subclasses to change JSON key mappings
   */
  static get fieldMapping() {}

  /**
   * Creates a new BaseApiResponse instance from JSON data
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {BaseApiResponse} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const mapping = this.fieldMapping;
    const mappedData = {};

    for (const [internalKey, jsonKey] of Object.entries(mapping)) {
      mappedData[internalKey] = jsonData[jsonKey];
    }

    return new this(mappedData);
  }
}

/**
 * Base API response class
 */
class BaseApiResponse {
  /**
   * Field mapping configuration for JSON deserialization
   * Override this in subclasses to change JSON key mappings
   */
  static get fieldMapping() {
    return {
      status: 'status',
      success: 'success',
      message: 'message',
      errors: 'errors',
    };
  }

  /**
   * Creates a new BaseApiResponse instance from JSON data
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {BaseApiResponse} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const mapping = this.fieldMapping;
    const mappedData = {};

    for (const [internalKey, jsonKey] of Object.entries(mapping)) {
      mappedData[internalKey] = jsonData[jsonKey];
    }

    return new this(mappedData);
  }

  /**
   * Creates a new BaseApiResponse instance
   * @param {Object} options - Response options
   * @param {boolean} [options.success] - Whether the request was successful
   * @param {string} [options.message] - Response message
   * @param {*} [options.errors] - Any errors that occurred
   */
  constructor({ status, success, message, errors } = {}) {
    this.status = status
    this.success = success ?? false;
    this.message = message ?? null;
    this.errors = errors ?? null;
  }
}

/**
 * Frozen object containing HTTP request methods
 * @readonly
 * @enum {string}
 */
const RequestMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
});

/**
 * Custom web request handler class
 */
class CustomApiRequest {
  /** @type {string} HTTP method (GET, POST, PUT, DELETE) */
  #method;

  /** @type {string} Base API URL (e.g., 'https://api.example.com') */
  #baseUrl;

  /** @type {string} API endpoint path (e.g., '/users/profile') */
  #path;

  /** @type {ApiPayload = BaseApiPayload|null} Request payload data for POST/PUT requests */
  #payload;

  /** @type {boolean} Whether to attach authentication token */
  #attachAppCheckToken;

  /** @type {ApiResponse = BaseApiResponse|null} Parsed response object after request completion */
  #response;

  /**
   * Creates a new CustomWebRequest instance
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} baseUrl - Base URL for the API
   * @param {string} path - API endpoint path
   * @param {ApiPayload = BaseApiPayload} payload - Request payload/data
   * @param {boolean} [attachAppCheckToken=true] - Whether to attach app check token
   */
  constructor(method, baseUrl, path, payload, attachAppCheckToken = true) {
    this.#method = method;
    this.#baseUrl = baseUrl;
    this.#path = path;
    this.#payload = payload;
    this.#attachAppCheckToken = attachAppCheckToken;
    this.#response = null;
  }

  /**
   * Sends the HTTP request
   * @param {Function} [ResponseClass=BaseApiResponse] - Response class constructor to use for parsing response
   * @returns {Promise<boolean>} - True if request was successful, false otherwise
   */
  async sendRequest(ResponseClass = BaseApiResponse) {
    let url = `${this.#baseUrl.replace(/\/$/, '')}/${this.#path.replace(
      /^\//,
      '',
    )}`;
    if (!url.endsWith('/')) url += '/';

    let options = { method: this.#method, headers: {} };

    if (this.#method === 'GET' && this.#payload) {
      url += this.#toQueryString(this.#payload);
    } else if (this.#method !== 'GET' && this.#method !== 'DELETE') {
      options.headers['Content-Type'] = 'application/json';
      options.body = this.#payload
        ? JSON.stringify(this.#payload.toJson())
        : '';
    }

    if (this.#attachAppCheckToken) {
      const tokenResult = await getToken(getApp().appCheck(), false);
      options.headers['X-Firebase-AppCheck'] = tokenResult.token;
    }

    try {
      const res = await fetch(url, options);
      const responseText = await res.text();

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (err) {
        console.error(
          `Failed to parse JSON: ${err.message}\n` +
            `Raw response: ${responseText}`,
        );
      }

      this.#response = ResponseClass.fromJson(json);
      this.#response.status = res.status;

      if (res.ok) {
        return true;
      } else {
        console.error(
          `Request Failed:\n` + `${this.logResponse(res, ResponseClass)}`,
        );
        return false;
      }
    } catch (error) {
      console.error(
        `Network error: ${error.message || error}\n` +
          `Details: ${error.stack || 'No stack trace available'}`,
      );
      return false;
    }
  }

  /**
   * Logs the response details in a formatted way
   * @param {Response} res - Fetch Response object
   * @param {string} [prefix=this.constructor.name] - Prefix for log messages
   * @returns {string} - Formatted log string
   */
  logResponse(prefix = this.constructor.name) {
    if (!this.#response) return `${prefix}: Response is null.`;

    let log = `${prefix}: Response:\n`;
    log += `\t${'StatusCode'.padEnd(12)}: ${this.#response.status}\n`;
    log += `\t${'Success'.padEnd(12)}: ${
      this.#response.success || 'Success not stated'
    }\n`;
    log += `\t${'Message'.padEnd(12)}: ${
      this.#response.message || 'No message'
    }\n`;
    log += this.#logChildProperties(this.#response);
    log += `\t${'Errors'.padEnd(12)}: ${this.#formatErrors(
      this.#response.errors,
    )}\n`;

    return log;
  }

  /**
   * Converts an object to a URL query string
   * @param {Object} obj - Object to convert to query string
   * @returns {string} - Query string (including leading '?' if not empty)
   */
  #toQueryString(obj) {
    if (!obj) return '';
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
  }

  /**
   * Formats error data for display
   * @param {*} errors - Error data to format
   * @returns {string} - Formatted error string
   * @private
   */
  #formatErrors(errors) {
    if (!errors) return 'No errors';
    if (typeof errors === 'string') {
      return errors;
    } else if (typeof errors === 'object') {
      return JSON.stringify(errors, null, 2);
    } else {
      return String(errors);
    }
  }

  /**
   * Logs child properties of the response object (excluding base properties)
   * @param {Object} response - Response object to log
   * @param {string} [indent="  "] - Indentation string for formatting
   * @returns {string} - Formatted string of child properties
   * @private
   */
  #logChildProperties(response) {
    let log = '';
    const baseProps = Object.getOwnPropertyNames(new BaseApiResponse({}));
    const allProps = Object.keys(response);
    const childProps = allProps.filter(p => !baseProps.includes(p));

    for (const prop of childProps) {
      const value = response[prop];
      const formattedValue = this.#formatPropertyValue(value);
      log += `\t${prop.padEnd(12)}: ${formattedValue}\n`;
    }

    return log;
  }

  /**
   * 🎨 Format property values based on their type
   * @param {*} value - Value to format
   * @returns {string} Formatted value string
   * @private
   */
  #formatPropertyValue(value) {
    if (value === null) {
      return 'null';
    } else if (value === undefined) {
      return 'undefined';
    } else if (typeof value === 'string') {
      return `"${value}"`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    } else if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value, null, 2).replace(
        /\n/g,
        '\n\t' + ' '.repeat(14),
      );
    } else {
      return JSON.stringify(value);
    }

    return log;
  }

  get Response() {
    return this.#response;
  }
}

// Export classes and constants
export {
  CustomApiRequest,
  BaseApiResponse,
  BaseApiPayload,
  BaseApiModel,
  RequestMethod,
};
