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
import { getProfile } from '@/blockchain/profileContract';

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
  
  // Map each post and fetch its profile details asynchronously.
  const posts = await Promise.all(
    result.map(async (p: any, idx: number) => {
      const ownerAddress = p.owner;
      // Fetch profile data for owner; fallback to defaults if error
      let profileData = { name: ownerAddress.slice(0,6), email: "user@example.com" };
      try {
        profileData = await getProfile(ownerAddress);
      } catch (error) {
        console.error("Error fetching profile for", ownerAddress, error);
      }
      return {
        id: p.id ? p.id.toString() : idx.toString(),
        owner: { address: ownerAddress, isFriend: false },
        text: p.text,
        timestamp: Number(p.timestamp),
        isPublic: p.isPublic,
        name: profileData.name,
        email: profileData.email,
        likes: 0,
        comments: 0,
      };
    })
  );
  return posts.sort((a: any, b: any) => b.timestamp - a.timestamp);
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
            <Post
              post={{
                owner: item.owner,
                name: item.name,
                email: item.email,
                content: item.text,
                likes: item.likes,
                comments: item.comments,
                timestamp: new Date(item.timestamp * 1000).toLocaleString(),
              }}
            />
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
