// GoClimb/src/screens/CragDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchCragInfoGET, fetchRoutesByCragIdGET } from '../services/api/CragService';
import { UI_CONSTANTS, SCREEN_CONSTANTS, STYLE_MIXINS } from '../constants';
import { LoadingSpinner, EmptyState } from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CragDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Get crag ID from route params
  const cragId = route?.params?.cragId;
  const previewName = route?.params?.previewName;
  
  const [crag, setCrag] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load crag details
  const loadCragDetails = async () => {
    if (!cragId) return;
    
    setLoading(true);
    try {
      const result = await fetchCragInfoGET(cragId);
      if (result.success) {
        setCrag(result.crag);
      } else {
        Alert.alert('Error', 'Failed to load crag details');
      }
    } catch (error) {
      console.log('[CragDetailScreen] Error loading crag:', error);
      Alert.alert('Error', 'Failed to load crag details');
    }
    setLoading(false);
  };

  // Load routes for this crag
  const loadRoutes = async () => {
    if (!cragId) return;
    
    setLoadingRoutes(true);
    try {
      const result = await fetchRoutesByCragIdGET(cragId);
      if (result.success) {
        setRoutes(result.routes || []);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.log('[CragDetailScreen] Error loading routes:', error);
      setRoutes([]);
    }
    setLoadingRoutes(false);
  };

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      loadCragDetails(),
      loadRoutes()
    ]);
  };

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [cragId]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Routes' });
    }
  };

  const handleRoutePress = (route) => {
    navigation.navigate('RouteDetails', {
      route_id: route.route_id,
      previewName: route.name,
      previewGrade: route.gradeFont,
    });
  };

  const handleLocationPress = () => {
    if (!crag.location_lat || !crag.location_lon) {
      Alert.alert('Location Unavailable', 'GPS coordinates are not available for this crag.');
      return;
    }

    const lat = crag.location_lat;
    const lon = crag.location_lon;
    const label = encodeURIComponent(crag.name || 'Crag Location');

    // Create different URL schemes for different platforms
    const urls = [
      // Google Maps (works on both iOS and Android)
      `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${label}`,
      // Apple Maps (iOS)
      `http://maps.apple.com/?q=${label}&ll=${lat},${lon}`,
      // Generic geo URL (fallback)
      `geo:${lat},${lon}?q=${lat},${lon}(${label})`
    ];

    // Try to open the first available URL
    const tryOpenUrl = async (urlIndex = 0) => {
      if (urlIndex >= urls.length) {
        Alert.alert('Error', 'Unable to open maps application.');
        return;
      }

      try {
        const url = urls[urlIndex];
        const canOpen = await Linking.canOpenURL(url);
        
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Try next URL
          tryOpenUrl(urlIndex + 1);
        }
      } catch (error) {
        console.log(`Error opening map URL ${urls[urlIndex]}:`, error);
        // Try next URL
        tryOpenUrl(urlIndex + 1);
      }
    };

    tryOpenUrl();
  };

  const renderRouteItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.routeCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
      onPress={() => handleRoutePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.routeInfo}>
        <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.routeGrade, { color: colors.accent }]}>
          {item.gradeFont || '—'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
    </TouchableOpacity>
  );

  const renderImageItem = ({ item, index }) => (
    <Image
      source={{ uri: item }}
      style={[
        styles.cragImage,
        index < crag.images.length - 1 && { marginRight: 12 }
      ]}
      resizeMode="cover"
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {previewName || 'Crag Details'}
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <LoadingSpinner text="Loading crag details..." />
      </SafeAreaView>
    );
  }

  if (!crag) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Crag Not Found</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="location-outline"
            title="Crag Not Found"
            subtitle="This crag could not be loaded"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {crag.name}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Crag Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={[styles.cragName, { color: colors.text }]}>{crag.name}</Text>
          
          {/* Location - Clickable to open in maps */}
          <TouchableOpacity 
            style={styles.locationRow} 
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text style={[styles.locationText, { color: colors.textDim }]}>
              {crag.location_details?.formatted_address || 
               [crag.location_details?.city, crag.location_details?.country].filter(Boolean).join(', ') ||
               crag.country ||
               'Unknown Location'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textDim} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Coordinates - Only show if they are valid numeric coordinates */}
          {crag.location_lat && crag.location_lon && 
           typeof crag.location_lat === 'number' && typeof crag.location_lon === 'number' && (
            <View style={styles.coordinatesRow}>
              <Ionicons name="navigate" size={16} color={colors.textDim} />
              <Text style={[styles.coordinatesText, { color: colors.textDim }]}>
                {crag.location_lat.toFixed(6)}, {crag.location_lon.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Description */}
          {crag.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: colors.text }]}>Description</Text>
              <Text style={[styles.descriptionText, { color: colors.textDim }]}>
                {crag.description}
              </Text>
            </View>
          )}
        </View>

        {/* Images */}
        {crag.images && crag.images.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Images</Text>
            <FlatList
              data={crag.images}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderImageItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesContainer}
            />
          </View>
        )}

        {/* Routes Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <View style={styles.routesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Routes ({routes.length})
            </Text>
            {user && (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateCragRoute', { 
                  initialTab: 'route',
                  selectedCrag: crag 
                })}
                style={[styles.addRouteButton, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addRouteButtonText}>Add Route</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingRoutes ? (
            <View style={styles.routesLoading}>
              <ActivityIndicator color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textDim }]}>Loading routes...</Text>
            </View>
          ) : routes.length === 0 ? (
            <View style={styles.emptyRoutes}>
              <EmptyState
                icon="trail-sign-outline"
                title="No Routes Yet"
                subtitle="Be the first to add a route to this crag"
              />
              {user && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('CreateCragRoute', { 
                    initialTab: 'route',
                    selectedCrag: crag 
                  })}
                  style={[styles.createRouteButton, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.createRouteButtonText}>Create First Route</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.routesList}>
              {routes.map((route) => (
                <View key={route.route_id}>
                  {renderRouteItem({ item: route })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: SCREEN_CONSTANTS.HOME_SCREEN.TOP_BAR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    ...STYLE_MIXINS.flexRowCenter,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    ...STYLE_MIXINS.flexCenter,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXXL,
  },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  cragName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordinatesText: {
    fontSize: 12,
    marginLeft: 8,
    fontFamily: 'monospace',
  },

  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  imagesContainer: {
    paddingRight: 16,
  },
  cragImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },

  routesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  routesLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },

  emptyRoutes: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  createRouteButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  routesList: {
    gap: 8,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeGrade: {
    fontSize: 14,
    fontWeight: '600',
  },
});