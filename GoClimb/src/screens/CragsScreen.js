// src/screens/CragsScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import {
  fetchAllCragsBootstrap,
  fetchRoutesByCragIdGET,
} from '../services/api/CragService';
import { searchCrags } from '../services/api/SearchService';
import { useAuth } from '../context/AuthContext';
import { UI_CONSTANTS, SCREEN_CONSTANTS, STYLE_MIXINS } from '../constants';
import { LoadingSpinner, EmptyState, SearchModal } from '../components';
import ModelPicker from '../components/ModelPicker';

export default function CragsScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // crags array we render in UI
  // each: {
  //   crag_pk: 3,
  //   crag_pretty_id: "CRAG-000003",
  //   name: "Toast Bunch",
  //   ...
  // }
  const [crags, setCrags] = useState([]);
  const [loadingCrags, setLoadingCrags] = useState(true);

  // which crag is expanded right now
  const [expandedCragPk, setExpandedCragPk] = useState(null);

  // loading state of each crag's routes
  const [loadingCragRoutes, setLoadingCragRoutes] = useState({}); // { [pk]: bool }

  // cache of routes per crag_pk
  // crag_pk -> [{ route_id, name, gradeFont, ... }]
  const routesCacheRef = useRef(new Map());

  // AR Model Picker state
  const [selectedCragForAR, setSelectedCragForAR] = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Search state
  const [showCragSearch, setShowCragSearch] = useState(false);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // load crags function
  const loadCrags = async () => {
    setLoadingCrags(true);
    try {
      const liveCrags = await fetchAllCragsBootstrap();
      // Sort crags alphabetically by name
      const sortedCrags = liveCrags.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setCrags(sortedCrags);
    } catch (error) {
      console.log('[CragsScreen] Error loading crags:', error);
      setCrags([]);
    }
    setLoadingCrags(false);
  };

  // Pull-to-refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear route cache to force refetch
    routesCacheRef.current.clear();
    await loadCrags();
    setRefreshing(false);
  };

  // initial load of crags from backend using bootstrap
  useEffect(() => {
    loadCrags();
  }, []);

  // Handle refresh and auto-expand from navigation params
  useEffect(() => {
    const shouldRefresh = route?.params?.refresh;
    const expandCragId = route?.params?.expandCragId;
    
    if (shouldRefresh) {
      // Clear the refresh param to prevent infinite loops
      navigation.setParams({ refresh: false });
      
      // Reload crags
      loadCrags();
      
      // Clear route cache to force refetch
      routesCacheRef.current.clear();
    }
    
    if (expandCragId && crags.length > 0) {
      const cragToExpand = crags.find(c => c.crag_pk === expandCragId);
      if (cragToExpand) {
        onToggleCrag(cragToExpand);
      }
    }
  }, [route?.params?.refresh, route?.params?.expandCragId, crags]);

  async function onToggleCrag(crag) {
    const pk = crag.crag_pk;
    console.log('[onToggleCrag] crag:', crag);
    console.log('[onToggleCrag] pk:', pk);

    if (pk == null) {
      console.log('[onToggleCrag] No valid crag_pk, cannot fetch routes');
      return;
    }

    if (expandedCragPk === pk) {
      // collapse it
      setExpandedCragPk(null);
      return;
    }

    // expand this crag
    // if we don't have routes cached for it yet, fetch
    if (!routesCacheRef.current.has(pk)) {
      setLoadingCragRoutes((prev) => ({ ...prev, [pk]: true }));

      console.log('[onToggleCrag] Fetching routes for crag_pk:', pk);

      try {
        // Try pretty ID first since API test shows "CRAG-000026" format
        const cragIdToUse = crag.crag_pretty_id || pk;
        const { success, routes } = await fetchRoutesByCragIdGET(cragIdToUse);

        if (success) {
          // Sort routes by grade for better UX
          const sortedRoutes = routes.sort((a, b) => {
            const gradeA = a.route_grade || 0;
            const gradeB = b.route_grade || 0;
            return gradeA - gradeB;
          });
          routesCacheRef.current.set(pk, sortedRoutes);
        } else {
          routesCacheRef.current.set(pk, []);
        }
      } catch (error) {
        console.log('[onToggleCrag] Error fetching routes:', error);
        routesCacheRef.current.set(pk, []);
      }

      setLoadingCragRoutes((prev) => ({ ...prev, [pk]: false }));
    }

    setExpandedCragPk(pk);
  }

  function onPressRoute(routeObj) {
    if (!routeObj?.route_id) return;

    navigation.navigate('RouteDetails', {
      route_id: routeObj.route_id,
      previewName: routeObj.name,
      previewGrade: routeObj.gradeFont,
    });
  }

  function handleARPress(crag) {
    // Check if user is logged in
    if (!user) {
      navigation.navigate('PreSignUp');
      return;
    }
    
    setSelectedCragForAR(crag);
    setShowModelPicker(true);
  }

  function handleCloseModelPicker() {
    setShowModelPicker(false);
    setSelectedCragForAR(null);
  }

  const handleCragPress = (crag) => {
    setShowCragSearch(false);
    // Navigate to crag detail screen
    navigation.navigate('CragDetail', {
      cragId: crag.crag_pretty_id || crag.crag_id,
      previewName: crag.name,
    });
  };

  // Search crags function
  const handleCragSearch = async (query) => {
    const result = await searchCrags({ query: query.trim(), limit: 20 });
    if (result.success) {
      // Map search results to match the expected format
      const mappedResults = result.data.map(crag => ({
        crag_pk: crag.crag_id,
        crag_pretty_id: crag.crag_id,
        name: crag.name,
        location_lat: crag.location_lat,
        location_lon: crag.location_lon,
        location_details: crag.location_details,
        description: crag.description,
        images: crag.images_urls || [],
      }));
      return { success: true, data: mappedResults };
    }
    return { success: false, data: [] };
  };

  // Use crags for main display
  const displayCrags = crags;

  function renderCragCard(crag) {
    const pk = crag.crag_pk;
    const isExpanded = expandedCragPk === pk;
    const isLoadingRoutes = !!loadingCragRoutes[pk];
    const cachedRoutes = routesCacheRef.current.get(pk) || [];

    return (
      <View
        key={pk ?? crag.crag_pretty_id}
        style={[
          styles.cragCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.divider,
          },
        ]}
      >
        {/* HEADER ROW */}
        <TouchableOpacity
          style={styles.cragHeaderRow}
          activeOpacity={0.8}
          onPress={() => onToggleCrag(crag)}
        >
          <View style={styles.cragHeaderLeft}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.text}
              style={{ marginRight: 6 }}
            />
            <Text
              numberOfLines={1}
              style={[styles.cragName, { color: colors.text }]}
            >
              {crag.name || 'Unknown Crag'}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('CragDetail', {
                  cragId: crag.crag_pretty_id || crag.crag_id,
                  previewName: crag.name,
                });
              }}
              style={styles.cragDetailButton}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.cragHeaderRight}>
            {isLoadingRoutes ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* ROUTE LIST */}
        {isExpanded ? (
          <View style={styles.routesListWrapper}>
            {/* AR Button - Always shown at top when expanded */}
            <TouchableOpacity
              style={[styles.arButton, { backgroundColor: colors.accent }]}
              onPress={() => handleARPress(crag)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.arButtonText}>AR Experience</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {isLoadingRoutes ? (
              <View style={styles.routesLoadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.textDim },
                  ]}
                >
                  Loading routes…
                </Text>
              </View>
            ) : cachedRoutes.length === 0 ? (
              <View style={styles.routesEmptyRow}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.textDim}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.textDim },
                  ]}
                >
                  No routes found
                </Text>
              </View>
            ) : (
              cachedRoutes.map((r) => (
                <TouchableOpacity
                  key={r.route_id}
                  style={styles.routeRow}
                  activeOpacity={0.8}
                  onPress={() => onPressRoute(r)}
                >
                  <View style={styles.routeRowLeft}>
                    <Ionicons
                      name="trail-sign-outline"
                      size={16}
                      color={colors.accent}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.routeName,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {r.name || 'Unnamed Route'}
                    </Text>
                    <Text
                      style={[
                        styles.routeGrade,
                        { color: colors.accent },
                      ]}
                      numberOfLines={1}
                    >
                      {r.gradeFont || '—'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textDim}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'bottom']}
    >
      {/* HEADER */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.bg,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
        >
          Crags & Routes
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowCragSearch(true)} style={styles.searchButton}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateCragRoute')}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.addButtonText, { color: colors.accent }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>



      {loadingCrags ? (
        <LoadingSpinner text="Loading crags…" />
      ) : displayCrags.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No crags available"
          subtitle="Check back later or add a new crag"
        />
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        >
          {displayCrags.map(renderCragCard)}
        </ScrollView>
      )}

      {/* Model Picker Modal */}
      {showModelPicker && selectedCragForAR && (
        <Modal
          visible={showModelPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModelPicker}
        >
          <View style={styles.modelPickerOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1} 
              onPress={handleCloseModelPicker}
            />
            <View style={[styles.modelPickerContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.modelPickerHeader, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={handleCloseModelPicker}>
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modelPickerTitle, { color: colors.text }]}>
                  Select Model for {selectedCragForAR.name}
                </Text>
                <View style={{ width: 24 }} />
              </View>
              
              <View style={styles.modelPickerContent}>
                <ModelPicker
                  cragId={selectedCragForAR.crag_id || selectedCragForAR.crag_pretty_id}
                  enableDirectAR={true}
                  cragName={selectedCragForAR.name}
                  onARClose={() => {
                    setShowModelPicker(false);
                    setSelectedCragForAR(null);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Crag Search Modal */}
      <SearchModal
        visible={showCragSearch}
        onClose={() => setShowCragSearch(false)}
        title="Search Crags"
        placeholder="Search for crags..."
        searchFunction={handleCragSearch}
        keyExtractor={(item) => item.crag_pk || item.crag_pretty_id}
        emptyIcon="location-outline"
        emptyTitle="No crags found"
        emptySubtitle="Try a different search term"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cragResultItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
            onPress={() => handleCragPress(item)}
          >
            <View style={styles.cragResultContent}>
              <Text style={[styles.cragResultName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.cragResultLocation, { color: colors.textDim }]} numberOfLines={1}>
                📍 {item.location_details?.city || item.location_details?.country || 'Unknown Location'}
              </Text>
              {item.description && (
                <Text style={[styles.cragResultDescription, { color: colors.textDim }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={UI_CONSTANTS.ICON_SIZES.MEDIUM} color={colors.textDim} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: SCREEN_CONSTANTS.CRAGS_SCREEN.CRAG_ITEM_HEIGHT + 4,
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
  searchButton: {
    padding: UI_CONSTANTS.SPACING.XS,
  },
  addButton: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },
  addButtonText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },

  centerBox: {
    flex: 1,
    ...STYLE_MIXINS.flexCenter,
  },
  emptyText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    textAlign: 'center',
  },

  cragCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    marginBottom: UI_CONSTANTS.SPACING.LG,
    overflow: 'hidden',
  },

  cragHeaderRow: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
  },
  cragHeaderLeft: {
    ...STYLE_MIXINS.flexRowCenter,
    flexShrink: 1,
  },
  cragHeaderRight: {
    marginLeft: 'auto',
    ...STYLE_MIXINS.flexRowCenter,
  },
  cragName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
  },
  cragDetailButton: {
    marginLeft: 8,
    padding: 4,
  },

  routesListWrapper: {
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    paddingBottom: UI_CONSTANTS.SPACING.SM,
  },
  routesLoadingRow: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
  },
  loadingText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM + 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    marginLeft: UI_CONSTANTS.SPACING.XS,
  },

  routesEmptyRow: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
  },
  emptyText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM + 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    fontStyle: 'italic',
  },

  routeRow: {
    ...STYLE_MIXINS.flexRowCenter,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  routeRowLeft: {
    ...STYLE_MIXINS.flexRowCenter,
    flexShrink: 1,
    flex: 1,
  },
  routeName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    marginRight: UI_CONSTANTS.SPACING.XS,
  },
  routeGrade: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.EXTRABOLD,
  },

  arButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },

  modelPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modelPickerContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modelPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modelPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modelPickerContent: {
    flex: 1,
    padding: 16,
  },

  // Search modal styles

  cragResultItem: {
    ...STYLE_MIXINS.flexRowCenter,
    padding: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cragResultContent: {
    flex: 1,
  },
  cragResultName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  cragResultLocation: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  cragResultDescription: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    lineHeight: UI_CONSTANTS.SPACING.LG,
  },
});
