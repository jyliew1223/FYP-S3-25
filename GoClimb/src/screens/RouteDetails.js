// GoClimb/src/screens/RouteDetails.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Adapted from your prototype. :contentReference[oaicite:1]{index=1}

export default function RouteDetails() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const route = useRoute();
  const { name = 'Route', grade = '—' } = route.params || {};

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.titleTop, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Header line */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          {name}, <Text style={{ color: colors.accent, fontWeight: '900' }}>{grade}</Text>
        </Text>
      </View>

      {/* Image placeholder */}
      <View
        style={[
          styles.imageBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: colors.textDim, fontWeight: '700' }}>Route here</Text>
      </View>

      {/* AR button */}
      <TouchableOpacity
        style={[
          styles.arBtn,
          { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AR', { name, grade })}
      >
        <Text style={[styles.arBtnText, { color: colors.accent }]}>AR View</Text>
      </TouchableOpacity>

      {/* Description */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Description</Text>
        <Text style={[styles.body, { color: colors.text }]}>
          A crowd-pleasing line with friendly holds and a sneaky crux near the top. Best climbed on cooler evenings when the slopers feel stickier. Start on the obvious blocky jug, establish feet on the ripple, then move right to a positive crimp rail. Keep hips close for the bump to the high edge, match, and stand tall to the finishing bucket.
        </Text>
        <Text style={[styles.body, { color: colors.text }]}>
          Recommended: good brushing, a soft shoe for smearing, and two pads for the landing. Watch the dab rock on the left—most folks keep it honest by staying right of the seam.
        </Text>
      </View>
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
  iconBtn: { padding: 6, borderRadius: 8 },
  titleTop: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  imageBox: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 12,
  },

  arBtn: {
    marginHorizontal: 16,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  arBtnText: { fontWeight: '800', fontSize: 16 },

  sectionLabel: { fontWeight: '700', marginBottom: 6 },
  body: { lineHeight: 20, marginBottom: 10 },
});
