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
import { Contract, JsonRpcProvider } from 'ethers';
import BlipProfileABI from '../../blockchain/BlipProfile.json';

const PROFILE_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_PROFILE_CONTRACT!;
const PROVIDER_URL = process.env.EXPO_PUBLIC_RPC_URL!;

let profileContract: Contract;

export const initContract = async () => {
  const provider = new JsonRpcProvider(PROVIDER_URL);
  profileContract = new Contract(PROFILE_CONTRACT_ADDRESS, BlipProfileABI.abi, provider);
};

export const getAdminPosts = async () => {
  if (!profileContract) await initContract();
  const result = await profileContract.getAdminPosts();

  return result
    .map((p: any, idx: number) => ({
      id: idx.toString(),
      text: p.text,
      timestamp: Number(p.timestamp),
      isPublic: p.isPublic,
    }))
    .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      console.log("[HOME] Fetching admin public posts...");
      setRefreshing(true);
      const publicPosts = await getAdminPosts();
      setPosts(publicPosts);
    } catch (error) {
      console.error("❌ [HOME] Error loading public posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Public Feed</Text>
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
              <Text style={styles.postText}>{item.text}</Text>
              <Text style={styles.meta}>
                {new Date(item.timestamp * 1000).toLocaleString()} — {item.isPublic ? '🌍 Public' : '🔒 Private'}
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
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
  postText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },
});
