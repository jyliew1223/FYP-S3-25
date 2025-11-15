// GoClimb/src/screens/MyCragsRoutesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserCrags, fetchUserRoutes, deleteCrag, deleteRoute } from '../services/api/CragService';
import { UI_CONSTANTS, SCREEN_CONSTANTS, STYLE_MIXINS } from '../constants';
import { LoadingSpinner, EmptyState, Button } from '../components';

export default function MyCragsRoutesScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('crags'); // 'crags' or 'routes'
  const [userCrags, setUserCrags] = useState([]);
  const [userRoutes, setUserRoutes] = useState([]);
  const [loadingCrags, setLoadingCrags] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingItems, setDeletingItems] = useState(new Set());

  // Load user's crags
  const loadUserCrags = async (forceRefresh = false) => {
    if (!user?.uid || (cragsLoaded && !forceRefresh)) return;
    
    setLoadingCrags(true);
    try {
      const result = await fetchUserCrags(user.uid);
      if (result.success) {
        setUserCrags(result.crags);
        setCragsLoaded(true);
      }
    } catch (error) {
      console.log('[MyCragsRoutesScreen] Error loading user crags:', error);
    }
    setLoadingCrags(false);
  };

  // Load user's routes
  const loadUserRoutes = async (forceRefresh = false) => {
    if (!user?.uid || (routesLoaded && !forceRefresh)) return;
    
    setLoadingRoutes(true);
    try {
      const result = await fetchUserRoutes(user.uid);
      if (result.success) {
        setUserRoutes(result.routes);
        setRoutesLoaded(true);
      }
    } catch (error) {
      console.log('[MyCragsRoutesScreen] Error loading user routes:', error);
    }
    setLoadingRoutes(false);
  };

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'crags') {
      await loadUserCrags(true);
    } else {
      await loadUserRoutes(true);
    }
    setRefreshing(false);
  };

  // Cache flags to avoid redundant API calls
  const [cragsLoaded, setCragsLoaded] = useState(false);
  const [routesLoaded, setRoutesLoaded] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      // Load data for the active tab first
      if (activeTab === 'crags' && !cragsLoaded) {
        loadUserCrags();
      } else if (activeTab === 'routes' && !routesLoaded) {
        loadUserRoutes();
      }
    }
  }, [user?.uid, activeTab, cragsLoaded, routesLoaded]);

  const handleCragPress = (crag) => {
    // Navigate to crag details or expand functionality
    console.log('[MyCragsRoutesScreen] Crag pressed:', crag);
  };

  const handleRoutePress = (route) => {
    navigation.navigate('RouteDetails', {
      route_id: route.route_id,
      previewName: route.name,
      previewGrade: route.gradeFont,
    });
  };

  const handleDeleteCrag = (crag) => {
    Alert.alert(
      'Delete Crag',
      `Are you sure you want to delete "${crag.name}"? This action cannot be undone and will also delete all routes in this crag.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteCrag(crag),
        },
      ]
    );
  };

  const performDeleteCrag = async (crag) => {
    const cragId = crag.crag_id || crag.crag_pretty_id;
    setDeletingItems(prev => new Set(prev).add(cragId));

    try {
      const result = await deleteCrag(cragId);
      if (result.success) {
        // Remove from local state
        setUserCrags(prev => prev.filter(c => (c.crag_id || c.crag_pretty_id) !== cragId));
        Alert.alert('Success', 'Crag deleted successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to delete crag');
      }
    } catch (error) {
      console.log('[MyCragsRoutesScreen] Error deleting crag:', error);
      Alert.alert('Error', 'An error occurred while deleting the crag');
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(cragId);
      return newSet;
    });
  };

  const handleDeleteRoute = (route) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${route.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteRoute(route),
        },
      ]
    );
  };

  const performDeleteRoute = async (route) => {
    const routeId = route.route_id;
    setDeletingItems(prev => new Set(prev).add(routeId));

    try {
      const result = await deleteRoute(routeId);
      if (result.success) {
        // Remove from local state
        setUserRoutes(prev => prev.filter(r => r.route_id !== routeId));
        Alert.alert('Success', 'Route deleted successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to delete route');
      }
    } catch (error) {
      console.log('[MyCragsRoutesScreen] Error deleting route:', error);
      Alert.alert('Error', 'An error occurred while deleting the route');
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(routeId);
      return newSet;
    });
  };

  const renderCragItem = ({ item }) => {
    const cragId = item.crag_id || item.crag_pretty_id;
    const isDeleting = deletingItems.has(cragId);

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleCragPress(item)}
          disabled={isDeleting}
        >
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemLocation, { color: colors.textDim }]} numberOfLines={1}>
              📍 {item.location_details?.city || item.location_details?.country || 'Unknown Location'}
            </Text>
            {item.description && (
              <Text style={[styles.itemDescription, { color: colors.textDim }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error || '#FF3B30' }]}
          onPress={() => handleDeleteCrag(item)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRouteItem = ({ item }) => {
    const routeId = item.route_id;
    const isDeleting = deletingItems.has(routeId);

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleRoutePress(item)}
          disabled={isDeleting}
        >
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemGrade, { color: colors.accent }]} numberOfLines={1}>
              Grade: {item.gradeFont || '—'}
            </Text>
            {item.cragData?.name && (
              <Text style={[styles.itemLocation, { color: colors.textDim }]} numberOfLines={1}>
                🏔️ {item.cragData.name}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error || '#FF3B30' }]}
          onPress={() => handleDeleteRoute(item)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = (type) => (
    <View style={styles.emptyState}>
      <EmptyState
        icon={type === 'crags' ? 'location-outline' : 'trail-sign-outline'}
        title={`No ${type === 'crags' ? 'Crags' : 'Routes'} Yet`}
        subtitle={type === 'crags' 
          ? 'Create your first crag to get started' 
          : 'Create your first route to get started'
        }
      />
      <Button
        title={`Create ${type === 'crags' ? 'Crag' : 'Route'}`}
        icon="add"
        onPress={() => navigation.navigate('CreateCragRoute')}
        style={styles.createButton}
      />
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        <View style={styles.loginPrompt}>
          <EmptyState
            icon="person-outline"
            title="Sign In Required"
            subtitle="Sign in to view your crags and routes"
          />
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('PreSignUp')}
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Content</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateCragRoute')}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={[styles.addButtonText, { color: colors.accent }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crags' && styles.activeTab]}
          onPress={() => setActiveTab('crags')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'crags' ? colors.accent : colors.textDim }]}>
            My Crags ({userCrags.length})
          </Text>
          {activeTab === 'crags' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'routes' ? colors.accent : colors.textDim }]}>
            My Routes ({userRoutes.length})
          </Text>
          {activeTab === 'routes' && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'crags' ? (
          loadingCrags ? (
            <LoadingSpinner text="Loading your crags..." />
          ) : userCrags.length === 0 ? (
            renderEmptyState('crags')
          ) : (
            <FlatList
              data={userCrags}
              keyExtractor={(item) => item.crag_id || item.crag_pretty_id}
              renderItem={renderCragItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )
        ) : (
          loadingRoutes ? (
            <LoadingSpinner text="Loading your routes..." />
          ) : userRoutes.length === 0 ? (
            renderEmptyState('routes')
          ) : (
            <FlatList
              data={userRoutes}
              keyExtractor={(item) => item.route_id}
              renderItem={renderRouteItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )
        )}
      </View>
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
  headerTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
  },
  headerActions: {
    ...STYLE_MIXINS.flexRowCenter,
    gap: UI_CONSTANTS.SPACING.SM,
  },

  addButton: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },
  addButtonText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    marginLeft: UI_CONSTANTS.SPACING.XS,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  content: {
    flex: 1,
  },

  listContainer: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteButton: {
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemGrade: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    ...STYLE_MIXINS.flexCenter,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXXL,
  },
  createButton: {
    marginTop: UI_CONSTANTS.SPACING.LG,
  },
  loginPrompt: {
    flex: 1,
    ...STYLE_MIXINS.flexCenter,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXXL,
  },
  loginButton: {
    marginTop: UI_CONSTANTS.SPACING.LG,
  },
});