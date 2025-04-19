import '../../blockchain/cryptoShim';
import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { JsonRpcProvider, Contract, Signer, Wallet } from 'ethers';
import BlipProfileABI from '../../blockchain/BlipProfile.json';
import Post from '../(post)/Post';
import { getProfile, isFriend, initProfileContract } from '@/blockchain/profileContract';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

      // 1) pull profile data directly from this same profileContract
      let name = ownerAddress.slice(0, 6);
      let email = 'user@example.com';
      try {
        const raw = await profileContract.getProfile(ownerAddress);
        name = raw[0];
        email = raw[1];
      } catch (err) {
        console.error('Error fetching profile for', ownerAddress, err);
      }

      // 2) check friendship using the same contract
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
        id: p.id?.toString() ?? idx.toString(),
        owner: {
          address: ownerAddress,
          isFriend: friend,
        },
        text: p.text,
        timestamp: Number(p.timestamp),
        isPublic: p.isPublic,
        name,
        email,
        likes: Number(p.likes),
        comments: Number(p.comments),
      };
    })
  );

  return posts.sort((a, b) => b.timestamp - a.timestamp);
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'friends'
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 3],
    extrapolate: 'clamp',
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="post-outline" size={64} color="#444" />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>Posts will appear here once available</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            opacity: headerOpacity,
            elevation: headerElevation,
            shadowOpacity: headerElevation.interpolate({
              inputRange: [0, 3],
              outputRange: [0, 0.3],
            }),
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
                <Text style={styles.logoText}>B</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Blip</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/create')}
          >
            <Ionicons name="add-circle" size={24} color="#1DB954" />
          </TouchableOpacity>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'public' && styles.activeTab]}
            onPress={() => setActiveTab('public')}
          >
            <MaterialCommunityIcons 
              name="earth" 
              size={18} 
              color={activeTab === 'public' ? "#1DB954" : "#888"} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
              Public Feed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <MaterialCommunityIcons 
              name="account-group" 
              size={18} 
              color={activeTab === 'friends' ? "#1DB954" : "#888"} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={fetchPosts} 
              tintColor="#1DB954"
              colors={["#1DB954"]}
            />
          }
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
                }) + ' • ' + new Date(item.timestamp * 1000).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            posts.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={renderEmptyState}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  headerContainer: {
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1DB954",
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { 
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#252525",
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#252525",
  },
  activeTab: {
    backgroundColor: "rgba(29, 185, 84, 0.15)",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: "#888",
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabText: {
    color: "#1DB954",
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#BBBBBB",
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BBBBBB',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});