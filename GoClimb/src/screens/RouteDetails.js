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

export default function RouteDetails() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const routeNav = useRoute();

  // navigation params from CragsScreen:
  // route_id, previewName, previewGrade (previewGrade = gradeFont we passed in)
  const { route_id, previewName, previewGrade } = routeNav.params || {};

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);

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

      // route = { route_id, name, gradeRaw, gradeFont, images: [] }
      setRouteData({
        name: route.name,
        gradeFont: route.gradeFont,
        images: route.images || [],
      });
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, [route_id, previewName, previewGrade]);

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Crags');
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

          {/* AR button */}
          <TouchableOpacity
            style={[
              styles.arBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
              },
            ]}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('AR', {
                routeName: displayName,
                grade: displayGrade,
              })
            }
          >
            <Text
              style={[
                styles.arBtnText,
                { color: colors.accent },
              ]}
            >
              AR View
            </Text>
          </TouchableOpacity>

          {/* description placeholder */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textDim },
              ]}
            >
              Description
            </Text>

            <Text
              style={[styles.bodyText, { color: colors.text }]}
            >
              Classic line. Good landing. Tall enough to be fun but
              not sketch. Crux is on the last move when you’re tired.
              Bring 2 pads and a spotter if you’re new.
            </Text>

            <Text
              style={[styles.bodyText, { color: colors.text }]}
            >
              This text can come from backend later if your serializer
              adds a description field per route.
            </Text>
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

  arBtn: {
    marginHorizontal: 16,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  arBtnText: {
    fontWeight: '800',
    fontSize: 16,
  },

  sectionLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  bodyText: {
    lineHeight: 20,
    marginBottom: 10,
  },
});
