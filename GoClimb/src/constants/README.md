# Constants

This folder contains app-wide constants and configuration.

## Examples:
- `colors.js` - Color palette
- `dimensions.js` - Screen dimensions and spacing
- `api.js` - API endpoints
- `config.js` - App configuration

## Example:
```jsx
// constants/colors.js
export const Colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
};

// constants/dimensions.js
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// constants/api.js
export const API_ENDPOINTS = {
  BASE_URL: 'https://your-api.com/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
  },
};
```