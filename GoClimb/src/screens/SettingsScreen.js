// GoClimb/src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import SystemUIToggle from '../components/SystemUIToggle';

const Row = ({ label, selected, onPress, colors }) => {
  // Safety check for colors and label
  if (!colors || !label) {
    console.log('[Row] Missing colors or label:', { colors, label });
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider || '#333333',
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: selected ? (colors.accent || '#007AFF') : (colors.textDim || '#666666'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {selected ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.accent || '#007AFF',
            }}
          />
        ) : null}
      </View>
      <Text style={{ color: colors.text || '#FFFFFF', fontSize: 16 }}>
        {String(label)}
      </Text>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { preference, setPreference, colors } = useTheme();

  // Debug: Check if colors is properly loaded
  console.log('[SettingsScreen] colors:', colors);
  console.log('[SettingsScreen] preference:', preference);

  // Safety check for colors
  if (!colors) {
    console.log('[SettingsScreen] Colors not loaded yet, returning loading view');
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: '#000000' }]} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} /> {/* Spacer for symmetry */}
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Appearance
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.divider,
          }}
        >
          <Row
            label="Follow System"
            selected={preference === 'system'}
            onPress={() => setPreference('system')}
            colors={colors}
          />
          <Row
            label="Dark"
            selected={preference === 'dark'}
            onPress={() => setPreference('dark')}
            colors={colors}
          />
          <Row
            label="Light"
            selected={preference === 'light'}
            onPress={() => setPreference('light')}
            colors={colors}
          />
        </View>

        {/* System UI Section - Only show on Android */}
        {Platform.OS === 'android' && (
          <>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 24 }}>
              System UI
            </Text>

            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.divider,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                  Hide System Controls
                </Text>
                <Text style={{ color: colors.textDim, fontSize: 14 }}>
                  Toggle Android navigation bar visibility
                </Text>
              </View>
              
              <SystemUIToggle 
                size={24} 
                color={colors.accent}
                style={{ marginLeft: 16 }}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
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
  title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  content: { flex: 1, padding: 16 },
});
