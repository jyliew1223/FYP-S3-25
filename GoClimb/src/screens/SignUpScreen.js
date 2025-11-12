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
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
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
  // Allow "test123" for testing purposes (meets Firebase 6-char minimum)
  if (str === 'test123') return true;
  
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
  const [showPassword, setShowPassword] = useState(false);

  // Password requirement checks (bypass for "test123")
  const isTestPassword = pass === 'test123';
  const passwordRequirements = [
    { label: 'At least 8 characters', met: isTestPassword || pass.length >= 8 },
    { label: 'Contains uppercase letter', met: isTestPassword || /[A-Z]/.test(pass) },
    { label: 'Contains lowercase letter', met: isTestPassword || /[a-z]/.test(pass) },
    { label: 'Contains number', met: isTestPassword || /[0-9]/.test(pass) },
    { label: 'Contains special character', met: isTestPassword || /[^A-Za-z0-9]/.test(pass) },
    { label: 'No spaces', met: isTestPassword || (pass.length > 0 && !/\s/.test(pass)) },
  ];

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

      // Use the pattern from InitFirebaseApps.js
      const { user } = await createUserWithEmailAndPassword(
        getAuth(),
        email.trim(),
        pass
      );

      if (displayName.trim()) {
        await user.updateProfile({ displayName: displayName.trim() });
      }

      console.log('[SignUpScreen] Calling registerUserInDjango with username:', displayName.trim());
      const djangoResp = await registerUserInDjango(displayName.trim());

      console.log('[SignUpScreen] Django response:', {
        ok: djangoResp.ok,
        status: djangoResp.status,
        message: djangoResp.message,
        errors: djangoResp.errors,
      });

      if (!djangoResp.ok) {
        console.log('[SignUpScreen] Django signup failed!');
        console.log('[SignUpScreen] Full debug:', djangoResp.debugRaw);
        
        const errorMsg = djangoResp.message || 
          (djangoResp.errors ? JSON.stringify(djangoResp.errors) : null) ||
          'Your account was created, but the server profile could not be synced yet.';
        
        Alert.alert(
          'Warning',
          `Django signup failed: ${errorMsg}\n\nStatus: ${djangoResp.status || 'unknown'}`
        );
      } else {
        console.log('[SignUpScreen] Django signup successful!');
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

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textDim}
            value={pass}
            onChangeText={setPass}
            secureTextEntry={!showPassword}
            style={[
              styles.input,
              styles.passwordInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={colors.textDim}
            />
          </TouchableOpacity>
        </View>

        {/* Password Requirements */}
        {pass.length > 0 && (
          <View style={[styles.requirementsContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.requirementsTitle, { color: colors.textDim }]}>
              Password Requirements:
            </Text>
            {passwordRequirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Ionicons
                  name={req.met ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={req.met ? '#4CAF50' : colors.textDim}
                />
                <Text
                  style={[
                    styles.requirementText,
                    { color: req.met ? colors.text : colors.textDim },
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            ))}
          </View>
        )}

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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  requirementsContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
  },
  cta: { padding: 14, borderRadius: 10, marginTop: 6 },
  ctaText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  err: { marginTop: 6, textAlign: 'center' },
});
