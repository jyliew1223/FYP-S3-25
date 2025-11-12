// src/screens/CragsScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import {
  fetchAllCragsBootstrap,
  fetchRoutesByCragIdGET,
} from '../services/api/CragService';

export default function CragsScreen({ navigation, route }) {
  const { colors } = useTheme();

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

  // initial load of crags from backend using bootstrap
  useEffect(() => {
    loadCrags();
  }, []);

  // Handle auto-expand from navigation params
  useEffect(() => {
    const expandCragId = route?.params?.expandCragId;
    if (expandCragId && crags.length > 0) {
      const cragToExpand = crags.find(c => c.crag_pk === expandCragId);
      if (cragToExpand) {
        onToggleCrag(cragToExpand);
      }
    }
  }, [route?.params?.expandCragId, crags]);

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
      console.log('[onToggleCrag] Trying pretty_id instead:', crag.crag_pretty_id);

      // Try pretty ID first since API test shows "CRAG-000026" format
      const cragIdToUse = crag.crag_pretty_id || pk;
      const { success, routes } = await fetchRoutesByCragIdGET(cragIdToUse);

      setLoadingCragRoutes((prev) => ({ ...prev, [pk]: false }));

      if (success) {
        routesCacheRef.current.set(pk, routes);
      } else {
        routesCacheRef.current.set(pk, []);
      }
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
      </View>

      {loadingCrags ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.textDim, marginTop: 8 },
            ]}
          >
            Loading crags…
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          {crags.map(renderCragCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cragCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },

  cragHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cragHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  cragHeaderRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cragName: {
    fontSize: 16,
    fontWeight: '700',
  },

  routesListWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  routesLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  routesEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  routeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  routeGrade: {
    fontSize: 14,
    fontWeight: '800',
  },
});
