import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { JsonRpcProvider, Wallet } from "ethers";
import { useRouter } from "expo-router";
import { generateAvatarUrl } from "../../blockchain/genAvatar";
import { 
  initProfileContract, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest 
} from "../../blockchain/profileContract";

// Define the interface for a friend request
interface FriendRequest {
  id: string;
  address: string;
  name: string;
  email: string;
  timestamp: number;
  status: "pending" | "accepted" | "rejected" | "processing";
}

const FriendRequestsScreen = () => {
  const [activeTab, setActiveTab] = useState("received");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch friend requests from the blockchain
  const fetchFriendRequests = async () => {
    try {
      setRefreshing(true);
      
      // Retrieve the current user's wallet private key from storage
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Reconstruct the user's wallet using the RPC provider
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // Initialize the profile contract using the reconstructed wallet
      await initProfileContract(userWallet);
      
      // Fetch friend requests from the blockchain
      const requests = await getFriendRequests();
      
      // Format the requests for display
      const formattedRequests: FriendRequest[] = requests.map((request: any, index: number) => ({
        id: request.id?.toString() || index.toString(),
        address: request.address,
        name: request.name || "Unknown User",
        email: request.email || "No email",
        timestamp: request.timestamp || Date.now() / 1000,
        status: "pending"
      }));
      
      setFriendRequests(formattedRequests);
      
      // Animate the content in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      Alert.alert("Error", "Failed to load friend requests. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle accepting a friend request
  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      // Add the request ID to processing state
      setProcessingIds(prev => [...prev, request.id]);
      
      // Update the local state to show processing
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "processing" } : req
        )
      );
      
      // Retrieve the current user's wallet private key from storage
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        return;
      }
      
      // Reconstruct the user's wallet using the RPC provider
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // Initialize the profile contract using the reconstructed wallet
      await initProfileContract(userWallet);
      
      // Accept the friend request on the blockchain
      await acceptFriendRequest(request.address);
      
      // Update the local state
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "accepted" } : req
        )
      );
      
      // Remove the request after a delay to show the accepted state
      setTimeout(() => {
        setFriendRequests(prev => prev.filter(req => req.id !== request.id));
      }, 1500);
      
    } catch (error) {
      console.error("Error accepting friend request:", error);
      Alert.alert("Error", "Failed to accept friend request. Please try again.");
      
      // Revert the status back to pending
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "pending" } : req
        )
      );
    } finally {
      // Remove the request ID from processing state
      setProcessingIds(prev => prev.filter(id => id !== request.id));
    }
  };

  // Handle rejecting a friend request
  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      // Add the request ID to processing state
      setProcessingIds(prev => [...prev, request.id]);
      
      // Update the local state to show processing
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "processing" } : req
        )
      );
      
      // Retrieve the current user's wallet private key from storage
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        return;
      }
      
      // Reconstruct the user's wallet using the RPC provider
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // Initialize the profile contract using the reconstructed wallet
      await initProfileContract(userWallet);
      
      // Reject the friend request on the blockchain
      await rejectFriendRequest(request.address);
      
      // Update the local state
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "rejected" } : req
        )
      );
      
      // Remove the request after a delay to show the rejected state
      setTimeout(() => {
        setFriendRequests(prev => prev.filter(req => req.id !== request.id));
      }, 1500);
      
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      Alert.alert("Error", "Failed to reject friend request. Please try again.");
      
      // Revert the status back to pending
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: "pending" } : req
        )
      );
    } finally {
      // Remove the request ID from processing state
      setProcessingIds(prev => prev.filter(id => id !== request.id));
    }
  };

  // Load friend requests on component mount
  useEffect(() => {
    fetchFriendRequests();
  }, []);

  // Render a friend request item
  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = item.status === "processing";
    const isAccepted = item.status === "accepted";
    const isRejected = item.status === "rejected";
    
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Image 
            source={{ uri: generateAvatarUrl(item.address) }} 
            style={styles.avatar} 
          />
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.timestampContainer}>
              <Ionicons name="time-outline" size={12} color="#888888" style={styles.timeIcon} />
              <Text style={styles.timestamp}>
                {new Date(item.timestamp * 1000).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={() => {
              // Navigate to user profile (placeholder)
              console.log("View profile for:", item.address);
            }}
          >
            <Ionicons name="person-circle-outline" size={20} color="#1DB954" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.requestActions}>
          {isAccepted ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
              <Text style={styles.acceptedText}>Friend Request Accepted</Text>
            </View>
          ) : isRejected ? (
            <View style={styles.statusContainer}>
              <Ionicons name="close-circle" size={20} color="#E74C3C" />
              <Text style={styles.rejectedText}>Friend Request Rejected</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.rejectButton, isProcessing && styles.disabledButton]}
                onPress={() => handleRejectRequest(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="close" size={18} color="#FFFFFF" style={styles.actionIcon} />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.acceptButton, isProcessing && styles.disabledButton]}
                onPress={() => handleAcceptRequest(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={styles.actionIcon} />
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // Render empty state when there are no friend requests
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-group" size={64} color="#444" />
      <Text style={styles.emptyTitle}>No Friend Requests</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "received" 
          ? "You don't have any pending friend requests" 
          : "You haven't sent any friend requests"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1DB954" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}
        >
          <Ionicons 
            name="arrow-down-circle" 
            size={18} 
            color={activeTab === "received" ? "#1DB954" : "#888"} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === "received" && styles.activeTabText]}>
            Received
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}
        >
          <Ionicons 
            name="arrow-up-circle" 
            size={18} 
            color={activeTab === "sent" ? "#1DB954" : "#888"} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === "sent" && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Friend Requests List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Loading friend requests...</Text>
        </View>
      ) : (
        <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
          <FlatList
            data={friendRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              friendRequests.length === 0 && styles.emptyListContent
            ]}
            ListEmptyComponent={renderEmptyState}
            onRefresh={fetchFriendRequests}
            refreshing={refreshing}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#BBBBBB",
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BBBBBB",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888888",
    marginTop: 8,
    textAlign: "center",
  },
  requestCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#1DB954",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 14,
    color: "#BBBBBB",
    marginTop: 2,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeIcon: {
    marginRight: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#888888",
  },
  viewProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  requestActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#252525",
    padding: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 6,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DB954",
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  statusContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  acceptedText: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  rejectedText: {
    color: "#E74C3C",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
});

export default FriendRequestsScreen;