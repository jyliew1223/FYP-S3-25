// GoClimb/src/screens/SignUpScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { registerUserInDjango } from '../services/api/AuthApi';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onSignUp() {
    try {
      setBusy(true);
      setErr('');

      // Create Firebase account
      const { user } = await auth().createUserWithEmailAndPassword(
        email.trim(),
        pass,
      );

      // Set Firebase displayName
      if (displayName) {
        await user.updateProfile({ displayName });
      }

      // Tell Django to create/sync this user in its DB (Firebase ID token + displayName + email)
      const djangoResp = await registerUserInDjango(displayName);

      if (!djangoResp.ok) {
        console.log('Django signup failed:', djangoResp.debugRaw);
        Alert.alert(
          'Warning',
          djangoResp.message ||
            'Your account was created, but the server profile could not be synced yet.',
        );
      }

      // Return to homescreen 
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
    } catch (e) {
      setErr(e?.message ?? 'Could not create account.');
    } finally {
      setBusy(false);
    }
  }

  const goBack = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.navigate('MainTabs', { screen: 'Home' });

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top bar with back chevron */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Sign Up</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.textDim}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textDim}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textDim}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />

        <TouchableOpacity
          disabled={busy}
          onPress={onSignUp}
          style={[
            styles.cta,
            {
              backgroundColor: colors.accent,
              opacity: busy ? 0.6 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {!!err && (
          <Text style={[styles.err, { color: colors.danger }]}>{err}</Text>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 10 }}
        >
          <Text style={{ textAlign: 'center', color: colors.text }}>
            Already a member?{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }}>
              Login
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, borderRadius: 8 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: { flex: 1, padding: 20, gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12 },
  cta: { padding: 14, borderRadius: 10, marginTop: 6 },
  ctaText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  err: { marginTop: 6, textAlign: 'center' },
});
