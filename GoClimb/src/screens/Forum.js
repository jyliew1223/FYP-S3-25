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
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';

import {
  fetchRandomPosts,
  fetchCommentCountForPost,
  deletePost,
  likePost,
  unlikePost,
  checkIfUserLikedPost,
  getLikeCount,
} from '../services/api/PostsService';
import { searchPosts, searchPostsByTags } from '../services/api/SearchService';

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
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPostSearch, setShowPostSearch] = useState(false);

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

        // Check if backend provides complete data, otherwise fetch missing data
        const likedSet = new Set();
        
        // First, use whatever data the backend provides
        let postsWithData = res.data.map(post => ({
          ...post,
          comments: post.comments || 0,
          likes: post.likes || 0,
        }));

        console.log('[DEBUG Forum] Initial post data:', postsWithData.map(p => ({ id: p.id, likes: p.likes, comments: p.comments })));

        // Check if we need to fetch missing data
        const needsLikeCounts = postsWithData.some(post => post.likes === 0);
        const needsCommentCounts = postsWithData.some(post => post.comments === 0);
        const currentUser = getAuth().currentUser;

        if (needsLikeCounts || needsCommentCounts || currentUser) {
          console.log('[DEBUG Forum] Fetching missing data...', { needsLikeCounts, needsCommentCounts, hasUser: !!currentUser });
          
          // Fetch missing data in parallel
          const dataPromises = postsWithData.map(async post => {
            const promises = [];
            
            // Get like count if needed
            if (needsLikeCounts) {
              promises.push(getLikeCount(post.id));
            } else {
              promises.push(Promise.resolve({ success: true, count: post.likes }));
            }
            
            // Get comment count if needed
            if (needsCommentCounts) {
              promises.push(fetchCommentCountForPost(post.id));
            } else {
              promises.push(Promise.resolve(post.comments));
            }
            
            // Get like status if user is logged in
            if (currentUser) {
              promises.push(checkIfUserLikedPost(post.id));
            } else {
              promises.push(Promise.resolve(false));
            }

            try {
              const [likeCountRes, commentCount, isLiked] = await Promise.all(promises);
              
              const likes = likeCountRes.success ? likeCountRes.count : (post.likes || 0);
              const comments = typeof commentCount === 'number' ? commentCount : (post.comments || 0);
              
              if (isLiked) {
                likedSet.add(post.id);
              }

              return {
                ...post,
                likes,
                comments,
              };
            } catch (error) {
              console.log(`[DEBUG] Error processing post ${post.id}:`, error);
              return post;
            }
          });

          postsWithData = await Promise.all(dataPromises);
          console.log('[DEBUG Forum] Final post data:', postsWithData.map(p => ({ id: p.id, likes: p.likes, comments: p.comments })));
        }

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

  // Search posts function
  const handlePostSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      let result;
      
      // Check if query starts with # for tag search
      if (searchQuery.trim().startsWith('#')) {
        // Extract tags from the query (remove # and split by spaces/commas)
        const tagQuery = searchQuery.trim().substring(1); // Remove the #
        const tags = tagQuery.split(/[,\s]+/).filter(tag => tag.trim().length > 0);
        
        if (tags.length > 0) {
          console.log('[Forum] Searching by tags:', tags);
          result = await searchPostsByTags({ tags, limit: 20 });
        } else {
          // Empty tag query
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }
      } else {
        // Regular text search
        console.log('[Forum] Searching by text:', searchQuery.trim());
        result = await searchPosts({ query: searchQuery.trim(), limit: 20 });
      }

      if (result.success) {
        // Map search results to match the expected format
        const mappedResults = result.data.map(post => ({
          id: post.post_id,
          author: { 
            id: post.user?.user_id || '', 
            name: post.user?.username || 'User' 
          },
          title: post.title || '',
          body: post.content || '',
          tags: post.tags || [],
          createdAt: Date.parse(post.created_at) || Date.now(),
          likes: 0, // Will be loaded separately if needed
          comments: 0, // Will be loaded separately if needed
          images: post.images_urls || [],
        }));
        setSearchResults(mappedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log('Error searching posts:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handlePostSearch(query);
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Determine which posts to display and sort them
  const filtered = useMemo(() => {
    let result = query.trim() ? searchResults : posts;

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
  }, [posts, searchResults, query, sortBy]);

  const openPost = post => navigation.navigate('PostDetail', {postId: post.id});

  const goToComments = post =>
    navigation.navigate('PostDetail', {postId: post.id});



  // Toggle like
  const toggleLike = async post => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      navigation.navigate('PreSignUp');
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
    
    const currentUser = getAuth().currentUser;
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
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      navigation.navigate('PreSignUp');
      return;
    }
    
    if (userId) {
      navigation.navigate('Profile', { userId });
    }
  };

  const handlePostPress = (postId) => {
    setShowPostSearch(false);
    setQuery('');
    setSearchResults([]);
    navigation.navigate('PostDetail', { postId });
  };

  const currentUser = getAuth().currentUser;

  const renderItem = ({item}) => (
    <PostCard
      post={item}
      colors={colors}
      liked={likedPosts.has(item.id)}
      onPress={() => openPost(item)}
      onLike={() => toggleLike(item)}
      onComment={() => goToComments(item)}
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
          <TouchableOpacity onPress={() => setShowPostSearch(true)} style={styles.topIcon}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const currentUser = getAuth().currentUser;
              if (!currentUser) {
                navigation.navigate('PreSignUp');
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



      {/* Sort chips - always visible */}
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

      {/* list */}
      {loading || (query.trim() && searchLoading) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          {query.trim() && searchLoading && (
            <Text style={[styles.loadingText, { color: colors.textDim }]}>
              Searching posts...
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Post Search Modal */}
      <Modal
        visible={showPostSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
          {/* Search Header */}
          <View style={[styles.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={() => setShowPostSearch(false)} style={styles.searchButton}>
              <Text style={[styles.searchButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.searchTitle, { color: colors.text }]}>Search Posts</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search Input */}
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
            <View style={[styles.searchInputWrapper, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
              <Ionicons name="search" size={20} color={colors.textDim} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search posts or use #tag for tags..."
                placeholderTextColor={colors.textDim}
                value={query}
                onChangeText={setQuery}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Search Results */}
          <View style={styles.searchResults}>
            {/* Search Type Indicator */}
            {query.trim() && !searchLoading && (
              <View style={[styles.searchTypeIndicator, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.divider }]}>
                <Ionicons 
                  name={query.trim().startsWith('#') ? "pricetag" : "search"} 
                  size={16} 
                  color={colors.accent} 
                />
                <Text style={[styles.searchTypeText, { color: colors.textDim }]}>
                  {query.trim().startsWith('#') 
                    ? `Searching by tags: ${query.trim().substring(1)}` 
                    : `Searching posts: "${query.trim()}"`
                  }
                </Text>
              </View>
            )}

            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.searchLoadingText, { color: colors.textDim }]}>
                  {query.trim().startsWith('#') ? 'Searching by tags...' : 'Searching posts...'}
                </Text>
              </View>
            ) : query && searchResults.length === 0 ? (
              <View style={styles.searchEmptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={colors.textDim} />
                <Text style={[styles.searchEmptyText, { color: colors.textDim }]}>
                  No posts found {query.trim().startsWith('#') ? 'with those tags' : 'for that search'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.postResultItem, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}
                    onPress={() => handlePostPress(item.id)}
                  >
                    <View style={styles.postResultContent}>
                      <Text style={[styles.postResultTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title || 'Untitled'}
                      </Text>
                      <Text style={[styles.postResultBody, { color: colors.textDim }]} numberOfLines={3}>
                        {item.body}
                      </Text>
                      <View style={styles.postResultMeta}>
                        <Text style={[styles.postResultAuthor, { color: colors.textDim }]}>
                          by {item.author?.name || 'User'}
                        </Text>
                        {item.tags && item.tags.length > 0 && (
                          <View style={styles.postResultTags}>
                            {item.tags.slice(0, 2).map((tag, index) => (
                              <Text key={index} style={[styles.postResultTag, { color: colors.accent }]}>
                                #{tag}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.searchResultsList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------------- card ----------------------------- */

function PostCard({post, colors, liked, onPress, onLike, onComment, isOwnPost, menuVisible, onMenuToggle, onDelete, onProfilePress}) {
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
    marginBottom: 16,
    paddingBottom: 8,
  },
  sortChipsContent: {
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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

  // Search modal styles
  searchModalContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchResults: {
    flex: 1,
  },
  searchTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  searchTypeText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  searchEmptyText: {
    fontSize: 16,
  },
  searchResultsList: {
    padding: 16,
  },
  postResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postResultContent: {
    flex: 1,
  },
  postResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  postResultBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postResultAuthor: {
    fontSize: 12,
  },
  postResultTags: {
    flexDirection: 'row',
    gap: 8,
  },
  postResultTag: {
    fontSize: 12,
    fontWeight: '600',
  },
});
