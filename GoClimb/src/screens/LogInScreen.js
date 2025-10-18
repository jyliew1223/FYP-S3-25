// GoClimb/src/screens/LogInScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

// Keeps your original login flow and error mapping, adds SafeArea + back header.  (Based on your prior file) 

export default function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function humanize(code) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  async function onLogin() {
    try {
      setBusy(true); setErr('');
      await auth().signInWithEmailAndPassword(email.trim(), pass);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] });
    } catch (e) {
      setErr(humanize(e?.code));
    } finally {
      setBusy(false);
    }
  }

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Home' }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top bar with back chevron */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Login</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textDim}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textDim}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        <TouchableOpacity disabled={busy} onPress={onLogin} style={[styles.cta, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}>
          <Text style={styles.ctaText}> {busy ? 'Logging in…' : 'Login'} </Text>
        </TouchableOpacity>

        {!!err && <Text style={[styles.err, { color: colors.danger }]}>{err}</Text>}

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 10 }}>
          <Text style={{ textAlign: 'center', color: colors.text }}>
            New here? <Text style={{ color: colors.accent, fontWeight: '700' }}>Create an account</Text>
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
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  content: { flex: 1, padding: 20, gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12 },
  cta: { padding: 14, borderRadius: 10, marginTop: 6 },
  ctaText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  err: { marginTop: 6, textAlign: 'center' },
});
