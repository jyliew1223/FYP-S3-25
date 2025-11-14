// GoClimb/src/screens/EditProfileScreen.js

import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as DocumentPicker from '@react-native-documents/picker';
import { getAuth } from '@react-native-firebase/auth';
import { CustomApiRequest, RequestMethod } from '../services/api/ApiHelper';
import { API_ENDPOINTS } from '../constants/api';

// Removed UpdateUserResponse class - using direct JSON parsing instead

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();

  // Get current user data from route params
  const currentUsername = route?.params?.username || '';
  const currentEmail = route?.params?.email || '';
  const currentProfilePicture = route?.params?.profilePicture || null;

  console.log('[EditProfile] Route params:', {
    username: currentUsername,
    email: currentEmail,
    profilePicture: currentProfilePicture,
  });

  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [profilePicture] = useState(currentProfilePicture);
  const [selectedImage, setSelectedImage] = useState(null); // Local file to upload
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' }); // type: 'success' | 'error'

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handlePickImage = async () => {
    console.log('[EditProfile] handlePickImage called');
    
    try {
      console.log('[EditProfile] Opening DocumentPicker...');
      
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });

      console.log('[EditProfile] DocumentPicker result:', result);

      if (result && result[0]) {
        const file = result[0];
        console.log('[EditProfile] Selected image:', {
          name: file.name,
          size: file.size,
          type: file.type,
          uri: file.uri,
        });
        
        // Validate file size (max 5MB)
        if (file.size && file.size > 5 * 1024 * 1024) {
          console.log('[EditProfile] Image too large:', file.size);
          showToast('Image must be less than 5MB', 'error');
          return;
        }

        console.log('[EditProfile] Setting selected image');
        setSelectedImage(file);
        showToast('Image selected successfully', 'success');
      } else {
        console.log('[EditProfile] No file selected or result is empty');
      }
    } catch (err) {
      console.log('[EditProfile] DocumentPicker error:', err);
      console.log('[EditProfile] Error code:', err.code);
      console.log('[EditProfile] Error message:', err.message);
      
      if (DocumentPicker.isCancel(err)) {
        console.log('[EditProfile] User cancelled picker');
      } else {
        console.error('[EditProfile] Unexpected error:', err);
        showToast('Failed to pick image: ' + err.message, 'error');
      }
    }
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
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        showToast('No user logged in', 'error');
        setLoading(false);
        return;
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('user_id', currentUser.uid);
      formData.append('username', username.trim());
      formData.append('email', email.trim());

      // Add profile picture if selected
      if (selectedImage) {
        const fileUri = selectedImage.fileCopyUri || selectedImage.uri;
        const fileName = selectedImage.name || 'profile.jpg';
        const fileType = selectedImage.type || 'image/jpeg';

        formData.append('profile_picture', {
          uri: fileUri,
          type: fileType,
          name: fileName,
        });
      }

      console.log('[EditProfile] Sending update with FormData');

      // Use CustomApiRequest with FormData
      const request = new CustomApiRequest(
        RequestMethod.PUT,
        API_ENDPOINTS.BASE_URL,
        API_ENDPOINTS.USER.UPDATE_USER,
        formData,
        true // attach App Check token
      );

      await request.sendRequest();
      const response = request.JsonObject;

      if (response?.success) {
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showToast(response?.message || 'Failed to update profile', 'error');
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
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <Text style={[styles.label, { color: colors.textDim }]}>
              Profile Picture
            </Text>
            <View style={styles.profilePictureContainer}>
              <View
                style={[
                  styles.profilePictureWrapper,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.divider },
                ]}
              >
                {(() => {
                  console.log('[EditProfile] Rendering profile picture:', {
                    hasSelectedImage: !!selectedImage,
                    selectedImageUri: selectedImage?.uri,
                    hasProfilePicture: !!profilePicture,
                    profilePictureUrl: profilePicture,
                  });

                  if (selectedImage) {
                    return (
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.profilePictureImage}
                        resizeMode="cover"
                      />
                    );
                  } else if (profilePicture) {
                    return (
                      <Image
                        source={{ uri: profilePicture }}
                        style={styles.profilePictureImage}
                        resizeMode="cover"
                        onError={(e) => console.log('[EditProfile] Image load error:', e.nativeEvent.error)}
                        onLoad={() => console.log('[EditProfile] Image loaded successfully')}
                      />
                    );
                  } else {
                    return <Ionicons name="person" size={48} color={colors.textDim} />;
                  }
                })()}
              </View>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={loading}
                style={[
                  styles.changePhotoButton,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Ionicons name="camera" size={16} color="white" />
                <Text style={styles.changePhotoText}>
                  {selectedImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Text style={[styles.selectedFileText, { color: colors.accent }]}>
                ✓ New photo selected: {selectedImage.name}
              </Text>
            )}
          </View>

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
  profilePictureSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  profilePictureWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  profilePictureImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFileText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
