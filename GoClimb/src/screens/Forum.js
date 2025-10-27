// GoClimb/src/screens/Forum.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { fetchRandomPosts } from '../services/api/PostsService';

export default function Forum({ navigation }) {
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // toast for "Feature under construction"
  const [toast, setToast] = useState('');
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast('');
    }, 2000);
  }, []);

  // initial load
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchRandomPosts({ count: 12 });
    setPosts(res?.success ? res.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // blacklist using backend IDs we already have
    const blacklist = posts.map((p) => p.id);
    const res = await fetchRandomPosts({ count: 12, blacklist });
    setPosts(res?.success ? res.data : []);
    setRefreshing(false);
  }, [posts]);

  // filter locally by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => String(t).toLowerCase().includes(q)),
    );
  }, [posts, query]);

  const openPost = (post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const renderItem = ({ item }) => (
    <PostCard
      post={item}
      onPress={() => openPost(item)}
      colors={colors}
      onUnavailable={() => showToast('Feature under construction')}
    />
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        <Text style={[styles.topTitle, { color: colors.text }]}>Forum</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={load} style={styles.topIcon}>
            <Ionicons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => showToast('Feature under construction')}
            style={styles.topIcon}
          >
            <Ionicons name="create-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast banner (top overlay near header) */}
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
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
            {toast}
          </Text>
        </View>
      ) : null}

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          placeholder="Search posts"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}

// small circle avatar with initials
function Avatar({ name, colors }) {
  const initials =
    (name?.split(' ')?.[0]?.[0] || '').toUpperCase() +
    (name?.split(' ')?.[1]?.[0] || '').toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.divider },
      ]}
    >
      <Text
        style={{ color: colors.textDim, fontWeight: '800', fontSize: 12 }}
      >
        {initials || 'U'}
      </Text>
    </View>
  );
}

function Tag({ text, colors }) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.divider },
      ]}
    >
      <Text
        style={{ color: colors.textDim, fontSize: 11, fontWeight: '700' }}
      >
        #{text}
      </Text>
    </View>
  );
}

function PostCard({ post, onPress, colors, onUnavailable }) {
  const time = timeAgo(post.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      {/* header */}
      <View style={styles.cardHeader}>
        <Avatar name={post.author?.name} colors={colors} />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[styles.author, { color: colors.text }]}
          >
            {post.author?.name || 'User'}
          </Text>
          <Text style={[styles.meta, { color: colors.textDim }]}>{time}</Text>
        </View>
        <Ionicons
          name="ellipsis-horizontal"
          color={colors.textDim}
          size={18}
        />
      </View>

      {/* title/body */}
      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
      {!!post.body && (
        <Text
          style={[styles.body, { color: colors.textDim }]}
          numberOfLines={4}
        >
          {post.body}
        </Text>
      )}

      {/* optional image */}
      {post.imageUrl ? (
        <View
          style={[styles.imagePlaceholder, { backgroundColor: '#555' }]}
        />
      ) : null}

      {/* tags */}
      {!!post.tags?.length && (
        <View style={styles.tagsRow}>
          {post.tags.map((t) => (
            <Tag key={t} text={t} colors={colors} />
          ))}
        </View>
      )}

      {/* actions */}
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
          onPress={onUnavailable}
        />
        <RowAction
          icon="chatbubble-ellipses-outline"
          text={String(post.comments ?? 0)}
          colors={colors}
          onPress={onUnavailable}
        />
        <RowAction
          icon="share-social-outline"
          text="Share"
          colors={colors}
          onPress={onUnavailable}
        />
      </View>
    </TouchableOpacity>
  );
}

function RowAction({ icon, text, colors, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.actionBtn}
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

// relative time util
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  topActions: { flexDirection: 'row', gap: 10 },
  topIcon: { padding: 6, borderRadius: 8 },

  toast: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  searchWrap: {
    margin: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  author: { fontWeight: '800', fontSize: 13 },
  meta: { fontSize: 11 },

  title: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  body: { fontSize: 13, marginTop: 6, lineHeight: 18 },

  imagePlaceholder: {
    marginTop: 10,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontWeight: '700', fontSize: 12 },
});
