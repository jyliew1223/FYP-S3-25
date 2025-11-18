// src/services/api/ApiModels.js

import { BaseApiModel } from './ApiHelper.js';

class UserModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      user_id: 'user_id',
      username: 'username',
      email: 'email',
      status: 'status',
      profile_picture: 'profile_picture', // filename of the file backend need to know the filename when querying storage
      profile_picture_url: 'profile_picture_url', // the url of the image
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.user_id]
   * @param {string} [options.username]
   * @param {string} [options.email]
   * @param {boolean} [options.status]
   * @param {string} [options.profile_picture]
   * @param {string} [options.profile_picture_url]
   */
  constructor({
    user_id,
    username,
    email,
    status,
    profile_picture,
    profile_picture_url,
  } = {}) {
    super();

    this.user_id = user_id ?? null;
    this.username = username ?? null;
    this.email = email ?? null;
    this.status = status ?? false;
    this.profile_picture = profile_picture ?? null;
    this.profile_picture_url = profile_picture_url ?? null;
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

    this.crag_id = crag_id ?? null;
    this.name = name ?? null;
    this.location_lat = location_lat ?? null;
    this.location_lon = location_lon ?? null;
    this.description = description ?? null;
    this.image_urls = image_urls ?? [];
  }
}

class PostModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      post_id: 'post_id',
      user: 'user',
      content: 'content',
      tags: 'tags',
      status: 'status',
      created_at: 'created_at',
      image_urls: 'image_urls',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.post_id]
   * @param {UserModel|Object} [options.user]
   * @param {string} [options.content]
   * @param {string[]} [options.tags]
   * @param {string} [options.status]
   * @param {Date|string} [options.created_at]
   * @param {string[]} [options.image_urls]
   */
  constructor({
    post_id,
    user,
    content,
    tags,
    status,
    created_at,
    image_urls,
  } = {}) {
    super();
    this.post_id = post_id ?? null;
    this.user = this.wrapModel(user, UserModel);
    this.content = content ?? null;
    this.tags = tags ?? [];
    this.status = status ?? null;
    this.created_at = this.parseDate(created_at, Date);
    this.image_urls = image_urls ?? [];
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
      route_name: 'route_name',
      route_grade: 'route_grade',
      crag: 'crag',
      images_urls: 'images_urls',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.route_id]
   * @param {string} [options.route_name]
   * @param {number} [options.route_grade]
   * @param {CragModel|Object} [options.crag]
   * @param {string[]} [options.images_urls]
   */
  constructor({ route_id, route_name, route_grade, crag, images_urls } = {}) {
    super();
    this.route_id = route_id ?? null;
    this.route_name = route_name ?? null;
    this.route_grade = route_grade ?? null;
    this.crag = this.wrapModel(crag, CragModel);
    this.images_urls = images_urls ?? [];
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

    this.log_id = log_id ?? null;
    this.user = this.wrapModel(user, UserModel);
    this.route = this.wrapModel(route, RouteModel);
    this.notes = notes ?? null;
    this.date_climbed = this.parseDate(date_climbed);
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

class PostLikeModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      post: 'post',
      user: 'user',
      created_at: 'created_at',
    };
  }

  /**
   * @param {Object} options
   * @param {PostModel|Object} [options.post]
   * @param {UserModel|Object} [options.user]
   * @param {Date|string} [options.created_at]
   */
  constructor({ post, user, created_at } = {}) {
    super();

    this.post = this.wrapModel(post, PostModel);
    this.user = this.wrapModel(user, UserModel);
    this.created_at = this.parseDate(created_at);
  }

  /**
   * Override fromJson to handle nested object deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {PostLikeModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested post object
    if (jsonData.post && typeof jsonData.post === 'object') {
      instance.post = PostModel.fromJson(jsonData.post);
    }

    // Handle nested user object
    if (jsonData.user && typeof jsonData.user === 'object') {
      instance.user = UserModel.fromJson(jsonData.user);
    }

    return instance;
  }
}

class CragModelsModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      model_id: 'model_id',
      crag: 'crag',
      user: 'user',
      status: 'status',
      download_urls_json: 'download_urls_json',
    };
  }
  /**
   * @param {Object} options
   * @param {string} [options.model_id]
   * @param {CragModel|Object} [options.crag]
   * @param {UserModel|Object} [options.user]
   * @param {Boolean} [options.status]
   * @param {string} [options.download_urls_json]
   */
  constructor({ model_id, crag, user, status, download_urls_json } = {}) {
    super();

    this.model_id = model_id ?? null;
    this.crag = this.wrapModel(crag, CragModel);
    this.user = this.wrapModel(user, UserModel);
    this.status = status ?? null;
    this.download_urls_json = download_urls_json ?? null;
  }

  /**
   * Override fromJson to handle nested object deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {CragModelsModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested post object
    if (jsonData.crag && typeof jsonData.crag === 'object') {
      instance.crag = CragModel.fromJson(jsonData.crag);
    }

    // Handle nested user object
    if (jsonData.user && typeof jsonData.user === 'object') {
      instance.user = UserModel.fromJson(jsonData.user);
    }

    return instance;
  }
}

class ModelsRouteDataModel extends BaseApiModel {
  static get fieldMapping() {
    return {
      model_route_data_id: 'model_route_data_id',
      model: 'model',
      route: 'route',
      user: 'user',
      route_data: 'route_data',
      status: 'status',
    };
  }

  /**
   * @param {Object} options
   * @param {string} [options.model_route_data_id]
   * @param {CragModelsModel|Object} [options.model]
   * @param {RouteModel|Object} [options.route]
   * @param {UserModel|Object} [options.user]
   * @param {string} [options.route_data]
   * @param {Boolean} [options.status]
   */
  constructor({
    model_route_data_id,
    model,
    route,
    user,
    route_data,
    status,
  } = {}) {
    super();

    this.model_route_data_id = model_route_data_id ?? null;
    this.model = this.wrapModel(model, CragModelsModel);
    this.route = this.wrapModel(route, RouteModel);
    this.user = this.wrapModel(user, UserModel);
    this.route_data = route_data ?? null;
    this.status = status ?? null;
  }

  /**
   * Override fromJson to handle nested object deserialization
   * @param {Object} jsonData - JSON data to map to instance
   * @returns {ModelsRouteDataModel} - New instance with mapped data
   */
  static fromJson(jsonData = {}) {
    const instance = super.fromJson(jsonData);

    // Handle nested post object
    if (jsonData.model && typeof jsonData.model === 'object') {
      instance.model = CragModelsModel.fromJson(jsonData.model);
    }

    // Handle nested post object
    if (jsonData.route && typeof jsonData.route === 'object') {
      instance.route = RouteModel.fromJson(jsonData.route);
    }

    // Handle nested user object
    if (jsonData.user && typeof jsonData.user === 'object') {
      instance.user = UserModel.fromJson(jsonData.user);
    }

    return instance;
  }
}

export {
  CragModel,
  UserModel,
  PostModel,
  RouteModel,
  ClimbLogModel,
  PostLikeModel,
  CragModelsModel,
  ModelsRouteDataModel,
};
