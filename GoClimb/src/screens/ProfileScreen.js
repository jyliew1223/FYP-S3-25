// GoClimb/src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserClimbStatsMock } from '../services/api/MockProfile';

const defaultStats = {
  bouldersSent: 34,
  sportRoutesSent: 8,
  onsightGradeSport: '6b+',
  redpointGradeSport: '7b',
  avgGradeBouldering: '6C',
  avgAttemptsBouldering: 19,
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const result = await fetchUserClimbStatsMock();
      if (result.success) setStats(result.data);
    })();
  }, []);

  const username = user?.displayName || user?.email || 'username';
  const avatarUrl = null; // TODO: plug in user photoURL later
  const merged = { ...defaultStats, ...stats };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top Bar (blank title, just a back chevron) */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={{ width: 26 }} />{/* spacer to balance layout */}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <View style={styles.headerRow}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, alignItems:'center', justifyContent:'center' }]}>
                  <Text style={[styles.avatarInitial, { color: colors.text }]}>
                    {username?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              <Text style={[styles.username, { color: colors.text }]}>{username}</Text>

              <View style={styles.chipsRow}>
                <StatChip label="Boulders" value={merged.bouldersSent} colors={colors} />
                <StatChip label="Sport" value={merged.sportRoutesSent} colors={colors} />
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                  activeOpacity={0.8}
                  onPress={() => {}}
                >
                  <Text style={[styles.editBtnText, { color: colors.text }]}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Sport section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <SectionTitle title="Sport" colors={colors} />
          <View style={styles.twoColRow}>
            <TwoLineStat label="Onsight" value={merged.onsightGradeSport} colors={colors} />
            <TwoLineStat label="Redpoint" value={merged.redpointGradeSport} colors={colors} />
          </View>

        {/* Divider */}
          <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

          <SectionTitle title="Bouldering" colors={colors} />
          <View style={styles.twoColRow}>
            <TwoLineStat label="Avg. Grade" value={merged.avgGradeBouldering} colors={colors} />
            <TwoLineStat label="Avg. Attempts" value={String(merged.avgAttemptsBouldering)} colors={colors} />
          </View>
        </View>

        {/* Logged activities placeholder */}
        <View style={[styles.card, styles.activitiesCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={{ color: colors.accent, fontSize: 14 }}>{'<logged activities here>'}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, colors }) {
  return (
    <Text
      style={{
        alignSelf:'center',
        fontSize:16,
        color: colors.textDim,
        fontWeight:'700',
        marginBottom:12,
        marginTop:4,
        letterSpacing:0.3,
      }}
    >
      {title}
    </Text>
  );
}

function TwoLineStat({ label, value, colors }) {
  return (
    <View style={styles.twoLineStat}>
      <Text style={{ fontSize: 13, color: colors.textDim, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, color: colors.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function StatChip({ label, value, colors }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
      <Text style={{ color: colors.textDim, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },

  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, borderRadius: 8 },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { marginRight: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarInitial: { fontSize: 28, fontWeight: '700' },

  headerRight: { flex: 1 },
  username: { fontSize: 22, fontWeight: '700', marginBottom: 10 },

  chipsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 12, fontWeight: '600' },

  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  twoLineStat: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },

  sectionDivider: { height: 1, marginVertical: 12 },
  activitiesCard: { height: 260, alignItems: 'center', justifyContent: 'center' },
});
