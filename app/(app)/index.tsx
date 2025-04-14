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
import { Contract, JsonRpcProvider } from 'ethers';
import BlipProfileABI from '../../blockchain/BlipProfile.json';
import Post from '../(post)/Post';
import { getProfile } from '../../blockchain/profileContract';

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
  console.log("[DEBUG] Raw posts from contract:", result);
  const posts: any[] = [];

  for (let idx = 0; idx < result.length; idx++) {
    const p: any = result[idx];
    console.log(`[DEBUG] Processing post at index ${idx}:`, p);
    try {
      // Safe check for p.id: if defined, convert to string; else, use idx as fallback.
      const idValue =
        p.id !== undefined && p.id !== null ? p.id.toString() : idx.toString();
      console.log(`[DEBUG] idValue: ${idValue}`);

      // Check for the rest of the fields with fallbacks.
      const textValue = p.text !== undefined ? p.text : "";
      console.log(`[DEBUG] textValue: ${textValue}`);
      const timestampValue =
        p.timestamp !== undefined && p.timestamp !== null
          ? Number(p.timestamp)
          : 0;
      console.log(`[DEBUG] timestampValue: ${timestampValue}`);
      const isPublicValue =
        p.isPublic !== undefined && p.isPublic !== null
          ? p.isPublic
          : false;
      console.log(`[DEBUG] isPublicValue: ${isPublicValue}`);
      const likeCountValue =
        p.likeCount !== undefined && p.likeCount !== null
          ? Number(p.likeCount)
          : 0;
      console.log(`[DEBUG] likeCountValue: ${likeCountValue}`);

      // Fallback owner address.
      const ownerValue =
        p.owner !== undefined && p.owner !== null
          ? p.owner
          : "0x0000000000000000000000000000000000000000";
      console.log(`[DEBUG] ownerValue: ${ownerValue}`);

      // Optionally use provided name/email or fallback from profile data.
      let nameValue = "Unknown";
      let emailValue = "user@example.com";
      if (p.name !== undefined && p.name) {
        nameValue = p.name;
      } else if (ownerValue) {
        // Use truncated owner address as fallback username.
        nameValue = ownerValue.slice(0, 6);
      }
      if (p.email !== undefined && p.email) {
        emailValue = p.email;
      }
      console.log(`[DEBUG] Initial name: ${nameValue}, email: ${emailValue}`);

      // Try to get profile data from on-chain.
      let profileData;
      try {
        profileData = await getProfile(ownerValue);
        console.log("[DEBUG] Retrieved profileData:", profileData);
        nameValue = profileData.name || nameValue;
        emailValue = profileData.email || emailValue;
      } catch (e) {
        console.error("[DEBUG] Error fetching profile for owner", ownerValue, e);
      }

      const postObj = {
        id: idValue,
        content: textValue,
        timestamp: timestampValue,
        isPublic: isPublicValue,
        likes: likeCountValue,
        comments: 0, // Default: update if comments are available.
        owner: {
          address: ownerValue,
          isFriend: false,
        },
        name: nameValue,
        email: emailValue,
      };

      console.log(`[DEBUG] Mapped post object at index ${idx}:`, postObj);
      posts.push(postObj);
    } catch (e) {
      console.error("Error mapping post at index", idx, e);
    }
  }

  // Sort posts descending by timestamp.
  posts.sort((a, b) => b.timestamp - a.timestamp);
  console.log("[DEBUG] Final sorted posts:", posts);
  return posts;
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
          keyExtractor={(item) => item.id || Math.random().toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPosts} />}
          renderItem={({ item }) => <Post post={item} />}
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

