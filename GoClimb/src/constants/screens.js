// GoClimb/src/constants/screens.js
// Screen-specific constants

export const SCREEN_CONSTANTS = {
  // HomeScreen constants
  HOME_SCREEN: {
    TOP_BAR_HEIGHT: 56,
    TRENDING_CARD_WIDTH: 160,
    TRENDING_IMAGE_HEIGHT: 120,
    RANK_BADGE_SIZE: 32,
    PROFILE_AVATAR_SIZE: 30,
    DRAWER_AVATAR_SIZE: 36,
    ANIMATION_DURATION: {
      FADE: 220,
      SLIDE: 260,
      SCALE: 260,
    },
  },

  // ProfileScreen constants
  PROFILE_SCREEN: {
    AVATAR_SIZE: 80,
    STATS_CARD_HEIGHT: 100,
    LOG_ITEM_HEIGHT: 80,
    REFRESH_THRESHOLD: 50,
  },

  // CragsScreen constants
  CRAGS_SCREEN: {
    CRAG_ITEM_HEIGHT: 60,
    ROUTE_ITEM_HEIGHT: 50,
    SEARCH_DEBOUNCE: 300,
    ANIMATION_DURATION: 200,
  },

  // Forum constants
  FORUM_SCREEN: {
    POST_ITEM_MIN_HEIGHT: 100,
    COMMENT_ITEM_HEIGHT: 60,
    TOAST_DURATION: 2000,
    LIKE_ANIMATION_DURATION: 150,
  },

  // CreatePost constants
  CREATE_POST_SCREEN: {
    MAX_TITLE_LENGTH: 100,
    MAX_CONTENT_LENGTH: 1000,
    MAX_TAGS: 5,
    TAG_MAX_LENGTH: 20,
  },

  // LogClimb constants
  LOG_CLIMB_SCREEN: {
    MAX_NOTES_LENGTH: 500,
    MAX_TITLE_LENGTH: 100,
    MIN_ATTEMPTS: 1,
    MAX_ATTEMPTS: 99,
  },

  // Settings constants
  SETTINGS_SCREEN: {
    SECTION_SPACING: 24,
    ITEM_HEIGHT: 50,
  },

  // Search constants
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS: 10,
    DEBOUNCE_DELAY: 300,
  },
};

// Default stats for ProfileScreen
export const DEFAULT_PROFILE_STATS = {
  bouldersSent: 0,
  sportRoutesSent: 0,
  onsightGradeSport: '—',
  redpointGradeSport: '—',
  avgGradeBouldering: '—',
  avgAttemptsBouldering: 0,
};

// Sort options for Forum
export const FORUM_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_LIKED: 'mostLiked',
  LEAST_LIKED: 'leastLiked',
};

// Ranking types
export const RANKING_TYPES = {
  MOST_CLIMBS: 'mostClimbs',
  HIGHEST_BOULDER: 'highestBoulder',
  TOP_CLIMBERS: 'topClimbers',
};

// Timeframes
export const TIMEFRAMES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'alltime',
};