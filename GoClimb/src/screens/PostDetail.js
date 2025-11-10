// GoClimb/src/screens/PostDetail.js
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getAuth } from '@react-native-firebase/auth';

import {
  fetchCommentsByPostId,
  fetchPostById,
  createComment,
  deleteComment,
  likePost,
  unlikePost,
  checkIfUserLikedPost,
  getLikeCount,
} from '../services/api/PostsService';

export default function PostDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();

  const { postId } = route.params || {};

  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [toast, setToast] = useState('');
  const toastRef = useRef(null);
  function showToast(msg) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2000);
  }

  // watch auth state
  useEffect(() => {
    const sub = getAuth().onAuthStateChanged((u) => setIsLoggedIn(!!u));
    return sub;
  }, []);

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // fetch post + comments + like status + like count
      const [pRes, cRes] = await Promise.all([
        fetchPostById(postId),
        fetchCommentsByPostId(postId)
      ]);

      const pData = pRes?.success ? pRes.data : null;
      const cData = cRes?.success ? cRes.data : [];

      console.log('[DEBUG PostDetail post mapped]', pData);
      console.log('[DEBUG PostDetail comments count]', cData.length);

      if (!alive) return;

      if (pData) {
        // Get current like count and user like status
        const [likeCountRes, userLikedRes] = await Promise.all([
          getLikeCount(pData.id),
          checkIfUserLikedPost(pData.id)
        ]);

        const currentLikes = likeCountRes.success ? likeCountRes.count : pData.likes || 0;
        
        const updatedPost = {
          ...pData,
          likes: currentLikes,
        };

        setPost(updatedPost);
        setLiked(userLikedRes);
      } else {
        setPost(null);
        setLiked(false);
      }

      // Sort comments chronologically: oldest first (ascending order)
      const sortedComments = cData.sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeA - timeB; // Ascending order (oldest first)
      });
      setComments(sortedComments);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [postId]);

  const goBack = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.navigate('MainTabs', { screen: 'Home' });

  // optimistic like toggle
  async function toggleLike() {
    // Check if user is logged in
    if (!isLoggedIn) {
      navigation.navigate('SignUp');
      return;
    }

    if (!post) return;
    const wasLiked = liked;

    setLiked(!wasLiked);
    setPost((p) =>
      p
        ? {
          ...p,
          likes: Math.max(
            0,
            (p.likes || 0) + (wasLiked ? -1 : 1)
          ),
        }
        : p,
    );

    const res = wasLiked ? await unlikePost(post.id) : await likePost(post.id);

    if (!res?.success) {
      // revert if backend failed
      setLiked(wasLiked);
      setPost((p) =>
        p
          ? {
            ...p,
            likes: Math.max(
              0,
              (p.likes || 0) + (wasLiked ? 1 : -1)
            ),
          }
          : p,
      );
      showToast(res?.message || 'Could not update like');
    }
  }

  // comment submit
  async function sendComment() {
    if (!isLoggedIn) {
      navigation.navigate('SignUp'); // adjust if your signup route is different
      return;
    }

    const text = draft.trim();
    if (!text) return;

    setSending(true);
    const res = await createComment({ postId, content: text });
    if (res?.success && res.data) {
      // add new comment and maintain chronological order (oldest first)
      setComments((cur) => {
        const updated = [...cur, res.data];
        return updated.sort((a, b) => {
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeA - timeB; // Ascending order (oldest first)
        });
      });
      setDraft('');
    } else {
      showToast(res?.message || 'Failed to post comment');
    }
    setSending(false);
  }

  async function handleDeleteComment(commentId) {
    console.log('[handleDeleteComment] Starting deletion for commentId:', commentId);
    
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      console.log('[handleDeleteComment] No current user');
      showToast('You must be logged in to delete comments');
      return;
    }

    console.log('[handleDeleteComment] Current user:', currentUser.uid);

    try {
      console.log('[handleDeleteComment] Calling deleteComment API...');
      const res = await deleteComment(commentId);
      console.log('[handleDeleteComment] API response:', res);
      
      if (res?.success) {
        // Remove comment from local state
        console.log('[handleDeleteComment] Success! Removing from UI');
        setComments((cur) => cur.filter((c) => c.id !== commentId));
        showToast('Comment deleted');
      } else {
        console.log('[handleDeleteComment] Failed:', res?.message, res?.errors);
        showToast(res?.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.log('[handleDeleteComment] Exception:', error);
      showToast('Failed to delete comment');
    }
  }

  const [menuVisible, setMenuVisible] = useState(null);

  const renderComment = ({ item }) => {
    const currentUser = getAuth().currentUser;
    const isOwnComment = currentUser && item.author?.id === currentUser.uid;
    const isMenuOpen = menuVisible === item.id;
    
    console.log('[renderComment] item:', item);
    console.log('[renderComment] currentUser.uid:', currentUser?.uid);
    console.log('[renderComment] item.author?.id:', item.author?.id);
    console.log('[renderComment] isOwnComment:', isOwnComment);

    return (
      <View style={[styles.cRow, { borderBottomColor: colors.divider }]}>
        <View
          style={[
            styles.cAvatar,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textDim,
              fontWeight: '800',
              fontSize: 12,
            }}
          >
            {initials(item.author?.name)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.commentHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.cAuthor, { color: colors.text }]}
              >
                {item.author?.name ?? 'User'}
              </Text>
              <Text
                style={{
                  color: colors.textDim,
                  fontSize: 12,
                  marginBottom: 2,
                }}
              >
                {timeAgo(item.createdAt)}
              </Text>
            </View>
            {isOwnComment && (
              <View>
                <TouchableOpacity
                  onPress={() => setMenuVisible(isMenuOpen ? null : item.id)}
                  style={styles.menuBtn}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={colors.textDim}
                  />
                </TouchableOpacity>
                {isMenuOpen && (
                  <View style={[styles.commentMenu, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    <TouchableOpacity
                      onPress={() => {
                        setMenuVisible(null);
                        handleDeleteComment(item.id);
                      }}
                      style={styles.menuItem}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                      <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
          <Text style={{ color: colors.text }}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={['top', 'bottom']}
      >
        <TopBar colors={colors} onBack={goBack} />
        {toast ? <ToastBanner colors={colors} text={toast} /> : null}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={['top', 'bottom']}
      >
        <TopBar colors={colors} onBack={goBack} />
        {toast ? <ToastBanner colors={colors} text={toast} /> : null}
        <View style={styles.center}>
          <Text style={{ color: colors.textDim }}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[DEBUG PostDetail title]', { id: post.id, title: post.title });

  const header = (
    <View style={{ padding: 16 }}>
      {/* Author row */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textDim,
              fontWeight: '800',
              fontSize: 12,
            }}
          >
            {initials(post.author?.name)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[styles.author, { color: colors.text }]}
            numberOfLines={1}
          >
            {post.author?.name ?? 'User'}
          </Text>
          <Text style={[styles.meta, { color: colors.textDim }]}>
            {timeAgo(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Title/body */}
      {!!post.title && (
        <Text style={[styles.title, { color: colors.text }]}>
          {post.title}
        </Text>
      )}
      {!!post.body && (
        <Text style={[styles.body, { color: colors.text }]}>
          {post.body}
        </Text>
      )}

      {/* images */}
      {post.images && post.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}>
          {post.images.map((imgUrl, index) => (
            <Image
              key={index}
              source={{ uri: imgUrl }}
              style={[
                styles.imagePh,
                index < post.images.length - 1 && { marginRight: 10 },
              ]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      {/* tags */}
      {!!post.tags?.length && (
        <View style={styles.tagsRow}>
          {post.tags.map((t) => (
            <View
              key={t}
              style={[
                styles.tag,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textDim,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                #{t}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* action bar */}
      <View
        style={[
          styles.actionsRow,
          { borderTopColor: colors.divider },
        ]}
      >
        <RowAction
          icon={liked ? 'heart' : 'heart-outline'}
          text={String(post.likes ?? 0)}
          colors={colors}
          onPress={toggleLike}
          active={liked}
        />
        <RowAction
          icon="chatbubble-ellipses-outline"
          text={String(comments.length)}
          colors={colors}
          onPress={() => { }}
        />
        <RowAction
          icon="share-social-outline"
          text="Share"
          colors={colors}
          onPress={() => showToast('Feature under construction')}
        />
      </View>

      <Text
        style={[
          styles.commentsTitle,
          {
            color: colors.text,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        Comments
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <TopBar colors={colors} onBack={goBack} />
      {toast ? <ToastBanner colors={colors} text={toast} /> : null}

      <FlatList
        data={comments}
        keyExtractor={(i) => i.id}
        renderItem={renderComment}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
      />

      {/* comment composer */}
      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
          },
        ]}
      >
        <TextInput
          placeholder={
            isLoggedIn ? 'Write a comment…' : 'Sign up to comment…'
          }
          placeholderTextColor={colors.textDim}
          value={draft}
          onChangeText={setDraft}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.divider,
            },
          ]}
          autoCapitalize="sentences"
          autoCorrect
          editable={isLoggedIn && !sending}
        />
        <TouchableOpacity
          onPress={sendComment}
          disabled={
            sending ||
            (!isLoggedIn && true) ||
            (isLoggedIn && !draft.trim())
          }
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                !isLoggedIn ||
                  sending ||
                  (isLoggedIn && !draft.trim())
                  ? colors.surfaceAlt
                  : colors.accent,
            },
          ]}
        >
          <Ionicons
            name={isLoggedIn ? 'send' : 'log-in-outline'}
            size={18}
            color={
              !isLoggedIn ||
                sending ||
                (isLoggedIn && !draft.trim())
                ? colors.textDim
                : 'white'
            }
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ----------------- helpers ----------------- */

function initials(name) {
  const a = (name || '').trim().split(/\s+/);
  return (
    ((a[0]?.[0] || '') + (a[1]?.[0] || '')).toUpperCase() || 'U'
  );
}

function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function RowAction({ icon, text, colors, onPress, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.rowAction}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? colors.accent : colors.textDim}
      />
      {!!text && (
        <Text
          style={[
            styles.rowActionText,
            { color: active ? colors.accent : colors.textDim },
          ]}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function TopBar({ colors, onBack }) {
  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      <TouchableOpacity onPress={onBack} style={{ paddingRight: 8 }}>
        <Ionicons
          name="chevron-back"
          size={22}
          color={colors.text}
        />
      </TouchableOpacity>

      <Text style={[styles.topTitle, { color: colors.text }]}>
        Post
      </Text>

      <View style={{ width: 22 }} />
    </View>
  );
}

function ToastBanner({ colors, text }) {
  return (
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
        {text}
      </Text>
    </View>
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontWeight: '700',
    fontSize: 13,
  },
  meta: {
    fontSize: 11,
  },

  title: {
    marginTop: 6,
    fontWeight: '800',
    fontSize: 16,
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  imagesContainer: {
    marginTop: 10,
  },
  imagesContent: {
    paddingRight: 0,
  },
  imagePh: {
    width: 300,
    height: 200,
    borderRadius: 10,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  actionsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  commentsTitle: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    fontWeight: '800',
  },

  cRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cAuthor: {
    fontWeight: '700',
    fontSize: 13,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuBtn: {
    padding: 4,
    marginLeft: 8,
  },
  commentMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },

  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  rowActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
