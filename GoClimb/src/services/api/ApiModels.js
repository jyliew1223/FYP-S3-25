// src/services/api/ApiModels.js

import { BaseApiModel } from './ApiHelper.js';

class UserModel extends BaseApiModel {
    static get fieldMapping() {
        return {
            userId: 'user_id',
            fullName: 'full_name',
            email: 'email',
            profilePicture: 'profile_picture',
            role: 'role',
            status: 'status',
        };
    }

    /**
     * @param {Object} options
     * @param {string} [options.userId]
     * @param {string} [options.fullName]
     * @param {string} [options.email]
     * @param {string} [options.profilePicture]
     * @param {string} [options.role] - "admin" or "member"
     * @param {boolean} [options.status]
     */
    constructor({ userId, fullName, email, profilePicture, role, status } = {}) {
        super();
        this.userId = userId ?? null;
        this.fullName = fullName ?? null;
        this.email = email ?? null;
        this.profilePicture = profilePicture ?? null;
        this.role = role ?? null;
        this.status = status ?? false;
    }
}

class CragModel extends BaseApiModel {
    static get fieldMapping() {
        return {
            cragId: 'crag_id',
            name: 'name',
            locationLat: 'location_lat',
            locationLon: 'location_lon',
            description: 'description',
            imageUrls: 'image_urls',
        };
    }

    /**
     * @param {Object} options
     * @param {string} [options.cragId]
     * @param {string} [options.name] 
     * @param {number} [options.locationLat] 
     * @param {number} [options.locationLon] 
     * @param {string} [options.description]
     * @param {string[]} [options.imageUrls]
     */
    constructor({ cragId, name, locationLat, locationLon, description, imageUrls } = {}) {
        super();
        this.cragId = cragId ?? null;
        this.name = name ?? null;
        this.locationLat = locationLat ?? null;
        this.locationLon = locationLon ?? null;
        this.description = description ?? null;
        this.imageUrls = imageUrls ?? [];
    }
}

class PostModel extends BaseApiModel {
    static get fieldMapping() {
        return {
            postId: 'post_id',
            user: 'user',
            content: 'content',
            tags: 'tags',
            imageUrls: 'image_urls',
            status: 'status',
            createdAtUtc: 'created_at',
        };
    }

    /**
     * @param {Object} options
     * @param {string} [options.postId]
     * @param {UserModel|Object} [options.user]
     * @param {string} [options.content]
     * @param {string[]} [options.tags]
     * @param {string[]} [options.imageUrls]
     * @param {string} [options.status]
     * @param {Date|string} [options.createdAtUtc]
     */
    constructor({ postId, user, content, tags, imageUrls, status, createdAtUtc } = {}) {
        super();
        this.postId = postId ?? null;

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
        this.imageUrls = imageUrls ?? [];
        this.status = status ?? null;

        // Handle DateTime conversion
        if (createdAtUtc instanceof Date) {
            this.createdAtUtc = createdAtUtc;
        } else if (typeof createdAtUtc === 'string') {
            this.createdAtUtc = new Date(createdAtUtc);
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
            routeId: 'route_id',
            formattedId: 'formatted_id',
            routeName: 'route_name',
            routeGrade: 'route_grade',
            routeType: 'route_type',
            crag: 'crag',
        };
    }

    /**
     * @param {Object} options
     * @param {number} [options.routeId]
     * @param {string} [options.formattedId]
     * @param {string} [options.routeName]
     * @param {number} [options.routeGrade]
     * @param {string} [options.routeType]
     * @param {CragModel|Object} [options.crag]
     */
    constructor({ routeId, formattedId, routeName, routeGrade, routeType, crag } = {}) {
        super();
        this.routeId = routeId ?? null;
        this.formattedId = formattedId ?? null;
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
            logId: 'log_id',
            user: 'user',
            route: 'route',
            dateClimbed: 'date_climbed',
            notes: 'notes',
        };
    }

    /**
     * @param {Object} options
     * @param {string} [options.logId]
     * @param {UserModel|Object} [options.user]
     * @param {RouteModel|Object} [options.route]
     * @param {Date|string} [options.dateClimbed]
     * @param {string} [options.notes]
     */
    constructor({ logId, user, route, dateClimbed, notes } = {}) {
        super();
        this.logId = logId ?? null;

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
        if (dateClimbed instanceof Date) {
            this.dateClimbed = dateClimbed;
        } else if (typeof dateClimbed === 'string') {
            this.dateClimbed = new Date(dateClimbed);
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