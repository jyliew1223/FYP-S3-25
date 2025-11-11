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
  static get fieldMapping() { }
  static get fieldMapping() { }

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
  static get fieldMapping() { }

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

  wrapModel(value, ModelClass) {
    if (value instanceof ModelClass) return value;
    if (value && typeof value === 'object') return new ModelClass(value);
    return null;
  }

  parseDate(value) {
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      // Handle YYYY-MM-DD safely (treat as local date)
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      // ISO or other formats
      return new Date(value);
    }

    if (typeof value === 'number') {
      // Handle timestamp (milliseconds)
      return new Date(value);
    }

    return null;
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
    this.status = status;
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

  /** @type {object} */
  #jsonObject;

  /**
   * Creates a new CustomWebRequest instance
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} baseUrl - Base URL for the API
   * @param {string} path - API endpoint path
   * @param {ApiPayload = BaseApiPayload || object} payload - Request payload/data
   * @param {boolean} [attachAppCheckToken=true] - Whether to attach app check token
   */
  constructor(method, baseUrl, path, payload, attachAppCheckToken = true) {
    this.#method = method;
    this.#baseUrl = baseUrl;
    this.#path = path;
    this.#payload = payload;
    this.#attachAppCheckToken = attachAppCheckToken;
    this.#response = null;
    this.#jsonObject;
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
    } else if (this.#method !== 'GET') {
      // POST, PUT, DELETE can all have a body
      if (this.#payload instanceof FormData) {
        // For FormData, don't set Content-Type header (let browser set it with boundary)
        options.body = this.#payload;
      } else {
        options.headers['Content-Type'] = 'application/json';
        if (this.#payload) {
          if (typeof this.#payload === 'string') {
            options.body = this.#payload;
          } else if (typeof this.#payload.toJson === 'function') {
            options.body = JSON.stringify(this.#payload.toJson());
          } else {
            options.body = JSON.stringify(this.#payload);
          }
        }
      }
    }

    if (this.#attachAppCheckToken) {
      try {
        const app = getApp();
        if (app.appCheck) {
          const tokenResult = await getToken(app.appCheck(), false);
          options.headers['X-Firebase-AppCheck'] = tokenResult.token;
          console.log('AppCheck token attached successfully');
        }
      } catch (error) {
        console.log('Failed to get AppCheck token:', error.message);
        // Don't fail the request, but log the issue
      }
    }

    try {
      const res = await fetch(url, options);
      const responseText = await res.text();

      try {
        this.#jsonObject = JSON.parse(responseText);
      } catch (err) {
        console.error(
          `Failed to parse JSON: ${err.message}\n` +
          `Raw response: ${responseText}`,
        );
      }

      this.#response = ResponseClass.fromJson(this.#jsonObject);
      this.#response.status = res.status;

      if (res.ok) {
        console.log(
          `Request Success:\n` + `${this.logFullJsonResponse()}`,
        );
        return true;
      } else {
        console.error(
          `Request Success:\n` + `${this.logFullJsonResponse()}`,
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

  logFullJsonResponse(prefix = this.constructor.name) {
    const divider = '─'.repeat(60);
    let log = `\n${divider}\n`;
    log += `📡 ${prefix}: Full HTTP Request & Response Log\n`;
    log += `${divider}\n`;
    log += `  Method        : ${this.#method}\n`;
    log += `  Base URL      : ${this.#baseUrl}\n`;
    log += `  Endpoint Path : ${this.#path}\n`;

    const fullUrl = `${this.#baseUrl.replace(/\/$/, '')}/${this.#path.replace(
      /^\//,
      '',
    )}`;
    log += `  Full URL      : ${fullUrl}\n`;
    log += `  Attach Token  : ${this.#attachAppCheckToken}\n`;

    // Payload section
    if (this.#payload) {
      try {
        if (this.#payload instanceof FormData) {
          log += `  Payload       : FormData with ${this.#payload._parts ? this.#payload._parts.length : 'unknown'} parts\n`;
          // Try to log FormData contents if possible
          if (this.#payload._parts) {
            this.#payload._parts.forEach(([key, value], index) => {
              const valueStr = typeof value === 'object' && value.name ? 
                `File: ${value.name} (${value.type || 'unknown type'})` : 
                String(value);
              log += `                 [${index}] ${key}: ${valueStr}\n`;
            });
          }
        } else {
          const jsonStr =
            typeof this.#payload === 'string'
              ? this.#payload
              : JSON.stringify(
                typeof this.#payload.toJson === 'function'
                  ? this.#payload.toJson()
                  : this.#payload,
                null,
                2,
              );
          log += `  Payload       : ${jsonStr.replace(
            /\n/g,
            '\n                 ',
          )}\n`;
        }
      } catch (err) {
        log += `  Payload       : [Error stringifying payload: ${err.message}]\n`;
      }
    } else {
      log += `  Payload       : (none)\n`;
    }

    log += `${divider}\n`;
    log += `📬 Response Summary:\n`;

    if (!this.#response) {
      log += `  (Response object is null)\n`;
      log += `${divider}\n`;
    } else {
      log += `  StatusCode    : ${this.#response.status}\n`;
      log += `  Success       : ${this.#response.success ?? 'N/A'}\n`;
      log += `  Message       : ${this.#response.message ?? 'No message'}\n`;
      log += `  Errors        : ${this.#formatErrors(this.#response.errors)}\n`;

      // Log child properties
      // log += this.#logChildProperties(this.#response);
    }

    // Include raw JSON body at the end
    log += `${divider}\n`;
    log += `📦 Raw JSON Object:\n`;
    if (this.#jsonObject) {
      try {
        log += JSON.stringify(this.#jsonObject, null, 2)
          .split('\n')
          .map(line => '  ' + line)
          .join('\n');
      } catch (err) {
        log += `  [Error stringifying JSON: ${err.message}]\n`;
      }
    } else {
      log += `  (No JSON object found)\n`;
    }

    log += `\n${divider}\n`;

    return log;
  }


  /**
   * Logs detailed request and response info in a formatted way
   * @param {string} [prefix=this.constructor.name] - Prefix for log messages
   * @returns {string} - Formatted log string
   */
  logResponse(prefix = this.constructor.name) {
    const divider = '─'.repeat(60);
    let log = `\n${divider}\n`;
    log += `📡 ${prefix}: HTTP Request Summary\n`;
    log += `${divider}\n`;
    log += `  Method        : ${this.#method}\n`;
    log += `  Base URL      : ${this.#baseUrl}\n`;
    log += `  Endpoint Path : ${this.#path}\n`;

    // Build and show full URL
    const fullUrl = `${this.#baseUrl.replace(/\/$/, '')}/${this.#path.replace(
      /^\//,
      '',
    )}`;
    log += `  Full URL      : ${fullUrl}\n`;

    log += `  Attach Token  : ${this.#attachAppCheckToken}\n`;

    // Show payload (if any)
    if (this.#payload) {
      try {
        if (this.#payload instanceof FormData) {
          log += `  Payload       : FormData with ${this.#payload._parts ? this.#payload._parts.length : 'unknown'} parts\n`;
          // Try to log FormData contents if possible
          if (this.#payload._parts) {
            this.#payload._parts.forEach(([key, value], index) => {
              const valueStr = typeof value === 'object' && value.name ? 
                `File: ${value.name} (${value.type || 'unknown type'})` : 
                String(value);
              log += `                 [${index}] ${key}: ${valueStr}\n`;
            });
          }
        } else {
          const jsonStr =
            typeof this.#payload === 'string'
              ? this.#payload
              : JSON.stringify(
                typeof this.#payload.toJson === 'function'
                  ? this.#payload.toJson()
                  : this.#payload,
                null,
                2,
              );
          log += `  Payload       : ${jsonStr.replace(
            /\n/g,
            '\n                 ',
          )}\n`;
        }
      } catch (err) {
        log += `  Payload       : [Error stringifying payload: ${err.message}]\n`;
      }
    } else {
      log += `  Payload       : (none)\n`;
    }

    log += `${divider}\n`;
    log += `📬 Response:\n`;

    if (!this.#response) {
      log += `  (Response object is null)\n`;
      log += `${divider}\n`;
      return log;
    }

    log += `  StatusCode    : ${this.#response.status}\n`;
    log += `  Success       : ${this.#response.success ?? 'N/A'}\n`;
    log += `  Message       : ${this.#response.message ?? 'No message'}\n`;

    // Log any child properties beyond the base response
    log += this.#logChildProperties(this.#response);

    // Include errors if any
    log += `  Errors        : ${this.#formatErrors(this.#response.errors)}\n`;

    log += `${divider}\n`;
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

  get JsonObject() {
    return this.#jsonObject;
  }
}

function parseDate(value) {
  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    // Handle YYYY-MM-DD safely (treat as local date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // ISO or other formats
    return new Date(value);
  }

  if (typeof value === 'number') {
    // Handle timestamp (milliseconds)
    return new Date(value);
  }

  return null;
}

// Export classes and constants
export {
  CustomApiRequest,
  BaseApiResponse,
  BaseApiPayload,
  BaseApiModel,
  RequestMethod,
  parseDate,
};
