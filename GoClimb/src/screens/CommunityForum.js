import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';

// NOTE: In some sandboxed environments local require('../assets/...') may fail.
// Use remote image URIs (Unsplash) which are accessible from the emulator.
const posts = [
  {
    id: '1',
    user: 'Aishwarya R.',
    location: 'Batu Caves, Malaysia',
    image: {
      uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=60',
    },
    caption: 'Finally conquered the overhang route today! 💪',
    comments: ['Congrats!', 'That looks so hard!'],
    likes: 230,
  },
  {
    id: '2',
    user: 'Javier T.',
    location: 'Railay Beach, Thailand',
    image: {
      uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=60',
    },
    caption: 'Sunset climbs are the best. 🌅',
    comments: ['Amazing view!', 'This is goals!'],
    likes: 158,
  },
];

const PostHeader = ({ user, location }) => (
  <View style={styles.postHeaderRow}>
    <View style={styles.userInfo}>
      <View style={styles.userAvatarPlaceholder} />
      <View>
        <Text style={styles.userName}>{user}</Text>
        <Text style={styles.userLocation}>{location}</Text>
      </View>
    </View>
  </View>
);

const PostActions = ({ likes }) => (
  <View style={styles.postActionsRow}>
    <View style={styles.leftActions}>
      <Heart color="#00C853" size={20} />
      <MessageCircle color="#ccc" size={20} style={styles.actionIconSpacing} />
      <Share2 color="#ccc" size={20} style={styles.actionIconSpacing} />
    </View>
    <Text style={styles.likesText}>{likes} likes</Text>
  </View>
);

const PostCard = ({ post }) => (
  <View style={styles.postCard}>
    <PostHeader user={post.user} location={post.location} />

    <Image source={post.image} style={styles.postImage} resizeMode="cover" />

    <Text style={styles.caption}>{post.caption}</Text>

    <PostActions likes={post.likes} />

    {post.comments?.length > 0 && (
      <View style={styles.commentsBlock}>
        {post.comments.map((c, i) => (
          <Text key={i} style={styles.commentText}>
            {c}
          </Text>
        ))}
      </View>
    )}
  </View>
);

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1c1c" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GoClimb • Community</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={() => alert('Add post (not implemented)')}>
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
//stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a2a2a', // dark grey app background as requested
  },
  header: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
  },
  headerTitle: {
    color: '#00C853',
    fontSize: 20,
    fontWeight: '800',
  },
  feedList: {
    padding: 12,
    paddingBottom: 120,
  },
  postCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    marginRight: 10,
  },
  userName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userLocation: { color: '#bdbdbd', fontSize: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 10, marginTop: 6 },
  caption: { color: '#e6e6e6', marginTop: 10, fontSize: 15 },
  postActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  actionIconSpacing: { marginLeft: 16 },
  likesText: { color: '#bdbdbd', fontWeight: '600' },
  commentsBlock: { marginTop: 8 },
  commentText: { color: '#9e9e9e', fontSize: 13, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabPlus: { color: '#fff', fontSize: 34, lineHeight: 36, fontWeight: '700' },
});
