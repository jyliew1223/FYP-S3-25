// src/services/api/WeatherService.js
// Weather API Service using OpenWeatherMap

import { WEATHER_CONFIG } from '../../config/weather';

// Weather data cache
const weatherCache = new Map();

/**
 * Get weather icon emoji based on condition code
 */
function getWeatherIcon(code, isDay = true) {
  // OpenWeatherMap condition codes
  if (code >= 200 && code < 300) return '⛈️'; // Thunderstorm
  if (code >= 300 && code < 400) return '🌦️'; // Drizzle
  if (code >= 500 && code < 600) return '🌧️'; // Rain
  if (code >= 600 && code < 700) return '❄️'; // Snow
  if (code >= 700 && code < 800) return '🌫️'; // Atmosphere (fog, mist)
  if (code === 800) return isDay ? '☀️' : '🌙'; // Clear
  if (code === 801) return isDay ? '🌤️' : '☁️'; // Few clouds
  if (code === 802) return '⛅'; // Scattered clouds
  if (code >= 803) return '☁️'; // Broken/overcast clouds
  return '🌡️'; // Default
}

/**
 * Determine if conditions are good for climbing
 */
function getClimbingConditions(weather) {
  const { temp, humidity, windSpeed, rain, description } = weather;
  
  // Bad conditions
  if (rain > 0) return { status: 'poor', reason: 'Rainy - rock may be wet' };
  if (temp < 5) return { status: 'poor', reason: 'Too cold for comfortable climbing' };
  if (temp > 35) return { status: 'poor', reason: 'Too hot - risk of heat exhaustion' };
  if (windSpeed > 10) return { status: 'poor', reason: 'High winds - unsafe' };
  if (humidity > 85) return { status: 'fair', reason: 'High humidity - rock may be damp' };
  
  // Good conditions
  if (temp >= 15 && temp <= 25 && humidity < 70 && windSpeed < 5) {
    return { status: 'excellent', reason: 'Perfect climbing weather!' };
  }
  
  // Fair conditions
  return { status: 'good', reason: 'Good conditions for climbing' };
}

/**
 * Fetch current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export async function fetchCurrentWeather(lat, lon) {
  const cacheKey = `current_${lat}_${lon}`;
  
  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CONFIG.CACHE_DURATION) {
    console.log('[WeatherService] Using cached weather data');
    return cached.data;
  }

  try {
    const url = `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${WEATHER_CONFIG.UNITS}&appid=${WEATHER_CONFIG.API_KEY}`;
    
    console.log('[WeatherService] Fetching current weather for:', { lat, lon });
    
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.main) {
      const weather = {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        windDirection: data.wind.deg,
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: getWeatherIcon(data.weather[0].id, true),
        code: data.weather[0].id,
        rain: data.rain?.['1h'] || 0,
        clouds: data.clouds.all,
        visibility: data.visibility / 1000, // Convert to km
        sunrise: data.sys.sunrise * 1000,
        sunset: data.sys.sunset * 1000,
        timestamp: Date.now(),
      };

      // Add climbing conditions
      weather.climbing = getClimbingConditions(weather);

      // Cache the result
      weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });

      return weather;
    } else {
      console.error('[WeatherService] API error:', data);
      return null;
    }
  } catch (error) {
    console.error('[WeatherService] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch 5-day weather forecast
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Forecast data
 */
export async function fetchWeatherForecast(lat, lon) {
  const cacheKey = `forecast_${lat}_${lon}`;
  
  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CONFIG.CACHE_DURATION) {
    console.log('[WeatherService] Using cached forecast data');
    return cached.data;
  }

  try {
    const url = `${WEATHER_CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${WEATHER_CONFIG.UNITS}&appid=${WEATHER_CONFIG.API_KEY}`;
    
    console.log('[WeatherService] Fetching forecast for:', { lat, lon });
    
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.list) {
      // Group forecasts by day
      const dailyForecasts = {};
      
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = {
            date: dateKey,
            temps: [],
            conditions: [],
            humidity: [],
            wind: [],
            rain: [],
            items: [],
          };
        }
        
        dailyForecasts[dateKey].temps.push(item.main.temp);
        dailyForecasts[dateKey].conditions.push(item.weather[0]);
        dailyForecasts[dateKey].humidity.push(item.main.humidity);
        dailyForecasts[dateKey].wind.push(item.wind.speed);
        dailyForecasts[dateKey].rain.push(item.rain?.['3h'] || 0);
        dailyForecasts[dateKey].items.push(item);
      });

      // Format daily summaries
      const forecast = Object.values(dailyForecasts).slice(0, 5).map(day => {
        const avgTemp = Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length);
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        const avgHumidity = Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length);
        const avgWind = Math.round((day.wind.reduce((a, b) => a + b, 0) / day.wind.length) * 3.6);
        const totalRain = day.rain.reduce((a, b) => a + b, 0);
        
        // Most common condition
        const conditionCounts = {};
        day.conditions.forEach(c => {
          conditionCounts[c.id] = (conditionCounts[c.id] || 0) + 1;
        });
        const mostCommonCode = Object.keys(conditionCounts).reduce((a, b) => 
          conditionCounts[a] > conditionCounts[b] ? a : b
        );
        const mostCommonCondition = day.conditions.find(c => c.id === parseInt(mostCommonCode));

        return {
          date: day.date,
          dateFormatted: new Date(day.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          temp: avgTemp,
          maxTemp,
          minTemp,
          humidity: avgHumidity,
          windSpeed: avgWind,
          rain: totalRain,
          description: mostCommonCondition.description,
          main: mostCommonCondition.main,
          icon: getWeatherIcon(mostCommonCondition.id, true),
          code: mostCommonCondition.id,
        };
      });

      // Cache the result
      weatherCache.set(cacheKey, { data: forecast, timestamp: Date.now() });

      return forecast;
    } else {
      console.error('[WeatherService] Forecast API error:', data);
      return null;
    }
  } catch (error) {
    console.error('[WeatherService] Forecast fetch error:', error);
    return null;
  }
}

/**
 * Clear weather cache
 */
export function clearWeatherCache() {
  weatherCache.clear();
  console.log('[WeatherService] Cache cleared');
}

/**
 * Format temperature with unit
 */
export function formatTemp(temp) {
  return `${temp}°C`;
}

/**
 * Format wind speed with unit
 */
export function formatWind(speed) {
  return `${speed} km/h`;
}

/**
 * Get wind direction text
 */
export function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
