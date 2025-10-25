// src/services/api/ApiModels.js

import { BaseApiModel } from './ApiHelper.js';

class UserModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      user_id: 'user_id',
      full_name: 'full_name',
      email: 'email',
      profile_picture: 'profile_picture',
      role: 'role',
      status: 'status',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.user_id]
   * @param {string} [options.full_name]
   * @param {string} [options.email]
   * @param {string} [options.profile_picture]
   * @param {string} [options.role] - "admin" or "member"
   * @param {boolean} [options.status]
   */
  constructor({
    user_id,
    full_name,
    email,
    profile_picture,
    role,
    status,
  } = {}) {
    super();
    this.user_id = user_id ?? null;
    this.fullName = full_name ?? null;
    this.email = email ?? null;
    this.profilePicture = profile_picture ?? null;
    this.role = role ?? null;
    this.status = status ?? false;
  }
}

class CragModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      crag_id: 'crag_id',
      name: 'name',
      location_lat: 'location_lat',
      location_lon: 'location_lon',
      description: 'description',
      image_urls: 'image_urls',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.crag_id]
   * @param {string} [options.name]
   * @param {number} [options.location_lat]
   * @param {number} [options.location_lon]
   * @param {string} [options.description]
   * @param {string[]} [options.image_urls]
   */
  constructor({
    crag_id,
    name,
    location_lat,
    location_lon,
    description,
    image_urls,
  } = {}) {
    super();

    this.cragId = crag_id ?? null;
    this.name = name ?? null;
    this.locationLat = location_lat ?? null;
    this.locationLon = location_lon ?? null;
    this.description = description ?? null;
    this.imageUrls = image_urls ?? [];
  }
}

class PostModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      post_id: 'post_id',
      user: 'user',
      content: 'content',
      tags: 'tags',
      image_urls: 'image_urls',
      status: 'status',
      created_at: 'created_at',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.post_id]
   * @param {UserModel|Object} [options.user]
   * @param {string} [options.content]
   * @param {string[]} [options.tags]
   * @param {string[]} [options.image_urls]
   * @param {string} [options.status]
   * @param {Date|string} [options.created_at]
   */
  constructor({
    post_id,
    user,
    content,
    tags,
    image_urls,
    status,
    created_at,
  } = {}) {
    super();
    this.postId = post_id ?? null;

    // Handle nested UserModel object
    if (user instanceof UserModel) {
      this.user = user;
    } else if (user && typeof user === 'object') {
      this.user = new UserModel(user);
    } else {
      this.user = null;
    }

    this.content = content ?? null;
    this.tags = tags ?? [];
    this.imageUrls = image_urls ?? [];
    this.status = status ?? null;

    // Handle DateTime conversion
    if (created_at instanceof Date) {
      this.createdAtUtc = created_at;
    } else if (typeof createdAtUtc === 'string') {
      this.createdAtUtc = new Date(created_at);
    } else {
      this.createdAtUtc = null;
    }
  }

  /**
   * Gets the created date in local time (equivalent to C# CreatedAtLocal)
   * @returns {Date|null} Local time date or null if createdAtUtc is not set
   */
  get createdAtLocal() {
    if (!this.createdAtUtc) return null;
    // JavaScript Date objects are already in local time when displayed
    // but we can explicitly convert from UTC if needed
    return new Date(this.createdAtUtc.getTime());
  }

  /**
   * Override fromJson to handle nested UserModel deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {PostModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested user object
    if (jsonData.user && typeof jsonData.user === 'object') {
      instance.user = UserModel.fromJson(jsonData.user);
    }

    return instance;
  }
}

class RouteModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      route_id: 'route_id',
      routeName: 'route_name',
      routeGrade: 'route_grade',
      routeType: 'route_type',
      crag: 'crag',
    };
  }

  /**
   * @param {Object} options
   * @param {number} [options.route_id]
   * @param {string} [options.formatted_id]
   * @param {string} [options.routeName]
   * @param {number} [options.routeGrade]
   * @param {string} [options.routeType]
   * @param {CragModel|Object} [options.crag]
   */
  constructor({
    route_id,
    routeName,
    routeGrade,
    routeType,
    crag,
  } = {}) {
    super();
    this.routeId = route_id ?? null;
    this.routeName = routeName ?? null;
    this.routeGrade = routeGrade ?? null;
    this.routeType = routeType ?? null;

    // Handle nested CragModel object
    if (crag instanceof CragModel) {
      this.crag = crag;
    } else if (crag && typeof crag === 'object') {
      this.crag = new CragModel(crag);
    } else {
      this.crag = null;
    }
  }

  /**
   * Override fromJson to handle nested crag deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {RouteModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested crag object
    if (jsonData.crag && typeof jsonData.crag === 'object') {
      instance.crag = CragModel.fromJson(jsonData.crag);
    }

    return instance;
  }
}

class ClimbLogModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      log_id: 'log_id',
      user: 'user',
      route: 'route',
      date_climbed: 'date_climbed',
      notes: 'notes',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.log_id]
   * @param {UserModel|Object} [options.user]
   * @param {RouteModel|Object} [options.route]
   * @param {Date|string} [options.date_climbed]
   * @param {string} [options.notes]
   */
  constructor({ log_id, user, route, date_climbed, notes } = {}) {
    super();
    this.logId = log_id ?? null;

    // Handle nested UserModel object
    if (user instanceof UserModel) {
      this.user = user;
    } else if (user && typeof user === 'object') {
      this.user = new UserModel(user);
    } else {
      this.user = null;
    }

    // Handle nested RouteModel object
    if (route instanceof RouteModel) {
      this.route = route;
    } else if (route && typeof route === 'object') {
      this.route = new RouteModel(route);
    } else {
      this.route = null;
    }

    this.notes = notes ?? null;

    // Handle DateTime conversion
    if (date_climbed instanceof Date) {
      this.dateClimbed = date_climbed;
    } else if (typeof date_climbed === 'string') {
      this.dateClimbed = new Date(date_climbed);
    } else {
      this.dateClimbed = null;
    }
  }

  /**
   * Gets the climbed date in local time
   * @returns {Date|null} Local time date or null if dateClimbed is not set
   */
  get dateClimbedLocal() {
    if (!this.dateClimbed) return null;
    return new Date(this.dateClimbed.getTime());
  }

  /**
   * Override fromJson to handle nested object deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {ClimbLogModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested user object
    if (jsonData.user && typeof jsonData.user === 'object') {
      instance.user = UserModel.fromJson(jsonData.user);
    }

    // Handle nested route object
    if (jsonData.route && typeof jsonData.route === 'object') {
      instance.route = RouteModel.fromJson(jsonData.route);
    }

    return instance;
  }
}

export { CragModel, UserModel, PostModel, RouteModel, ClimbLogModel };
