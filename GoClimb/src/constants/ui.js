// GoClimb/src/constants/ui.js
// UI Constants used across multiple screens

export const UI_CONSTANTS = {
  // Common dimensions
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    CIRCLE: 50,
  },

  // Common padding/margins
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },

  // Common icon sizes
  ICON_SIZES: {
    SMALL: 16,
    MEDIUM: 20,
    LARGE: 24,
    XLARGE: 32,
    XXLARGE: 48,
  },

  // Common font sizes
  FONT_SIZES: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
  },

  // Common font weights
  FONT_WEIGHTS: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
  },

  // Common shadow styles
  SHADOWS: {
    SMALL: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    MEDIUM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    LARGE: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  // Common animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
  },

  // Common loading states
  LOADING_STATES: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
  },

  // Common menu widths
  MENU_WIDTH: {
    DEFAULT: 320,
    PERCENTAGE: 0.82,
  },

  // Common ranking colors
  RANKING_COLORS: {
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    BRONZE: '#CD7F32',
  },

  // Common search debounce delay
  SEARCH_DEBOUNCE_DELAY: 300,

  // Common pagination
  DEFAULT_PAGE_SIZE: 12,
  DEFAULT_RANKING_SIZE: 5,
};

// Common style mixins
export const STYLE_MIXINS = {
  // Flex center
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Flex row center
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Full width
  fullWidth: {
    width: '100%',
  },

  // Absolute fill
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Common card style
  card: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    padding: UI_CONSTANTS.SPACING.MD,
    ...UI_CONSTANTS.SHADOWS.MEDIUM,
  },

  // Common button style
  button: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SMALL,
    padding: UI_CONSTANTS.SPACING.MD,
    ...UI_CONSTANTS.SHADOWS.SMALL,
  },

  // Common input style
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SMALL,
    padding: UI_CONSTANTS.SPACING.MD,
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
};