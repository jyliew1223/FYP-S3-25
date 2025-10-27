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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  fetchCommentsByPostId,
  fetchPostById,
} from '../services/api/PostsService';

export default function PostDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { postId } = route.params || {};

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  // toast for "Feature under construction"
  const [toast, setToast] = useState('');
  const toastTimeoutRef = useRef(null);
  function showToast(msg) {
    setToast(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast('');
    }, 2000);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [p, c] = await Promise.all([
        fetchPostById(postId),
        fetchCommentsByPostId(postId),
      ]);

      if (!alive) return;
      setPost(p?.success ? p.data : null);
      setComments(c?.success ? c.data : []);
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

  const sendComment = async () => {
    if (!draft.trim()) return;
    // For now, comments posting is WIP.
    // We'll just fake the append locally.
    setSending(true);

    const newComment = {
      id: 'local-' + Math.random().toString(36).slice(2, 8),
      author: { id: 'me', name: 'You' },
      text: draft.trim(),
      createdAt: Date.now(),
    };
    setComments((cur) => [newComment, ...cur]);
    setDraft('');
    setSending(false);

    // Eventually: call backend to actually post comment.
    showToast('Feature under construction');
  };

  const renderComment = ({ item }) => (
    <View
      style={[
        styles.cRow,
        { borderBottomColor: colors.divider },
      ]}
    >
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
        <Text style={{ color: colors.text }}>{item.text}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={['top', 'bottom']}
      >
        <TopBar colors={colors} onBack={goBack} />
        {toast ? (
          <ToastBanner colors={colors} text={toast} />
        ) : null}
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
        {toast ? (
          <ToastBanner colors={colors} text={toast} />
        ) : null}
        <View style={styles.center}>
          <Text style={{ color: colors.textDim }}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* Header */}
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
                <Text
                  style={[styles.meta, { color: colors.textDim }]}
                >
                  {timeAgo(post.createdAt)}
                </Text>
              </View>
            </View>

            {/* Title/Body */}
            <Text style={[styles.title, { color: colors.text }]}>
              {post.title}
            </Text>
            {!!post.body && (
              <Text style={[styles.body, { color: colors.text }]}>
                {post.body}
              </Text>
            )}

            {/* Optional Image */}
            {post.imageUrl ? (
              <View
                style={[
                  styles.imagePh,
                  { backgroundColor: '#555' },
                ]}
              />
            ) : null}

            {/* Tags */}
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

            {/* Actions */}
            <View
              style={[
                styles.actionsRow,
                { borderTopColor: colors.divider },
              ]}
            >
              <RowAction
                icon="heart-outline"
                text={String(post.likes ?? 0)}
                colors={colors}
                onPress={() =>
                  showToast('Feature under construction')
                }
              />
              <RowAction
                icon="chatbubble-ellipses-outline"
                text={String(post.comments ?? 0)}
                colors={colors}
                onPress={() =>
                  showToast('Feature under construction')
                }
              />
              <RowAction
                icon="share-social-outline"
                text="Share"
                colors={colors}
                onPress={() =>
                  showToast('Feature under construction')
                }
              />
            </View>

            {/* Comments label */}
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
        }
        renderItem={renderComment}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
      />

      {/* Composer */}
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
          placeholder="Write a comment…"
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
        />
        <TouchableOpacity
          onPress={sendComment}
          disabled={sending || !draft.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor: colors.accent,
              opacity: sending || !draft.trim() ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text
        style={[styles.topTitle, { color: colors.text }]}
      >
        Post
      </Text>
      <View style={{ width: 26 }} />
    </View>
  );
}

function RowAction({ icon, text, colors, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.textDim} />
      <Text
        style={[styles.actionText, { color: colors.textDim }]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function initials(name) {
  const parts = String(name || '')
    .split(' ')
    .filter(Boolean);
  if (!parts.length) return 'U';
  return (
    (parts[0][0] || 'U').toUpperCase() +
    (parts[1]?.[0] || '').toUpperCase()
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const styles = StyleSheet.create({
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
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  toast: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  author: { fontWeight: '800', fontSize: 14 },
  meta: { fontSize: 12 },

  title: { fontSize: 18, fontWeight: '900', marginTop: 6 },
  body: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  imagePh: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginTop: 12,
    backgroundColor: '#555',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: { fontWeight: '700', fontSize: 12 },

  commentsTitle: {
    fontSize: 15,
    fontWeight: '800',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
});
