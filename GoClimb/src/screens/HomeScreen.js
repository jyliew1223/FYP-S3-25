// GoClimb/src/screens/HomeScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Easing,
  Platform,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from '@react-native-community/blur';
import { fetchCurrentUserFromDjango } from '../services/api/AuthApi';
import { fetchTrendingCrags } from '../services/api/CragService';
import { fetchMonthlyUserRankings } from '../services/api/RankingsService';
import { searchUsers } from '../services/api/SearchService';
import { UI_CONSTANTS, SCREEN_CONSTANTS, STYLE_MIXINS } from '../constants';
import { 
  LoadingSpinner, 
  EmptyState, 
  SearchModal, 
  RankingCard, 
  TrendingCragCard, 
  DrawerItem, 
  ProfileAvatar 
} from '../components';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // Profile picture from backend
  const [profilePicture, setProfilePicture] = useState(null);

  // Drawer state
  const [menuOpen, setMenuOpen] = useState(false);

  // Trending crags
  const [trendingCrags, setTrendingCrags] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Monthly rankings
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // User search state
  const [showUserSearch, setShowUserSearch] = useState(false);


  const { width } = Dimensions.get('window');
  const MENU_W = useMemo(() => Math.min(UI_CONSTANTS.MENU_WIDTH.DEFAULT, width * UI_CONSTANTS.MENU_WIDTH.PERCENTAGE), [width]);

  // Animations
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-MENU_W - 16)).current; // start fully off-screen
  const scaleDown = useRef(new Animated.Value(1)).current; // subtle content scale

  useEffect(() => {
    // Keep hidden position correct if width changes
    slide.setValue(menuOpen ? 0 : -MENU_W - 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MENU_W]);

  // Function to fetch profile picture
  const fetchProfilePicture = async () => {
    if (user) {
      try {
        const resp = await fetchCurrentUserFromDjango();
        if (resp.ok && resp.user?.profile_picture_url) {
          setProfilePicture(resp.user.profile_picture_url);
          setProfilePictureCached(true);
        }
      } catch (err) {
        console.log('Failed to fetch profile picture:', err);
      }
    } else {
      setProfilePicture(null);
      setProfilePictureCached(false);
    }
  };

  // Cache profile picture to avoid redundant fetches
  const [profilePictureCached, setProfilePictureCached] = useState(false);

  // Fetch user profile picture on mount and when user changes
  useEffect(() => {
    if (user && !profilePictureCached) {
      fetchProfilePicture();
    } else if (!user) {
      setProfilePicture(null);
      setProfilePictureCached(false);
    }
  }, [user, profilePictureCached]);

  // Only refresh profile picture on focus if it hasn't been cached
  useFocusEffect(
    React.useCallback(() => {
      if (user && !profilePictureCached) {
        fetchProfilePicture();
      }
    }, [user, profilePictureCached])
  );

  // Fetch trending crags
  const loadTrendingCrags = async () => {
    setLoadingTrending(true);
    try {
      const result = await fetchTrendingCrags(5);
      if (result.success) {
        setTrendingCrags(result.crags);
      }
    } catch (error) {
      console.log('Error loading trending crags:', error);
    }
    setLoadingTrending(false);
  };

  // Fetch monthly rankings
  const loadMonthlyRankings = async () => {
    setLoadingRankings(true);
    try {
      const result = await fetchMonthlyUserRankings(5);
      console.log('[HomeScreen] Monthly rankings result:', result);
      if (result.success && result.data) {
        setMonthlyRankings(result.data);
      }
    } catch (error) {
      console.log('Error loading monthly rankings:', error);
    }
    setLoadingRankings(false);
  };

  useEffect(() => {
    loadTrendingCrags();
    loadMonthlyRankings();
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTrendingCrags(),
      loadMonthlyRankings(),
      user ? fetchProfilePicture() : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  // User search function
  const handleUserSearch = async (query) => {
    const result = await searchUsers({ query: query.trim(), limit: 10 });
    return result;
  };

  const handleUserPress = (userId) => {
    setShowUserSearch(false);
    navigation.navigate('Profile', { userId });
  };



  const handleCragPress = (crag) => {
    navigation.navigate('MainTabs', {
      screen: 'Routes',
      params: {
        expandCragId: crag.crag_pk,
      },
    });
  };

  useEffect(() => {
    const timing = (val, toValue, duration = 260) =>
      Animated.timing(val, {
        toValue,
        duration,
        easing: menuOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      });

    if (menuOpen) {
      Animated.parallel([
        timing(fade, 1, 220),
        timing(slide, 0, 260),
        timing(scaleDown, Platform.OS === 'android' ? 0.98 : 0.99, 260),
      ]).start();
    } else {
      Animated.parallel([
        timing(fade, 0, 200),
        timing(slide, -MENU_W - 16, 220),
        timing(scaleDown, 1, 220),
      ]).start();
    }
  }, [menuOpen, MENU_W, fade, slide, scaleDown]);

  const handleSettings = () => {
    setMenuOpen(false);
    navigation.navigate('Settings');
  };

  const handleLoginLogout = async () => {
    setMenuOpen(false);
    if (user) {
      await auth().signOut();
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      navigation.navigate('PreSignUp');
    }
  };

  const goToProfile = () => {
    if (user) navigation.navigate('Profile');
    else navigation.navigate('PreSignUp');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {/* Top bar: <menu>  GoClimb  <profile> */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        {/* Left: burger menu */}
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn}>
          <Ionicons name="menu" size={26} color={colors.text} />
        </TouchableOpacity>

        {/* Center: title */}
        <Text style={[styles.appTitle, { color: colors.text }]}>GoClimb</Text>

        {/* Right: search and profile */}
        <View style={styles.topRightActions}>
          <TouchableOpacity onPress={() => setShowUserSearch(true)} style={styles.iconBtn}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToProfile}
            style={styles.circleBtn}
          >
            <ProfileAvatar
              imageUrl={profilePicture}
              username={user?.displayName || user?.email}
              size={SCREEN_CONSTANTS.HOME_SCREEN.PROFILE_AVATAR_SIZE}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content (subtle scale when drawer is open, for depth) */}
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleDown }] }}>
        <ScrollView 
          style={[styles.body, { backgroundColor: colors.bg }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        >

          {/* Monthly Rankings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Top Climbers</Text>
            
            {loadingRankings ? (
              <LoadingSpinner />
            ) : monthlyRankings.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title="No rankings available"
                subtitle="Check back later for updated rankings"
              />
            ) : (
              <RankingCard
                rankings={monthlyRankings}
                onSeeMore={() => {
                  navigation.navigate('RankingList', {
                    type: 'mostClimbs',
                    timeframe: 'monthly'
                  });
                }}
                onUserPress={(userId) => navigation.navigate('Profile', { userId })}
              />
            )}
          </View>

          {/* Trending Crags Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Crags</Text>
            
            {loadingTrending ? (
              <LoadingSpinner />
            ) : trendingCrags.length === 0 ? (
              <EmptyState
                icon="trending-up-outline"
                title="No trending crags available"
                subtitle="Check back later for trending crags"
              />
            ) : (
              <FlatList
                horizontal
                data={trendingCrags}
                keyExtractor={(item) => item.crag_pretty_id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingList}
                renderItem={({ item }) => (
                  <TrendingCragCard
                    crag={item}
                    onPress={handleCragPress}
                  />
                )}
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Overlay + Drawer */}
      {menuOpen && (
        <>
          {/* Animated overlay container */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: fade },
            ]}
          >
            {/* Optional blur (auto-fallback to plain dim if module not installed) */}
            {BlurView ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={colors.mode === 'dark' ? 'dark' : 'light'}
                blurAmount={12}
                reducedTransparencyFallbackColor={
                  colors.mode === 'dark' ? '#000' : '#fff'
                }
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.overlay },
                ]}
              />
            )}

            {/* Extra tint to darken a bit more */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.25)' },
              ]}
            />

            {/* Tapping background closes the drawer */}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          </Animated.View>

          {/* Sliding drawer */}
          <Animated.View
            style={[
              styles.drawer,
              {
                width: MENU_W,
                transform: [{ translateX: slide }],
                paddingTop: 16,
                backgroundColor: colors.surface,
                borderRightColor: colors.divider,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 12, // Android shadow
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <ProfileAvatar
                imageUrl={profilePicture}
                username={user?.displayName || user?.email}
                size={SCREEN_CONSTANTS.HOME_SCREEN.DRAWER_AVATAR_SIZE}
                style={{ marginRight: UI_CONSTANTS.SPACING.MD }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>
                  {user ? user.displayName || user.email : 'Guest'}
                </Text>
                <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 2 }}>
                  {user ? 'Signed in' : 'Not signed in'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={{ flex: 1 }}>
              <DrawerItem icon="settings-outline" label="Settings" onPress={handleSettings} />
              
              <DrawerItem 
                icon="help-circle-outline" 
                label="FAQ" 
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate('FAQ');
                }} 
              />
              
              {/* Only show these options if user is logged in */}
              {user && (
                <>
                  <DrawerItem 
                    icon="list-outline" 
                    label="My Crags & Routes" 
                    onPress={() => {
                      setMenuOpen(false);
                      navigation.navigate('MyCragsRoutes');
                    }} 
                  />

                  <DrawerItem 
                    icon="camera-outline" 
                    label="AR Experience" 
                    onPress={() => {
                      setMenuOpen(false);
                      navigation.navigate('ARCragList');
                    }} 
                  />

                  <DrawerItem 
                    icon="folder-outline" 
                    label="Route Data Manager" 
                    onPress={() => {
                      setMenuOpen(false);
                      navigation.navigate('RouteDataManager');
                    }} 
                  />
                  
                  <DrawerItem 
                    icon="cube-outline" 
                    label="My 3D Models" 
                    onPress={() => {
                      setMenuOpen(false);
                      navigation.navigate('ModelManagement');
                    }} 
                  />
                </>
              )}
            </View>

            {/* Login/Logout at the bottom */}
            <View style={{ paddingBottom: 20 }}>
              <View style={[styles.divider, { backgroundColor: colors.divider, marginBottom: 12 }]} />
              <DrawerItem
                icon={user ? 'log-out-outline' : 'log-in-outline'}
                label={user ? 'Logout' : 'Login / Sign Up'}
                onPress={handleLoginLogout}
              />
            </View>
          </Animated.View>
        </>
      )}

      {/* User Search Modal */}
      <SearchModal
        visible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        title="Search Users"
        placeholder="Search for users..."
        searchFunction={handleUserSearch}
        keyExtractor={(item) => item.user_id}
        emptyIcon="person-outline"
        emptyTitle="No users found"
        emptySubtitle="Try a different search term"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userResultItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
            onPress={() => handleUserPress(item.user_id)}
          >
            <ProfileAvatar
              imageUrl={item.profile_picture_url}
              username={item.username}
              size={40}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.username}</Text>
              <Text style={[styles.userEmail, { color: colors.textDim }]}>{item.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={UI_CONSTANTS.ICON_SIZES.MEDIUM} color={colors.textDim} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: SCREEN_CONSTANTS.HOME_SCREEN.TOP_BAR_HEIGHT,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    ...STYLE_MIXINS.flexRowCenter,
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { 
    padding: UI_CONSTANTS.SPACING.XS, 
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SMALL 
  },
  circleBtn: {
    ...STYLE_MIXINS.flexCenter,
    overflow: 'hidden',
  },
  appTitle: { 
    fontSize: UI_CONSTANTS.FONT_SIZES.LG, 
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD, 
    letterSpacing: 0.3 
  },
  topRightActions: {
    ...STYLE_MIXINS.flexRowCenter,
    gap: UI_CONSTANTS.SPACING.SM,
  },

  body: { flex: 1 },

  section: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  sectionTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XXL,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.EXTRABOLD,
    marginHorizontal: UI_CONSTANTS.SPACING.LG,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  trendingLoading: {
    padding: 40,
    alignItems: 'center',
  },
  trendingEmpty: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  trendingEmptyText: {
    fontSize: 14,
  },
  trendingList: {
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    gap: UI_CONSTANTS.SPACING.MD,
  },
  trendingCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingGrowth: {
    fontSize: 12,
    fontWeight: '600',
  },

  rankingLoading: {
    padding: 40,
    alignItems: 'center',
  },
  rankingEmpty: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  rankingEmptyText: {
    fontSize: 14,
  },
  rankingCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  rankingUsername: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  rankingClimbs: {
    fontSize: 12,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },
  drawerHeader: { 
    ...STYLE_MIXINS.flexRowCenter, 
    marginBottom: UI_CONSTANTS.SPACING.MD, 
    marginTop: UI_CONSTANTS.SPACING.SM 
  },
  drawerTitle: { 
    fontSize: UI_CONSTANTS.FONT_SIZES.LG, 
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD 
  },
  divider: { 
    height: StyleSheet.hairlineWidth, 
    marginVertical: UI_CONSTANTS.SPACING.MD 
  },

  // User search result styles
  userResultItem: {
    ...STYLE_MIXINS.flexRowCenter,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MEDIUM,
    marginBottom: UI_CONSTANTS.SPACING.SM,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    marginRight: UI_CONSTANTS.SPACING.MD,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
});
