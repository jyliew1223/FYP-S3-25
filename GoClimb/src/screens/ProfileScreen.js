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
import { fetchCurrentUserFromDjango, fetchUserByIdFromDjango } from '../services/api/AuthApi';
import { fetchUserClimbStatsMock } from '../services/api/MockProfile';
import { getUserClimbLogs, deleteClimbLog } from '../services/api/ClimbLogService';
import { convertNumericGradeToFont } from '../utils/gradeConverter';

// Default/fallback stats
const defaultStats = {
  bouldersSent: 0,
  sportRoutesSent: 0,
  onsightGradeSport: '—',
  redpointGradeSport: '—',
  avgGradeBouldering: '—',
  avgAttemptsBouldering: 0,
};

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Get userId from route params (if viewing another user's profile)
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.uid;

  // profileInfo = data from Django (UserModel)
  const [profileInfo, setProfileInfo] = useState(null);

  // stats = mock climb stats for now
  const [stats, setStats] = useState(null);

  // loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // climb logs
  const [climbLogs, setClimbLogs] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);

  // Calculate stats from climb logs
  const calculateStatsFromLogs = (logs) => {
    if (!logs || logs.length === 0) {
      return {
        bouldersSent: 0,
        avgGradeBouldering: '—',
        avgAttemptsBouldering: 0,
      };
    }

    // Filter topped logs only
    const toppedLogs = logs.filter(log => log.status === true);
    
    // Get unique route IDs to avoid counting duplicates
    const uniqueRouteIds = new Set();
    const uniqueToppedLogs = toppedLogs.filter(log => {
      const routeId = log.route?.route_pretty_id || log.route?.route_id || log.route?.id;
      if (routeId && !uniqueRouteIds.has(routeId)) {
        uniqueRouteIds.add(routeId);
        return true;
      }
      return false;
    });

    const bouldersSent = uniqueToppedLogs.length;

    // Calculate average grade from topped logs
    let avgGradeBouldering = '—';
    if (toppedLogs.length > 0) {
      const grades = toppedLogs
        .map(log => {
          const gradeRaw = log.route?.grade || log.route?.route_grade || log.route?.gradeRaw;
          return Number(gradeRaw);
        })
        .filter(grade => !isNaN(grade) && grade > 0);

      if (grades.length > 0) {
        const sum = grades.reduce((acc, grade) => acc + grade, 0);
        const avg = sum / grades.length;
        const roundedDown = Math.floor(avg);
        avgGradeBouldering = convertNumericGradeToFont(roundedDown);
      }
    }

    // Calculate average attempts from all logs
    let avgAttemptsBouldering = 0;
    if (logs.length > 0) {
      const attempts = logs
        .map(log => Number(log.attempt))
        .filter(attempt => !isNaN(attempt) && attempt > 0);
      
      if (attempts.length > 0) {
        const sum = attempts.reduce((acc, attempt) => acc + attempt, 0);
        avgAttemptsBouldering = Math.round(sum / attempts.length);
      }
    }

    return {
      bouldersSent,
      avgGradeBouldering,
      avgAttemptsBouldering,
    };
  };

  useEffect(() => {
    // load Django profile (userId, username, email, profile_picture_url, etc.)
    (async () => {
      try {
        setLoadingProfile(true);
        
        let resp;
        if (isOwnProfile) {
          // Fetch current user's profile
          resp = await fetchCurrentUserFromDjango();
        } else {
          // Fetch another user's profile by ID
          resp = await fetchUserByIdFromDjango(viewingUserId);
        }
        
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

    // load climb stats (for all profiles)
    // TODO: When backend supports fetching other users' stats, pass viewingUserId
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

    // load climb logs
    (async () => {
      try {
        setLoadingLogs(true);
        const userId = viewingUserId || user?.uid;
        if (userId) {
          const result = await getUserClimbLogs(userId);
          if (result.success) {
            setClimbLogs(result.data || []);
          } else {
            setClimbLogs([]);
          }
        }
      } catch (e) {
        console.log('[ProfileScreen] Error loading climb logs:', e);
        setClimbLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    })();
  }, [viewingUserId, user?.uid]);

  // prefer username from Django, fallback to Firebase
  const usernameFromDjango = profileInfo?.username;
  const emailFromDjango = profileInfo?.email;
  const avatarUrlFromDjango = profileInfo?.profile_picture_url;

  const fallbackName = user?.displayName || user?.email || 'username';
  const username = usernameFromDjango || fallbackName;
  const avatarUrl = avatarUrlFromDjango || null;

  // Calculate stats from climb logs
  const calculatedStats = calculateStatsFromLogs(climbLogs);
  
  // merge stats (calculated stats override mock stats)
  const merged = { ...defaultStats, ...(stats || {}), ...calculatedStats };

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
                  {isOwnProfile && (
                    <TouchableOpacity
                      style={[
                        styles.editBtn,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.divider,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        navigation.navigate('EditProfile', {
                          username: username,
                          email: emailFromDjango || user?.email,
                        });
                      }}
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
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Model Management Menu Item */}
        <TouchableOpacity
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
          onPress={() => navigation.navigate('ModelManagement')}
          activeOpacity={0.7}
        >
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.bg }]}>
              <Ionicons name="cube-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                My 3D Models
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                Manage your uploaded models
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </View>
        </TouchableOpacity>

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

        {/* Climb Logs */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <SectionTitle title="Climb Logs" colors={colors} />
          {loadingLogs ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : climbLogs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="clipboard-outline" size={36} color={colors.textDim} />
              <Text style={{ color: colors.textDim, marginTop: 8, fontSize: 14 }}>
                No climb logs yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {climbLogs.map((log) => (
                <ClimbLogItem
                  key={log.id}
                  log={log}
                  colors={colors}
                  isOwnProfile={isOwnProfile}
                  menuVisible={menuVisible}
                  setMenuVisible={setMenuVisible}
                  allLogs={climbLogs}
                  onDelete={async (logId) => {
                    try {
                      const res = await deleteClimbLog(logId);
                      if (res?.success) {
                        setClimbLogs(prev => prev.filter(l => l.id !== logId));
                      } else {
                        Alert.alert('Error', res?.message || 'Failed to delete log');
                      }
                    } catch (error) {
                      console.log('[ProfileScreen] Delete error:', error);
                      Alert.alert('Error', 'Failed to delete log');
                    }
                  }}
                />
              ))}
            </View>
          )}
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

// Climb log item component
function ClimbLogItem({ log, colors, isOwnProfile, menuVisible, setMenuVisible, onDelete, allLogs }) {
  const isMenuOpen = menuVisible === log.id;
  const gradeRaw = log.route?.grade || log.route?.route_grade || log.route?.gradeRaw;
  const gradeDisplay = convertNumericGradeToFont(gradeRaw);
  const routeName = log.route?.name || log.route?.route_name || 'Unknown Route';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Check if this is a true flash (first attempt on this route ever)
  const isFlash = () => {
    if (log.attempt !== 1 || !log.status) {
      return false;
    }

    const routeId = log.route?.route_pretty_id || log.route?.route_id || log.route?.id;
    if (!routeId || !allLogs) {
      return false;
    }

    // Get all logs for this route, sorted by date
    const routeLogs = allLogs
      .filter(l => {
        const lRouteId = l.route?.route_pretty_id || l.route?.route_id || l.route?.id;
        return lRouteId === routeId;
      })
      .sort((a, b) => new Date(a.dateClimbed) - new Date(b.dateClimbed));

    // Check if this is the first log for this route
    if (routeLogs.length > 0 && routeLogs[0].id === log.id) {
      return true;
    }

    return false;
  };

  return (
    <View
      style={[
        styles.logCard,
        { backgroundColor: colors.bg, borderColor: colors.divider },
      ]}
    >
      <View style={styles.logHeader}>
        <View style={{ flex: 1 }}>
          {!!log.title && (
            <Text style={[styles.logTitle, { color: colors.text }]}>
              {log.title}
            </Text>
          )}
          <Text style={[styles.routeName, { color: colors.text }]}>
            {routeName}, {gradeDisplay}
          </Text>
          <Text style={[styles.cragName, { color: colors.textDim }]}>
            {log.route?.crag?.name || 'Unknown Crag'}
          </Text>
          <Text style={[styles.dateText, { color: colors.textDim }]}>
            {formatDate(log.dateClimbed)}
          </Text>
        </View>

        {isOwnProfile && (
          <View>
            <TouchableOpacity
              onPress={() => setMenuVisible(isMenuOpen ? null : log.id)}
              style={styles.menuBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textDim} />
            </TouchableOpacity>
            {isMenuOpen && (
              <View
                style={[
                  styles.menu,
                  { backgroundColor: colors.surface, borderColor: colors.divider },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(null);
                    onDelete(log.id);
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {!!log.notes && (
        <Text style={[styles.notesText, { color: colors.text }]}>
          {log.notes}
        </Text>
      )}

      <View style={styles.logFooter}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.badgeText, { color: colors.textDim }]}>
            {log.attempt} {log.attempt === 1 ? 'attempt' : 'attempts'}
          </Text>
        </View>
        {log.status && (
          <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
            <Text style={[styles.badgeText, { color: 'white' }]}>Topped</Text>
          </View>
        )}
        {isFlash() && (
          <View style={[styles.badge, { backgroundColor: '#FFD700' }]}>
            <Text style={[styles.badgeText, { color: '#000' }]}>⚡ Flashed!</Text>
          </View>
        )}
      </View>
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

  menuCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
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

  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },

  // Climb log styles
  logCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cragName: {
    fontSize: 13,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
  },
  menuBtn: {
    padding: 4,
  },
  menu: {
    position: 'absolute',
    top: 30,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  logFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});