// src/screens/RouteDetails.js

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { fetchRouteByIdGET } from '../services/api/CragService';
import { fetchCurrentWeather, formatTemp, formatWind } from '../services/api/WeatherService';

export default function RouteDetails() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const routeNav = useRoute();

  // navigation params from CragsScreen:
  // route_id, previewName, previewGrade (previewGrade = gradeFont we passed in)
  const { route_id, previewName, previewGrade, cragLat, cragLon } = routeNav.params || {};

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const [toast, setToast] = useState('');
  const toastRef = useRef(null);
  function showToast(msg, ms = 2000) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), ms);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!route_id) {
        // no route_id means we only have preview data
        setRouteData({
          name: previewName ?? 'Route',
          gradeFont: previewGrade ?? '—',
          images: [],
        });
        setLoading(false);
        return;
      }

      const { success, route } = await fetchRouteByIdGET(route_id);
      console.log('[RouteDetails] fetchRouteByIdGET ->', { success, route });

      if (!isMounted) return;

      if (!success || !route) {
        showToast('Failed to load full route info');
        setRouteData({
          name: previewName ?? 'Route',
          gradeFont: previewGrade ?? '—',
          images: [],
        });
        setLoading(false);
        return;
      }

      // route = { route_id, name, gradeRaw, gradeFont, images: [], cragData: {...} }
      setRouteData({
        name: route.name,
        gradeFont: route.gradeFont,
        images: route.images || [],
        cragData: route.cragData,
      });
      setLoading(false);

      // Load weather if we have crag location data
      if (route.cragData?.location_lat && route.cragData?.location_lon) {
        loadWeatherData(route.cragData.location_lat, route.cragData.location_lon);
      }
    }

    async function loadWeatherData(lat, lon) {
      if (!isMounted) return;
      
      setLoadingWeather(true);
      try {
        const weatherData = await fetchCurrentWeather(lat, lon);
        if (isMounted && weatherData) {
          setWeather(weatherData);
        }
      } catch (error) {
        console.log('[RouteDetails] Error loading weather:', error);
      } finally {
        if (isMounted) {
          setLoadingWeather(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, [route_id, previewName, previewGrade]);

  // Also load weather from navigation params if provided (fallback)
  useEffect(() => {
    if (cragLat && cragLon && !weather && !loadingWeather) {
      setLoadingWeather(true);
      fetchCurrentWeather(cragLat, cragLon)
        .then(weatherData => {
          if (weatherData) {
            setWeather(weatherData);
          }
        })
        .catch(error => {
          console.log('[RouteDetails] Error loading weather from params:', error);
        })
        .finally(() => {
          setLoadingWeather(false);
        });
    }
  }, [cragLat, cragLon]);

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate to Routes tab instead of duplicate Crags stack
      navigation.navigate('MainTabs', { screen: 'Routes' });
    }
  }

  const displayName =
    routeData?.name ?? previewName ?? 'Route';
  const displayGrade =
    routeData?.gradeFont ?? previewGrade ?? '—';

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      {/* top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleBack}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={[styles.topTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* toast */}
      {toast ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {toast}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* route name + grade */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={[styles.routeHeader, { color: colors.text }]}>
              {displayName},{' '}
              <Text
                style={{
                  color: colors.accent,
                  fontWeight: '900',
                }}
              >
                {displayGrade}
              </Text>
            </Text>

            <Text
              style={[styles.subMeta, { color: colors.textDim }]}
            >
              Boulder • Outdoor
            </Text>
          </View>

          {/* image block (placeholder) */}
          <View
            style={[
              styles.imageBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {routeData?.images?.length ? (
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                }}
              >
                {`Images: ${routeData.images.length} (not rendered yet)`}
              </Text>
            ) : (
              <Text
                style={{
                  color: colors.textDim,
                  fontWeight: '700',
                }}
              >
                No images yet
              </Text>
            )}
          </View>

          {/* Weather Information */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textDim },
              ]}
            >
              Weather Conditions
            </Text>

            {loadingWeather ? (
              <View style={styles.weatherLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.weatherLoadingText, { color: colors.textDim }]}>
                  Loading weather...
                </Text>
              </View>
            ) : weather ? (
              <View style={[styles.weatherContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                <View style={styles.weatherHeader}>
                  <Text style={styles.weatherIcon}>{weather.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weatherTemp, { color: colors.text }]}>
                      {formatTemp(weather.temp)}
                    </Text>
                    <Text style={[styles.weatherDesc, { color: colors.textDim }]}>
                      {weather.description}
                    </Text>
                  </View>
                </View>

                <View style={[styles.climbingConditions, { 
                  backgroundColor: 
                    weather.climbing.status === 'excellent' ? 'rgba(76, 175, 80, 0.1)' :
                    weather.climbing.status === 'good' ? 'rgba(139, 195, 74, 0.1)' :
                    weather.climbing.status === 'fair' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                  borderColor:
                    weather.climbing.status === 'excellent' ? '#4CAF50' :
                    weather.climbing.status === 'good' ? '#8BC34A' :
                    weather.climbing.status === 'fair' ? '#FFC107' : '#FF5252'
                }]}>
                  <View style={styles.climbingHeader}>
                    <Text style={[styles.climbingTitle, { color: colors.text }]}>
                      Climbing Conditions
                    </Text>
                    <View style={[styles.climbingStatusBadge, {
                      backgroundColor:
                        weather.climbing.status === 'excellent' ? '#4CAF50' :
                        weather.climbing.status === 'good' ? '#8BC34A' :
                        weather.climbing.status === 'fair' ? '#FFC107' : '#FF5252'
                    }]}>
                      <Text style={styles.climbingStatusBadgeText}>
                        {weather.climbing.status === 'excellent' ? '🎯 Excellent' :
                         weather.climbing.status === 'good' ? '👍 Good' :
                         weather.climbing.status === 'fair' ? '⚠️ Fair' : '❌ Poor'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.climbingReason, { color: colors.textDim }]}>
                    {weather.climbing.reason}
                  </Text>
                </View>

                <View style={styles.weatherStats}>
                  <View style={styles.weatherStatRow}>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="thermometer-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Feels Like
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {formatTemp(weather.feelsLike)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="water-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Humidity
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {weather.humidity}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.weatherStatRow}>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Wind Speed
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {formatWind(weather.windSpeed)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="eye-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Visibility
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {(weather.visibility / 1000).toFixed(1)} km
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.weatherStatRow}>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="arrow-up-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Pressure
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {weather.pressure} hPa
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weatherStatItem}>
                      <Ionicons name="cloud-outline" size={20} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.weatherStatLabel, { color: colors.textDim }]}>
                          Cloud Cover
                        </Text>
                        <Text style={[styles.weatherStatValue, { color: colors.text }]}>
                          {weather.clouds}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={[styles.noWeatherText, { color: colors.textDim }]}>
                Weather data not available for this location
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },

  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  routeHeader: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subMeta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },

  imageBox: {
    height: 220,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  weatherLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  weatherLoadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  weatherContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: '800',
  },
  weatherDesc: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  climbingConditions: {
    borderRadius: 10,
    borderWidth: 2,
    padding: 12,
    marginBottom: 16,
  },
  climbingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  climbingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  climbingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  climbingStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  climbingReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  weatherStats: {
    gap: 12,
  },
  weatherStatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherStatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherStatValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  noWeatherText: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
