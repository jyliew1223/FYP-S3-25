// GoClimb/src/screens/Forum.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import {
  fetchRandomPosts,
  fetchCommentCountForPost,
  deletePost,
  likePost,
  unlikePost,
  checkIfUserLikedPost,
  getLikeCount,
} from '../services/api/PostsService';

export default function Forum({navigation}) {
  const route = useRoute();
  const {colors} = useTheme();

  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [menuVisible, setMenuVisible] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mostLiked, leastLiked

  // toast banner
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);
  const showToast = useCallback(msg => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2000);
  }, []);

  // Load posts and their like status
  const loadPosts = useCallback(
    async (blacklist = []) => {
      try {
        const res = await fetchRandomPosts({count: 12, blacklist});
        if (!res?.success) {
          showToast(res?.message || 'Failed to load posts');
          return [];
        }

        console.log('[DEBUG Forum] Fetched posts:', res.data.length);

        // Check like status for each post
        const likedSet = new Set();
        const postsWithData = await Promise.all(
          res.data.map(async post => {
            try {
              // Check if user liked this post
              const isLiked = await checkIfUserLikedPost(post.id);
              if (isLiked) {
                likedSet.add(post.id);
              }

              // Get comment count
              const commentCount = await fetchCommentCountForPost(post.id);

              // Get current like count
              const likeCountRes = await getLikeCount(post.id);
              const currentLikes = likeCountRes.success ? likeCountRes.count : post.likes || 0;

              return {
                ...post,
                comments: commentCount || 0,
                likes: currentLikes,
              };
            } catch (error) {
              console.log(`[DEBUG] Error processing post ${post.id}:`, error);
              return post;
            }
          }),
        );

        console.log('[DEBUG Forum] Liked posts:', Array.from(likedSet));
        setLikedPosts(likedSet);
        return postsWithData;
      } catch (error) {
        console.log('[DEBUG] Error in loadPosts:', error);
        showToast('Failed to load posts');
        return [];
      }
    },
    [showToast],
  );

  // Initial load
  const load = useCallback(async () => {
    setLoading(true);
    const postsData = await loadPosts();
    setPosts(postsData);
    setLoading(false);
  }, [loadPosts]);

  useEffect(() => {
    load();
  }, [load]);

  // When forum tab gains focus after creating a post
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.justPosted) {
        showToast('Post published');
        route.params.justPosted = false;
      }
    }, [route.params, showToast]),
  );

  // Pull-to-refresh - reload all posts
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const postsData = await loadPosts([]); // Empty blacklist to get fresh posts
    setPosts(postsData);
    setRefreshing(false);
  }, [loadPosts]);

  // Local search and sorting
  const filtered = useMemo(() => {
    let result = posts;

    // Apply search filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = posts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          (p.tags || []).some(t => String(t).toLowerCase().includes(q)),
      );
    }

    // Apply sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Newest first (default)
          return (b.createdAt || 0) - (a.createdAt || 0);
        
        case 'oldest':
          // Oldest first
          return (a.createdAt || 0) - (b.createdAt || 0);
        
        case 'mostLiked':
          // Most liked first, then by newest
          const likeDiff = (b.likes || 0) - (a.likes || 0);
          if (likeDiff !== 0) return likeDiff;
          return (b.createdAt || 0) - (a.createdAt || 0);
        
        case 'leastLiked':
          // Least liked first, then by newest
          const likeDiffAsc = (a.likes || 0) - (b.likes || 0);
          if (likeDiffAsc !== 0) return likeDiffAsc;
          return (b.createdAt || 0) - (a.createdAt || 0);
        
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });
  }, [posts, query, sortBy]);

  const openPost = post => navigation.navigate('PostDetail', {postId: post.id});

  const goToComments = post =>
    navigation.navigate('PostDetail', {postId: post.id});

  const sharePost = () => {
    showToast('Feature under construction');
  };

  // Toggle like
  const toggleLike = async post => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      navigation.navigate('SignUp');
      return;
    }

    const wasLiked = likedPosts.has(post.id);

    // Optimistic UI update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      return next;
    });

    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? {
              ...p,
              likes: Math.max(0, (p.likes || 0) + (wasLiked ? -1 : 1)),
            }
          : p,
      ),
    );

    // Call API
    const res = wasLiked ? await unlikePost(post.id) : await likePost(post.id);

    if (!res?.success) {
      // Revert on failure
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (wasLiked) {
          next.add(post.id);
        } else {
          next.delete(post.id);
        }
        return next;
      });

      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
                ...p,
                likes: Math.max(0, (p.likes || 0) + (wasLiked ? 1 : -1)),
              }
            : p,
        ),
      );

      showToast(res?.message || 'Could not update like');
    }
  };

  const handleDeletePost = async postId => {
    console.log('[Forum handleDeletePost] Starting deletion for postId:', postId);
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      showToast('You must be logged in to delete posts');
      return;
    }

    setMenuVisible(null);

    try {
      const res = await deletePost(postId);
      console.log('[Forum handleDeletePost] API response:', res);
      
      if (res?.success) {
        // Remove post from local state
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast('Post deleted');
      } else {
        showToast(res?.message || 'Failed to delete post');
      }
    } catch (error) {
      console.log('[Forum handleDeletePost] Exception:', error);
      showToast('Failed to delete post');
    }
  };

  const handleProfilePress = (userId) => {
    if (userId) {
      navigation.navigate('Profile', { userId });
    }
  };

  const currentUser = auth().currentUser;

  const renderItem = ({item}) => (
    <PostCard
      post={item}
      colors={colors}
      liked={likedPosts.has(item.id)}
      onPress={() => openPost(item)}
      onLike={() => toggleLike(item)}
      onComment={() => goToComments(item)}
      onShare={sharePost}
      onProfilePress={handleProfilePress}
      isOwnPost={currentUser && item.author?.id === currentUser.uid}
      menuVisible={menuVisible === item.id}
      onMenuToggle={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
      onDelete={() => handleDeletePost(item.id)}
    />
  );

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: colors.bg}}
      edges={['top', 'bottom', 'left', 'right']}>
      {/* top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}>
        <Text style={[styles.topTitle, {color: colors.text}]}>Forum</Text>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={load} style={styles.topIcon}>
            <Ionicons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const currentUser = auth().currentUser;
              if (!currentUser) {
                navigation.navigate('SignUp');
              } else {
                navigation.navigate('CreatePost');
              }
            }}
            style={styles.topIcon}>
            <Ionicons name="create-outline" size={20} color={colors.text} />
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
          ]}>
          <Text
            style={{
              color: colors.text,
              fontSize: 12,
              fontWeight: '600',
            }}>
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
        ]}>
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          placeholder="Search posts"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, {color: colors.text}]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sort chips - horizontal scrollable - only show when not loading */}
      {!loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortChipsContainer}
          contentContainerStyle={styles.sortChipsContent}
        >
          {/* Dynamically order chips - selected one first */}
          {[
            { key: 'newest', label: 'Newest First' },
            { key: 'oldest', label: 'Oldest First' },
            { key: 'mostLiked', label: 'Most Liked' },
            { key: 'leastLiked', label: 'Least Liked' },
          ]
            .sort((a, b) => {
              // Selected chip goes first
              if (a.key === sortBy) return -1;
              if (b.key === sortBy) return 1;
              return 0;
            })
            .map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === option.key ? '#4CAF50' : colors.surfaceAlt,
                    borderColor: sortBy === option.key ? '#4CAF50' : colors.divider,
                  },
                ]}
                onPress={() => setSortBy(option.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    {
                      color: sortBy === option.key ? '#FFFFFF' : colors.textDim,
                      fontWeight: sortBy === option.key ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {/* list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          contentContainerStyle={{
            paddingTop: 8,
            paddingHorizontal: 16,
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

function PostCard({post, colors, liked, onPress, onLike, onComment, onShare, isOwnPost, menuVisible, onMenuToggle, onDelete, onProfilePress}) {
  const time = timeAgo(post.createdAt);

  const displayTitle =
    (post.title && post.title.trim()) ||
    (post.body || '').slice(0, 70) ||
    'Untitled';

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
      ]}>
      {/* header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onProfilePress(post.author?.id);
          }}
        >
          <Avatar name={post.author?.name} colors={colors} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onProfilePress(post.author?.id);
            }}
          >
            <Text numberOfLines={1} style={[styles.author, {color: colors.text}]}>
              {post.author?.name || 'User'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.meta, {color: colors.textDim}]}>{time}</Text>
        </View>

        {isOwnPost ? (
          <View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              style={styles.menuBtn}
            >
              <Ionicons name="ellipsis-horizontal" color={colors.textDim} size={18} />
            </TouchableOpacity>
            {menuVisible && (
              <View style={[styles.postMenu, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Delete Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Ionicons name="ellipsis-horizontal" color={colors.textDim} size={18} />
        )}
      </View>

      {/* title */}
      <Text style={[styles.title, {color: colors.text}]}>{displayTitle}</Text>

      {/* body snippet */}
      {!!post.body && (
        <Text
          style={[styles.body, {color: colors.textDim}]}
          numberOfLines={4}>
          {post.body}
        </Text>
      )}

      {/* images */}
      {post.images && post.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
          nestedScrollEnabled={true}
          scrollEnabled={post.images.length > 1}>
          {post.images.map((imgUrl, index) => (
            <Image
              key={index}
              source={{uri: imgUrl}}
              style={[
                styles.imagePlaceholder,
                index < post.images.length - 1 && {marginRight: 8},
              ]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      {/* tags */}
      {!!post.tags?.length && (
        <View style={styles.tagsRow}>
          {post.tags.map(t => (
            <Tag key={t} text={t} colors={colors} />
          ))}
        </View>
      )}

      {/* actions row */}
      <View style={[styles.actionsRow, {borderTopColor: colors.divider}]}>
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

function Avatar({name, colors}) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/);
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.divider,
        },
      ]}>
      <Text
        style={{
          color: colors.textDim,
          fontWeight: '800',
          fontSize: 12,
        }}>
        {(initials || 'U').toUpperCase()}
      </Text>
    </View>
  );
}

function Tag({text, colors}) {
  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.divider,
        },
      ]}>
      <Text
        style={{
          color: colors.textDim,
          fontSize: 11,
          fontWeight: '700',
        }}>
        #{text}
      </Text>
    </View>
  );
}

function RowAction({icon, text, colors, onPress, active}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.rowAction}
      activeOpacity={0.85}>
      <Ionicons
        name={icon}
        size={16}
        color={active ? colors.accent : colors.textDim}
      />
      {!!text && (
        <Text
          style={[
            styles.rowActionText,
            {color: active ? colors.accent : colors.textDim},
          ]}>
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
    marginHorizontal: 16,
    marginTop: 8,
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
  sortChipsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sortChipsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    height: 38,
    minWidth: 110,
    maxWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortChipText: {
    fontSize: 13,
    lineHeight: 16,
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

  imagesContainer: {
    marginTop: 10,
  },
  imagesContent: {
    paddingRight: 0,
  },
  imagePlaceholder: {
    width: 280,
    height: 160,
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

  menuBtn: {
    padding: 4,
  },
  postMenu: {
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
    minWidth: 140,
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
});
