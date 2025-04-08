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
import { getProfile, initProfileContract } from '../../blockchain/profileContract';
import { useWalletAddress } from '../../hooks/useWalletAddress';

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const wallet = useWalletAddress();

  const fetchPosts = async () => {
    try {
      console.log("[HOME] Fetching profile for posts...");
      setRefreshing(true);
      await initProfileContract();

      if (!wallet) {
        console.warn("[HOME] No wallet found.");
        return;
      }

      const profile = await getProfile(wallet);
      console.log("[HOME] User profile fetched:", profile);

      const formattedPosts = profile.posts.map((post: any, index: number) => ({
        id: index.toString(),
        content: post.text,
        timestamp: Number(post.timestamp),
        isPublic: post.isPublic,
        username: wallet.slice(0, 8),
      }));

      setPosts(formattedPosts.reverse());
    } catch (error) {
      console.error("❌ [HOME] Error loading posts:", error);
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
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.postText}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
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
  postCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  username: {
    color: "#1DB954",
    fontSize: 12,
    marginBottom: 6,
  },
  postText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
});
