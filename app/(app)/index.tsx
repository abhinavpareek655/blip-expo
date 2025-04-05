import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Post from '../(post)/Post';
import { initPostContract, getUserPosts, getPostById, getComments, getUserAvatar } from '../../blockchain/postContract';
import { useWalletAddress } from '../../hooks/useWalletAddress'; 

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const wallet = useWalletAddress();

  const fetchPosts = async () => {
    try {
      setRefreshing(true);
      await initPostContract();
      if (!wallet) return;

      const postIds = await getUserPosts(wallet);
      const fetchedPosts = [];

      for (let id of postIds) {
        const post = await getPostById(id);
        fetchedPosts.push({
          id: post.id.toString(),
          username: post.owner.slice(0, 8), // just a partial address
          avatar: getUserAvatar(post.owner),
          content: post.text,
          likes: post.likeCount.toNumber?.() ?? 0,
          comments: getComments(id),
          timestamp: new Date(post.timestamp * 1000).toLocaleTimeString(),
        });
      }

      setPosts(fetchedPosts.reverse());
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [wallet]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blip</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPosts} />}
          renderItem={({ item }) => <Post post={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});