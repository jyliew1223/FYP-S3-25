// GoClimb/src/screens/CreatePostScreen.js

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import auth from '@react-native-firebase/auth';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { createPost } from '../services/api/PostsService';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagText, setTagText] = useState('');
  const [posting, setPosting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [toast, setToast] = useState('');
  const toastRef = useRef(null);

  function showToast(msg, durationMs = 2000) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), durationMs);
  }

  useEffect(() => {
    const sub = auth().onAuthStateChanged((u) => setIsLoggedIn(!!u));
    return sub;
  }, []);

  function goBack() {
    navigation.goBack();
  }

  async function onSubmit() {
    if (!isLoggedIn) {
      // user must log in / sign up before posting
      navigation.navigate('SignUp');
      return;
    }

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      showToast('Title and body are required.');
      return;
    }

    // tags -> array of trimmed non-empty tokens
    const tagList = tagText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setPosting(true);
    showToast('Publishing...', 4000);

    const res = await createPost({
      title: cleanTitle,
      content: cleanBody,
      tags: tagList,
    });

    setPosting(false);

    console.log('[DEBUG createPost result]', res);

    if (!res?.success) {
      showToast(res?.message || 'Failed to publish post');
      return;
    }

    // Success!
    // 1. give immediate feedback here
    showToast('Post published', 1500);

    // 2. Hard reset navigation state so we land on Forum tab again,
    //    passing { justPosted: true } down to ForumMain.
    //
    // We replace the whole stack with:
    //   - MainTabs (root)
    //   - ForumMain tab selected
    //
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              index: 0,
              routes: [
                // We recreate the TabNavigator state with ForumMain focused.
                {
                  name: 'ForumMain',
                  params: { justPosted: true },
                },
                // NOTE:
                // We *could* also recreate the other tabs here (Home, Map, etc),
                // but React Navigation will auto-fill them, so this is enough.
              ],
            },
          },
        ],
      })
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={goBack} style={{ paddingRight: 8 }}>
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: colors.text }]}>
          New Post
        </Text>

        {/* filler to balance the back arrow space */}
        <View style={{ width: 22 }} />
      </View>

      {/* Toast banner */}
      {toast ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {toast}
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={[styles.label, { color: colors.text }]}>
            Title *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
            placeholder="Looking for climbing buddies..."
            placeholderTextColor={colors.textDim}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />

          {/* Body */}
          <Text
            style={[
              styles.label,
              { color: colors.text, marginTop: 16 },
            ]}
          >
            Body *
          </Text>
          <TextInput
            style={[
              styles.multiline,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
            placeholder="Say what's on your mind..."
            placeholderTextColor={colors.textDim}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          {/* Tags */}
          <Text
            style={[
              styles.label,
              { color: colors.text, marginTop: 16 },
            ]}
          >
            Tags (comma separated)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
            placeholder="lfg, training, gear"
            placeholderTextColor={colors.textDim}
            value={tagText}
            onChangeText={setTagText}
          />

          {/* Warning if not logged in */}
          {!isLoggedIn ? (
            <View
              style={[
                styles.notLoggedBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={colors.textDim}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: colors.textDim,
                  fontSize: 12,
                }}
              >
                You need an account to post.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* bottom bar with Post button */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.postBtn,
              {
                backgroundColor:
                  posting || !title.trim() || !body.trim()
                    ? colors.surfaceAlt
                    : colors.accent,
              },
            ]}
            disabled={
              posting || !title.trim() || !body.trim()
            }
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            {posting ? (
              <ActivityIndicator
                size="small"
                color={
                  posting ||
                  !title.trim() ||
                  !body.trim()
                    ? colors.textDim
                    : 'white'
                }
              />
            ) : (
              <Text
                style={{
                  color:
                    posting ||
                    !title.trim() ||
                    !body.trim()
                      ? colors.textDim
                      : 'white',
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------ styles ------------------------------ */

const styles = StyleSheet.create({
  topBar: {
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  multiline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    minHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },

  notLoggedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 16,
  },

  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  postBtn: {
    minWidth: 80,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
