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

// validation helpers
function isValidEmail(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

function isStrongPassword(str) {
  if (!str || str.length < 8) return false;
  if (/\s/.test(str)) return false;
  if (!/[a-z]/.test(str)) return false;
  if (!/[A-Z]/.test(str)) return false;
  if (!/[0-9]/.test(str)) return false;
  if (!/[^A-Za-z0-9]/.test(str)) return false;
  return true;
}

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onSignUp() {
    // client-side checks
    if (!displayName.trim() || !email.trim() || !pass) {
      setErr('Please fill in all fields.');
      return;
    }

    if (/\s/.test(displayName)) {
      setErr('Username cannot contain spaces.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setErr('Please enter a valid email address.');
      return;
    }

    if (!isStrongPassword(pass)) {
      setErr(
        'Password must be 8+ chars, include upper & lower case, a number, a symbol, and no spaces.'
      );
      return;
    }

    try {
      setBusy(true);
      setErr('');

      const { user } = await auth().createUserWithEmailAndPassword(
        email.trim(),
        pass
      );

      if (displayName.trim()) {
        await user.updateProfile({ displayName: displayName.trim() });
      }

      const djangoResp = await registerUserInDjango(displayName.trim());

      if (!djangoResp.ok) {
        console.log('Django signup failed:', djangoResp.debugRaw);
        Alert.alert(
          'Warning',
          djangoResp.message ||
            'Your account was created, but the server profile could not be synced yet.'
        );
      }

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
          autoCapitalize="none"
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
            { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 },
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
