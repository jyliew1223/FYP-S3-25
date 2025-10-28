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

import {
  fetchRandomPosts,
  fetchCommentCountForPost,
  likePost,
  unlikePost,
} from '../services/api/PostsService';

export default function Forum({ navigation }) {
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // track which posts current user has liked (session-local)
  const [liked, setLiked] = useState(() => new Set());

  // toast banner
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2000);
  }, []);

  // after we get posts from backend, we fetch accurate comment counts
  const hydrateCommentCounts = useCallback(async (list) => {
    const updated = await Promise.all(
      list.map(async (p) => {
        const realCount = await fetchCommentCountForPost(p.id);
        return {
          ...p,
          comments: realCount, // overwrite 0 placeholder with true length
        };
      })
    );

    console.log('[DEBUG hydrateCommentCounts updated]', updated);
    setPosts(updated);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    const res = await fetchRandomPosts({ count: 12 });
    if (res?.success) {
      console.log('[DEBUG Forum fetchRandomPosts]', res.data);
      setPosts(res.data);
      setLiked(new Set()); // reset local like set on new load

      // hydrate just the comment counts
      hydrateCommentCounts(res.data);
    } else {
      setPosts([]);
      showToast(res?.message || 'Failed to load posts');
    }

    setLoading(false);
  }, [showToast, hydrateCommentCounts]);

  useEffect(() => {
    load();
  }, [load]);

  // pull-to-refresh: similar logic to load(), but passes blacklist
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const blacklist = posts.map((p) => p.id);
    const res = await fetchRandomPosts({ count: 12, blacklist });
    if (res?.success) {
      setPosts(res.data);
      setLiked(new Set());
      hydrateCommentCounts(res.data);
    }
    setRefreshing(false);
  }, [posts, hydrateCommentCounts]);

  // local search
  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.tags || []).some((t) =>
          String(t).toLowerCase().includes(q)
        )
    );
  }, [posts, query]);

  const openPost = (post) =>
    navigation.navigate('PostDetail', { postId: post.id });

  const goToComments = (post) =>
    navigation.navigate('PostDetail', { postId: post.id });

  const sharePost = () => {
    showToast('Feature under construction');
  };

  // like toggle (pure optimistic for now)
  const toggleLike = async (post) => {
    const already = liked.has(post.id);

    // optimistic UI update
    setLiked((prev) => {
      const next = new Set(prev);
      if (already) next.delete(post.id);
      else next.add(post.id);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likes: Math.max(
                0,
                (p.likes || 0) + (already ? -1 : 1)
              ),
            }
          : p
      )
    );

    // backend request
    const res = already ? await unlikePost(post.id) : await likePost(post.id);

    if (!res?.success) {
      // revert on fail
      setLiked((prev) => {
        const next = new Set(prev);
        if (already) next.add(post.id);
        else next.delete(post.id);
        return next;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likes: Math.max(
                  0,
                  (p.likes || 0) + (already ? 1 : -1)
                ),
              }
            : p
        )
      );

      showToast(res?.message || 'Could not update like');
    }
  };

  const renderItem = ({ item }) => (
    <PostCard
      post={item}
      colors={colors}
      liked={liked.has(item.id)}
      onPress={() => openPost(item)}
      onLike={() => toggleLike(item)}
      onComment={() => goToComments(item)}
      onShare={sharePost}
    />
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Text style={[styles.topTitle, { color: colors.text }]}>
          Forum
        </Text>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={load} style={styles.topIcon}>
            <Ionicons
              name="refresh"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => showToast('Feature under construction')}
            style={styles.topIcon}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* toast banner */}
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

      {/* search bar */}
      <View
        style={[
          styles.searchWrap,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          placeholder="Search posts"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchInput,
            { color: colors.text },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textDim}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (
            <View style={{ height: 10 }} />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}

/* ----------------------------- card ----------------------------- */

function PostCard({
  post,
  colors,
  liked,
  onPress,
  onLike,
  onComment,
  onShare,
}) {
  const time = timeAgo(post.createdAt);

  const displayTitle =
    (post.title && post.title.trim()) ||
    (post.body || '').slice(0, 70) ||
    'Untitled';

  console.log('[DEBUG Forum card title]', {
    id: post.id,
    title: post.title,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
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
          <Text
            style={[styles.meta, { color: colors.textDim }]}
          >
            {time}
          </Text>
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          color={colors.textDim}
          size={18}
        />
      </View>

      {/* title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {displayTitle}
      </Text>

      {/* body snippet */}
      {!!post.body && (
        <Text
          style={[styles.body, { color: colors.textDim }]}
          numberOfLines={4}
        >
          {post.body}
        </Text>
      )}

      {/* placeholder for future images */}
      {post.imageUrl ? (
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: '#555' },
          ]}
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

      {/* actions row */}
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
          onPress={onLike}
          active={liked}
        />
        <RowAction
          icon="chatbubble-ellipses-outline"
          text={String(post.comments ?? 0)}
          colors={colors}
          onPress={onComment}
        />
        <RowAction
          icon="share-social-outline"
          text="Share"
          colors={colors}
          onPress={onShare}
        />
      </View>
    </TouchableOpacity>
  );
}

/* ----------------------- small UI helpers ----------------------- */

function Avatar({ name, colors }) {
  const parts = String(name || '').trim().split(/\s+/);
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (
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
        {(initials || 'U').toUpperCase()}
      </Text>
    </View>
  );
}

function Tag({ text, colors }) {
  return (
    <View
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
        #{text}
      </Text>
    </View>
  );
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
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  topIcon: {
    padding: 6,
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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  cardHeader: {
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
    fontSize: 15,
  },
  body: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },

  imagePlaceholder: {
    height: 160,
    borderRadius: 10,
    marginTop: 10,
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
