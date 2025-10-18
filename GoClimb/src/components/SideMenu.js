import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const MENU_W = Math.min(300, width * 0.8);

export default function SideMenu({ open, onClose }) {
  const x = useRef(new Animated.Value(-MENU_W)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const nav = useNavigation();

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(x, { toValue: -MENU_W, duration: 200, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [open]);

  function goSettings() {
    onClose();
    nav.navigate('Settings');
  }

  async function onLoginLogout() {
    onClose();
    if (user) {
      await auth().signOut();
    } else {
      nav.navigate('SignUp');
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: colors.overlay, opacity: fade }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, width: MENU_W,
          backgroundColor: colors.surface,
          transform: [{ translateX: x }],
          elevation: 8,
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
          paddingTop: 64, paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
          {user ? `Hello, ${user.displayName || user.email}` : 'Guest'}
        </Text>

        <MenuItem icon="settings-outline" label="Settings" onPress={goSettings} />
        <MenuItem icon={user ? 'log-out-outline' : 'log-in-outline'} label={user ? 'Logout' : 'Login / Sign Up'} onPress={onLoginLogout} />
      </Animated.View>
    </>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
    >
      <Ionicons name={icon} size={20} color={colors.text} style={{ marginRight: 10 }} />
      <Text style={{ color: colors.text, fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
}
