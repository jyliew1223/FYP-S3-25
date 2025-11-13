// src/config/weather.js
// Weather API Configuration

export const WEATHER_CONFIG = {
  // OpenWeatherMap API Key
  API_KEY: '4af0805d2221055a715662f15cdcfbfa',
  
  // OpenWeatherMap endpoints
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  
  // Cache duration (30 minutes)
  CACHE_DURATION: 30 * 60 * 1000,
  
  // Units
  UNITS: 'metric', // Celsius, m/s for wind
  
  // Language
  LANG: 'en',
};

// Note: If you want to use actual Google Weather services, you'll need:
// 1. Google Maps Platform API key
// 2. Enable Places API
// 3. Use a third-party weather service that integrates with Google
// 
// OpenWeatherMap is recommended as it's:
// - Free tier available (60 calls/minute)
// - Reliable and accurate
// - Used by major apps
// - Easy to integrate
