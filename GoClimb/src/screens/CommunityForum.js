import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityForumPage() {
  const [posts, setPosts] = useState(createSamplePosts());

  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likedByUser: !p.likedByUser,
              likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const handleShare = (post) => {
    Alert.alert('Share', `Share link: https://goclimb.app/post/${post.id}`);
  };

  const handleAddPost = () => {
    Alert.alert('Coming soon!', 'Create a new post feature coming soon!');
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.userRow}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.username}>@{item.user}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
        </View>
      </View>

      <Text style={styles.caption}>{item.title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {item.images.map((img, idx) => (
          <TouchableOpacity key={idx} onPress={() => Alert.alert('Image', 'Open full view')}>
            <Image source={{ uri: img }} style={styles.postImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.iconButton}>
          <Ionicons
            name={item.likedByUser ? 'heart' : 'heart-outline'}
            size={22}
            color={item.likedByUser ? '#00C853' : '#fff'}
          />
          <Text style={styles.likeText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleShare(item)} style={styles.iconButton}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Community Forum</Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddPost}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Helper Data ---------- */

function createSamplePosts() {
  return [
    {
      id: '1',
      user: 'mossyFeet',
      title: 'Perfect day at Red River Gorge! ☀️',
      likes: 23,
      likedByUser: false,
      createdAt: Date.now() - 1000 * 60 * 30,
      avatar: 'https://i.pravatar.cc/150?img=5',
      images: [
        unsplash('rock climb mountain 1'),
        unsplash('climbing red river gorge'),
        unsplash('crag wall climb'),
      ],
    },
    {
      id: '2',
      user: 'graniteGoat',
      title: 'Yosemite granite never disappoints 🧗‍♂️💚',
      likes: 41,
      likedByUser: true,
      createdAt: Date.now() - 1000 * 60 * 90,
      avatar: 'https://i.pravatar.cc/150?img=12',
      images: [
        unsplash('yosemite granite climbing'),
        unsplash('trad gear yosemite'),
        unsplash('mountain climb sunset'),
      ],
    },
  ];
}

function unsplash(query) {
  const q = encodeURIComponent(query);
  return `https://source.unsplash.com/600x400/?${q}`;
}

/* ---------- Styles sheet ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 10,
    paddingTop: 50,
  },
  header: {
    color: '#00C853',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 15,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  time: {
    color: '#999',
    fontSize: 12,
  },
  caption: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  postImage: {
    width: 240,
    height: 200,
    borderRadius: 10,
    marginRight: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 15,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#00C853',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
