import '../../blockchain/cryptoShim';
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
import { JsonRpcProvider, Contract } from 'ethers';
import BlipProfileABI from '../../blockchain/BlipProfile.json';
import Post from '../(post)/Post';

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

  // Assuming your smart contract returns an array of Post structs
  return result
    .map((p: any, idx: number) => ({
      id: p.id ? p.id.toString() : idx.toString(),
      owner: p.owner,
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
      console.log("[HOME] Posts fetched:", publicPosts);
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
            <Post post={{
              // Convert our post object to the expected structure
              owner: {
                address: item.owner,
                isFriend: false, // update friend logic as needed
              },
              name: item.owner ? item.owner.slice(0, 6) : "Unknown", // fallback, or merge with profile data if available
              email: "user@example.com", // fallback email if not available on-chain
              content: item.text,
              likes: 0,         // If likeCount is available, use it here
              comments: 0,
              timestamp: new Date(item.timestamp * 1000).toLocaleString(),
            }} />
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
});
