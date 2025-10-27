// src/services/api/ApiHelper.js

import { getApp } from '@react-native-firebase/app';
import appCheck, { getToken } from '@react-native-firebase/app-check';

/**
 * BaseApiPayload
 * - Knows how to map its internal field names to the JSON keys
 *   expected by backend using static fieldMapping.
 */
class BaseApiPayload {
  static get fieldMapping() {
    // subclass overrides
    return {};
  }

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
 * BaseApiModel
 * - For mapping backend JSON into JS model instances.
 */
class BaseApiModel {
  static get fieldMapping() {
    // subclass overrides
    return {};
  }

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
      // try "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(value);
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    return null;
  }
}

/**
 * BaseApiResponse
 * - Default shape for responses coming back from Django.
 */
class BaseApiResponse {
  static get fieldMapping() {
    return {
      status: 'status',
      success: 'success',
      message: 'message',
      errors: 'errors',
    };
  }

  static fromJson(jsonData = {}) {
    const mapping = this.fieldMapping;
    const mappedData = {};

    for (const [internalKey, jsonKey] of Object.entries(mapping)) {
      mappedData[internalKey] = jsonData[jsonKey];
    }

    return new this(mappedData);
  }

  constructor({ status, success, message, errors } = {}) {
    this.status = status;
    this.success = success ?? false;
    this.message = message ?? null;
    this.errors = errors ?? null;
  }
}

/**
 * Allowed HTTP verbs.
 */
const RequestMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
});

/**
 * CustomApiRequest
 *
 * You create one of these and call sendRequest().
 * It handles:
 * - URL building
 * - headers (including X-Firebase-AppCheck)
 * - body serialization for non-GET
 * - parsing JSON response
 * - logging
 */
class CustomApiRequest {
  #method;
  #baseUrl;
  #path;
  #payload;
  #attachAppCheckToken;
  #response;

  constructor(method, baseUrl, path, payload, attachAppCheckToken = true) {
    this.#method = method; // RequestMethod.POST, etc.
    this.#baseUrl = baseUrl; // e.g. "https://server/api/" OR "https://server/"
    this.#path = path; // e.g. "post/get_random_post/" OR "user/get_user/"
    this.#payload = payload; // instance of BaseApiPayload or plain object
    this.#attachAppCheckToken = attachAppCheckToken;
    this.#response = null;
  }

  /**
   * Build the full URL, making sure there's exactly one slash.
   * Example:
   *   base "https://x.y/api/"
   *   path "post/get_random_post/"
   * => "https://x.y/api/post/get_random_post/"
   */
  #buildUrl() {
    const base = this.#baseUrl.replace(/\/$/, ''); // remove trailing slash
    const pathNoLead = this.#path.replace(/^\//, ''); // remove leading slash
    return `${base}/${pathNoLead}`;
  }

  /**
   * Convert an object (or payload) into "?a=b&c=d"
   */
  #toQueryString(obj) {
    if (!obj) return '';
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        );
      }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
  }

  /**
   * Stringify the payload for body if method != GET/DELETE
   */
  #buildBody() {
    if (
      this.#method === RequestMethod.GET ||
      this.#method === RequestMethod.DELETE
    ) {
      return null;
    }

    if (!this.#payload) {
      return '';
    }

    // if payload has .toJson(), use that mapping
    if (typeof this.#payload.toJson === 'function') {
      return JSON.stringify(this.#payload.toJson());
    }

    // else assume it's a plain object
    return JSON.stringify(this.#payload);
  }

  /**
   * Build headers (including App Check if needed)
   */
  async #buildHeaders() {
    const headers = {};

    // For non-GET/DELETE, we send JSON
    if (
      this.#method !== RequestMethod.GET &&
      this.#method !== RequestMethod.DELETE
    ) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.#attachAppCheckToken) {
      // getToken() from @react-native-firebase/app-check
      // false = forceRefresh? your previous code used false.
      const tokenResult = await getToken(getApp().appCheck(), false);
      headers['X-Firebase-AppCheck'] = tokenResult.token;
    }

    return headers;
  }

  /**
   * Internal helper for dumping values to console
   */
  #formatErrors(errors) {
    if (!errors) return 'No errors';
    if (typeof errors === 'string') return errors;
    if (typeof errors === 'object') return JSON.stringify(errors, null, 2);
    return String(errors);
  }

  #formatChildProperties(response) {
    let log = '';
    const baseProps = Object.getOwnPropertyNames(new BaseApiResponse({}));
    const allProps = Object.keys(response || {});
    const childProps = allProps.filter(p => !baseProps.includes(p));

    for (const prop of childProps) {
      const value = response[prop];
      let formattedValue;
      if (value === null) {
        formattedValue = 'null';
      } else if (value === undefined) {
        formattedValue = 'undefined';
      } else if (typeof value === 'string') {
        formattedValue = `"${value}"`;
      } else if (
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        formattedValue = String(value);
      } else if (Array.isArray(value) || typeof value === 'object') {
        formattedValue = JSON.stringify(value, null, 2).replace(
          /\n/g,
          '\n\t' + ' '.repeat(14)
        );
      } else {
        formattedValue = JSON.stringify(value);
      }

      log += `\t${prop.padEnd(12)}: ${formattedValue}\n`;
    }

    return log;
  }

  /**
   * Public helper to pretty-print the response we parsed
   */
  logResponse(prefix = this.constructor.name) {
    if (!this.#response) {
      return `${prefix}: Response is null.`;
    }

    let log = `${prefix}: Response:\n`;
    log += `\t${'StatusCode'.padEnd(12)}: ${this.#response.status}\n`;
    log += `\t${'Success'.padEnd(12)}: ${
      this.#response.success || 'Success not stated'
    }\n`;
    log += `\t${'Message'.padEnd(12)}: ${
      this.#response.message || 'No message'
    }\n`;

    // dump extra fields like data, etc.
    log += this.#formatChildProperties(this.#response);

    log += `\t${'Errors'.padEnd(12)}: ${this.#formatErrors(
      this.#response.errors
    )}\n`;

    return log;
  }

  /**
   * Main call.
   * - builds URL
   * - attaches querystring if GET
   * - logs request
   * - fetches
   * - parses JSON (or logs the HTML error)
   */
  async sendRequest(ResponseClass = BaseApiResponse) {
    // 1. build URL
    let finalUrl = this.#buildUrl();

    // If GET and payload provided, add query string
    if (this.#method === RequestMethod.GET && this.#payload) {
      finalUrl += this.#toQueryString(
        typeof this.#payload.toJson === 'function'
          ? this.#payload.toJson()
          : this.#payload
      );
    }

    // 2. headers + body
    const headers = await this.#buildHeaders();
    const bodyString = this.#buildBody();

    const fetchOptions = {
      method: this.#method,
      headers,
    };
    if (bodyString !== null) {
      fetchOptions.body = bodyString;
    }

    // 3. DEBUG REQUEST (correct values)
    console.log('[DEBUG REQUEST]', {
      method: this.#method,
      url: finalUrl,
      headers,
      body:
        bodyString && bodyString.length
          ? JSON.parse(bodyString)
          : null,
    });

    // 4. fetch
    let responseText = '';
    let res;
    try {
      res = await fetch(finalUrl, fetchOptions);
      responseText = await res.text();
    } catch (networkErr) {
      console.error(
        `Network error: ${networkErr.message || networkErr}\n` +
          `Details: ${networkErr.stack || 'No stack trace available'}`
      );
      // synthesize a "failed" response object
      this.#response = ResponseClass.fromJson({
        status: 0,
        success: false,
        message: 'Network error',
        errors: { network: networkErr.message || String(networkErr) },
      });
      this.#response.status = 0;
      return false;
    }

    // 5. parse JSON if possible
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(
        `Failed to parse JSON: ${parseErr.message}\n` +
          `Raw response:\n${responseText}\n`
      );
      parsedJson = {
        status: res.status,
        success: false,
        message: 'Non-JSON response from server',
        errors: null,
      };
    }

    // 6. wrap in ResponseClass
    this.#response = ResponseClass.fromJson(parsedJson || {});
    // ensure status is always present
    this.#response.status = res.status;

    // 7. success logic
    const httpOk = res.ok; // 2xx
    const logicalOk =
      this.#response.success === undefined
        ? true
        : !!this.#response.success;

    if (httpOk && logicalOk) {
      return true;
    } else {
      console.error('Request Failed:\n' + this.logResponse());
      return false;
    }
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
