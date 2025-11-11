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
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from '@react-native-community/blur';
import { fetchCurrentUserFromDjango } from '../services/api/AuthApi';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  
  // Profile picture from backend
  const [profilePicture, setProfilePicture] = useState(null);

  // Drawer state
  const [menuOpen, setMenuOpen] = useState(false);
  const { width, height } = Dimensions.get('window');
  const MENU_W = useMemo(() => Math.min(320, width * 0.82), [width]);

  // Animations
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-MENU_W - 16)).current; // start fully off-screen
  const scaleDown = useRef(new Animated.Value(1)).current; // subtle content scale

  useEffect(() => {
    // Keep hidden position correct if width changes
    slide.setValue(menuOpen ? 0 : -MENU_W - 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MENU_W]);

  // Fetch user profile picture
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const resp = await fetchCurrentUserFromDjango();
          if (resp.ok && resp.user?.profile_picture_url) {
            setProfilePicture(resp.user.profile_picture_url);
          }
        } catch (err) {
          console.log('Failed to fetch profile picture:', err);
        }
      })();
    } else {
      setProfilePicture(null);
    }
  }, [user]);

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
      navigation.navigate('SignUp');
    }
  };

  const goToProfile = () => {
    if (user) navigation.navigate('Profile');
    else navigation.navigate('SignUp');
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

        {/* Right: profile */}
        <TouchableOpacity
          onPress={goToProfile}
          style={[styles.circleBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          {profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.profileImage}
            />
          ) : (
            <Ionicons name="person" size={18} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main content (subtle scale when drawer is open, for depth) */}
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleDown }] }}>
        <View style={[styles.body, { backgroundColor: colors.bg }]}>
          {loading ? (
            <Text style={[styles.bodyText, { color: colors.text }]}>Loading…</Text>
          ) : user ? (
            <Text style={[styles.bodyText, { color: colors.text }]}>
              <Text style={{ color: colors.accent }}>Logged In!</Text> Welcome{' '}
              {user.displayName || user.email}
            </Text>
          ) : (
            <Text style={[styles.bodyText, { color: colors.text }]}>Guest Mode</Text>
          )}
        </View>
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
              <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
                {profilePicture ? (
                  <Image 
                    source={{ uri: profilePicture }} 
                    style={styles.drawerProfileImage}
                  />
                ) : (
                  <Ionicons name="person" size={22} color={colors.text} />
                )}
              </View>
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

            <DrawerItem icon="settings-outline" label="Settings" onPress={handleSettings} colors={colors} />
            <DrawerItem 
              icon="camera-outline" 
              label="AR Experience" 
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('ARCragList');
              }} 
              colors={colors} 
            />

            <DrawerItem 
              icon="folder-outline" 
              label="Route Data Manager" 
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('RouteDataManager');
              }} 
              colors={colors} 
            />
            <DrawerItem 
              icon="cube-outline" 
              label="My 3D Models" 
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('ModelManagement');
              }} 
              colors={colors} 
            />
            <DrawerItem
              icon={user ? 'log-out-outline' : 'log-in-outline'}
              label={user ? 'Logout' : 'Login / Sign Up'}
              onPress={handleLoginLogout}
              colors={colors}
            />
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

function DrawerItem({ icon, label, onPress, colors }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
      <Ionicons name={icon} size={20} color={colors.text} style={{ marginRight: 12 }} />
      <Text style={{ color: colors.text, fontSize: 15 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, borderRadius: 8 },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  appTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  body: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  bodyText: { fontSize: 18, fontWeight: '700' },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  drawerProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  drawerTitle: { fontSize: 16, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
