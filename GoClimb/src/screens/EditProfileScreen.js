// GoClimb/src/screens/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { updateUserInDjango } from '../services/api/AuthApi';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();

  // Get current user data from route params
  const currentUsername = route?.params?.username || '';
  const currentEmail = route?.params?.email || '';

  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' }); // type: 'success' | 'error'

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleSave = async () => {
    // Validation
    if (!username.trim()) {
      showToast('Username cannot be empty', 'error');
      return;
    }

    if (!email.trim()) {
      showToast('Email cannot be empty', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await updateUserInDjango({
        username: username.trim(),
        email: email.trim(),
      });

      if (result.ok) {
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showToast(result.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.log('[EditProfileScreen] Error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={handleCancel} style={styles.iconBtn}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.iconBtn}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="checkmark" size={26} color={colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      {toast.message ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: toast.type === 'success' ? '#4CAF50' : '#FF6B6B',
            },
          ]}
        >
          <Ionicons
            name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {/* Username Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textDim }]}>
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.textDim}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textDim }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Info Text */}
          <Text style={[styles.infoText, { color: colors.textDim }]}>
            Changes to your profile will be visible to all users.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    padding: 4,
    width: 40,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  toast: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    zIndex: 1000,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
