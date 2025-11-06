// GoClimb/src/screens/ProfileScreen.js

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchCurrentUserFromDjango } from '../services/api/AuthApi';
import { fetchUserClimbStatsMock } from '../services/api/MockProfile';

// Default/fallback stats
const defaultStats = {
  bouldersSent: 0,
  sportRoutesSent: 0,
  onsightGradeSport: '—',
  redpointGradeSport: '—',
  avgGradeBouldering: '—',
  avgAttemptsBouldering: 0,
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  // profileInfo = data from Django (UserModel)
  const [profileInfo, setProfileInfo] = useState(null);

  // stats = mock climb stats for now
  const [stats, setStats] = useState(null);

  // loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // load Django profile (userId, username, email, profile_picture_url, etc.)
    (async () => {
      try {
        setLoadingProfile(true);
        const resp = await fetchCurrentUserFromDjango();
        if (!resp.ok) {
          console.log('Profile fetch failed:', resp.debugRaw);
          Alert.alert(
            'Error',
            resp.message || 'Could not load profile from server.',
          );
          setProfileInfo(null);
        } else {
          setProfileInfo(resp.user); // resp.user is a UserModel
        }
      } catch (err) {
        console.log('Profile fetch exception:', err);
        Alert.alert('Error', err.message || 'Unexpected error loading profile.');
        setProfileInfo(null);
      } finally {
        setLoadingProfile(false);
      }
    })();

    // load climb stats mock (your original behaviour)
    (async () => {
      try {
        setLoadingStats(true);
        const result = await fetchUserClimbStatsMock();
        if (result.success) {
          setStats(result.data);
        } else {
          setStats(null);
        }
      } catch (e) {
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  // prefer username from Django, fallback to Firebase
  const usernameFromDjango = profileInfo?.username;
  const emailFromDjango = profileInfo?.email;
  const avatarUrlFromDjango = profileInfo?.profile_picture_url;

  const fallbackName = user?.displayName || user?.email || 'username';
  const username = usernameFromDjango || fallbackName;
  const avatarUrl = avatarUrlFromDjango || null;

  // merge stats
  const merged = { ...defaultStats, ...(stats || {}) };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  // show loading state on top of screen
  const profileStillLoading = loadingProfile;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top Bar (blank title, just a back chevron) */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {/* If profile data is still loading, show a loader card */}
        {profileStillLoading ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              },
            ]}
          >
            <ActivityIndicator color={colors.text} />
            <Text style={{ color: colors.textDim, marginTop: 8 }}>
              Loading profile…
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            {/* Profile header */}
            <View style={styles.headerRow}>
              <View style={styles.avatarWrapper}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarInitial,
                        { color: colors.text },
                      ]}
                    >
                      {username?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.headerRight}>
                <Text
                  style={[styles.username, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {username}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textDim,
                    marginBottom: 6,
                  }}
                  numberOfLines={1}
                >
                  {emailFromDjango || user?.email || '—'}
                </Text>

                <View style={styles.chipsRow}>
                  <StatChip
                    label="Boulders"
                    value={merged.bouldersSent}
                    colors={colors}
                  />
                  <TouchableOpacity
                    style={[
                      styles.editBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.divider,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {}}
                  >
                    <Text
                      style={[
                        styles.editBtnText,
                        { color: colors.text },
                      ]}
                    >
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bouldering stats card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <SectionTitle title="Bouldering" colors={colors} />
          <View style={styles.twoColRow}>
            <TwoLineStat
              label="Avg. Grade"
              value={merged.avgGradeBouldering}
              colors={colors}
            />
            <TwoLineStat
              label="Avg. Attempts"
              value={String(merged.avgAttemptsBouldering)}
              colors={colors}
            />
          </View>
        </View>

        {/* Logged activities placeholder */}
        <View
          style={[
            styles.card,
            styles.activitiesCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ color: colors.accent, fontSize: 14 }}>
            {'<logged activities here>'}
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Section header ("Sport", "Bouldering")
function SectionTitle({ title, colors }) {
  return (
    <Text
      style={{
        alignSelf: 'center',
        fontSize: 16,
        color: colors.textDim,
        fontWeight: '600',
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

// Small 2-line stat widget (label + number/grade)
function TwoLineStat({ label, value, colors }) {
  return (
    <View
      style={[
        styles.twoLineStat,
        {
          backgroundColor: colors.bg,
          borderColor: colors.divider,
        },
      ]}
    >
      <Text
        style={{
          color: colors.textDim,
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// Chip-style stat bubble used under username
function StatChip({ label, value, colors }) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.bg,
          borderColor: colors.divider,
        },
      ]}
    >
      <Text style={{ color: colors.textDim, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {String(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

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

  headerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
  },

  headerRight: {
    flex: 1,
    flexDirection: 'column',
  },

  username: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  twoLineStat: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },

  sectionDivider: {
    height: 1,
    marginVertical: 12,
  },

  activitiesCard: {
    height: 260,
  },
});
