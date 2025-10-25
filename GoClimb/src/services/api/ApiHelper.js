// src/services/api/ApiHelper.js

import { getApp } from '@react-native-firebase/app';
import appCheck, { getToken } from '@react-native-firebase/app-check';

class BaseApiPayload {

  static get fieldMapping() {}

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

class BaseApiModel {

  static get fieldMapping() {}

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

const RequestMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
});

class CustomApiRequest {
  
  #method;

  #baseUrl;

  #path;

  #payload;

  #attachAppCheckToken;

  #response;

  constructor(method, baseUrl, path, payload, attachAppCheckToken = true) {
    this.#method = method;
    this.#baseUrl = baseUrl;
    this.#path = path;
    this.#payload = payload;
    this.#attachAppCheckToken = attachAppCheckToken;
    this.#response = null;
  }

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
