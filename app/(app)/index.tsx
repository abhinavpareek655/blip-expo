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
import { JsonRpcProvider, Contract, Signer, Wallet } from 'ethers';
import BlipProfileABI from '../../blockchain/BlipProfile.json';
import Post from '../(post)/Post';
import { getProfile, isFriend, initProfileContract  } from '@/blockchain/profileContract';

const PROFILE_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_PROFILE_CONTRACT!;
const PROVIDER_URL = process.env.EXPO_PUBLIC_RPC_URL!;

let profileContract: Contract;
let currentSigner: Signer;

export const initContract = async () => {
  const provider = new JsonRpcProvider(PROVIDER_URL);
  currentSigner = await provider.getSigner();
  profileContract = new Contract(PROFILE_CONTRACT_ADDRESS, BlipProfileABI.abi, currentSigner);
};

export const getAdminPosts = async () => {
  if (!profileContract) {
    await initContract();
  }

  // assume you have a signer stored somewhere; fetch its address
  const currentUserAddress = await currentSigner.getAddress();

  // fetch admin posts on‑chain
  const result = await profileContract.getAdminPosts();

  const posts = await Promise.all(
    result.map(async (p: any, idx: number) => {
      const ownerAddress = p.owner;

      // 1) pull profile data directly from this same profileContract :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}
      let name  = ownerAddress.slice(0, 6);
      let email = 'user@example.com';
      try {
        const raw = await profileContract.getProfile(ownerAddress);
        name  = raw[0];
        email = raw[1];
      } catch (err) {
        console.error('Error fetching profile for', ownerAddress, err);
      }

      // 2) check friendship using the same contract :contentReference[oaicite:4]{index=4}&#8203;:contentReference[oaicite:5]{index=5}
      let friend = false;
      try {
        friend = await profileContract.isFriend(ownerAddress, currentUserAddress);
      } catch (err) {
        console.error(
          'Error checking friendship for',
          ownerAddress,
          currentUserAddress,
          err
        );
      }

      return {
        id:        p.id?.toString() ?? idx.toString(),
        owner: {
          address:  ownerAddress,
          isFriend: friend,
        },
        text:      p.text,
        timestamp: Number(p.timestamp),
        isPublic:  p.isPublic,
        name,
        email,
        likes:     Number(p.likes),
        comments:  Number(p.comments),
      };
    })
  );

  return posts.sort((a, b) => b.timestamp - a.timestamp);
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
                id: item.id,
                owner: item.owner,
                name: item.name,
                email: item.email,
                content: item.text,
                likes: item.likes,
                comments: item.comments,
                timestamp: new Date(item.timestamp * 1000).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }) + ' ' + new Date(item.timestamp * 1000).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
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
