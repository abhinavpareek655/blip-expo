import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Animated,
  Keyboard,
  StatusBar,
} from "react-native";
import { JsonRpcProvider, Wallet } from "ethers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfileByEmail, initProfileContract, sendFriendRequest } from "../../blockchain/profileContract";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { generateAvatarUrl } from "../../blockchain/genAvatar";

const SearchScreen = () => {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const resultAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Load search history from AsyncStorage on component mount
  React.useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem("searchHistory");
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    };
    
    loadSearchHistory();
  }, []);

  // Save search to history
  const saveToHistory = async (searchEmail: string) => {
    try {
      let history = [...searchHistory];
      
      // Remove if already exists (to move to top)
      history = history.filter(item => item !== searchEmail);
      
      // Add to beginning of array
      history.unshift(searchEmail);
      
      // Keep only last 5 searches
      if (history.length > 5) {
        history = history.slice(0, 5);
      }
      
      setSearchHistory(history);
      await AsyncStorage.setItem("searchHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const searchUser = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
  
    Keyboard.dismiss();
    setLoading(true);
    setUser(null);
    setFriendRequestSent(false);
    
    // Start search animation
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    try {
      // Retrieve the current user's wallet private key from storage.
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        setLoading(false);
        return;
      }
      // Reconstruct the user's wallet using the RPC provider.
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // Initialize the profile contract using the reconstructed wallet.
      await initProfileContract(userWallet);
      
      // Now call getProfileByEmail. This function expects a profile to be registered on-chain.
      const profile = await getProfileByEmail(email.trim().toLowerCase());
      
      // Save successful search to history
      if (profile) {
        saveToHistory(email.trim().toLowerCase());
      }
      
      setUser(profile);
      
      // Animate result appearance
      Animated.timing(resultAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      if (err?.reason === "Email not registered") {
        console.log("[SEARCH] No user found for:", email);
        setUser(null);
      } else {
        console.error("[SEARCH ERROR]", err);
        Alert.alert("Error", "An error occurred while searching. Please try again.");
      }
    } finally {
      setLoading(false);
      
      // Reset search animation
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handleSendFriendRequest = async () => {
    if (!user || !user.wallet) {
      Alert.alert("Error", "User information is missing");
      return;
    }
    
    setSendingRequest(true);
    
    try {
      // Retrieve the current user's wallet private key from storage.
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        setSendingRequest(false);
        return;
      }
      
      // Reconstruct the user's wallet using the RPC provider.
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // Initialize the profile contract using the reconstructed wallet.
      await initProfileContract(userWallet);
      
      // Send friend request
      await sendFriendRequest(user.wallet);
      
      setFriendRequestSent(true);
      Alert.alert("Success", `Friend request sent to ${user.name || 'user'}`);
    } catch (err: any) {
      console.error("[FRIEND REQUEST ERROR]", err);
      Alert.alert("Error", "Failed to send friend request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };
  
  const handleHistoryItemPress = (historyEmail: string) => {
    setEmail(historyEmail);
    setTimeout(() => {
      searchUser();
    }, 100);
  };
  
  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem("searchHistory");
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };
  
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
        <Text style={styles.headerTitle}>Search Users</Text>
        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Search Card */}
          <View style={styles.searchCard}>
            <View style={styles.searchBox}>
              <View style={styles.inputContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search by email"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={searchUser}
                />
                {email.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => setEmail("")}
                  >
                    <Ionicons name="close-circle" size={18} color="#888" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.searchButton,
                  (!email.includes("@") || loading) && styles.searchButtonDisabled
                ]} 
                onPress={searchUser}
                disabled={!email.includes("@") || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <Animated.View 
              style={[
                styles.searchingIndicator, 
                { 
                  opacity: searchAnimation,
                  transform: [
                    { 
                      translateY: searchAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <ActivityIndicator size="small" color="#1DB954" />
              <Text style={styles.searchingText}>Searching blockchain...</Text>
            </Animated.View>
          </View>
          
          {/* Search History */}
          {searchHistory.length > 0 && !user && !loading && (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              </View>
              
              {searchHistory.map((historyItem, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(historyItem)}
                >
                  <Ionicons name="time-outline" size={18} color="#888" style={styles.historyIcon} />
                  <Text style={styles.historyItemText}>{historyItem}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* No Results */}
          {!loading && user === null && email.includes("@") && (
            <View style={styles.noResultCard}>
              <Ionicons name="search" size={48} color="#444" />
              <Text style={styles.noResultTitle}>No user found</Text>
              <Text style={styles.noResultText}>
                We couldn't find a user with the email "{email}"
              </Text>
            </View>
          )}
          
          {/* User Result */}
          {user && (
            <Animated.View 
              style={[
                styles.resultCard,
                {
                  opacity: resultAnimation,
                  transform: [
                    { 
                      translateY: resultAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.resultHeader}>
                <Image 
                  source={{ uri: generateAvatarUrl(user.wallet) }} 
                  style={styles.resultAvatar} 
                />
                
                <View style={styles.resultHeaderInfo}>
                  <Text style={styles.resultName}>{user.name || "Unnamed User"}</Text>
                  <View style={styles.walletContainer}>
                    <MaterialCommunityIcons name="ethereum" size={14} color="#1DB954" />
                    <Text style={styles.walletText}>
                      {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {user.bio ? (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioLabel}>Bio</Text>
                  <Text style={styles.bioText}>{user.bio}</Text>
                </View>
              ) : (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioEmpty}>No bio available</Text>
                </View>
              )}
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Ionicons name="mail-outline" size={16} color="#1DB954" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{user.email}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#1DB954" style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    Joined {new Date(user.createdAt * 1000).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="document-text-outline" size={16} color="#1DB954" style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    {user.posts.length} {user.posts.length === 1 ? 'post' : 'posts'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.friendRequestButton,
                  friendRequestSent && styles.friendRequestSentButton,
                  sendingRequest && styles.friendRequestLoadingButton
                ]}
                onPress={handleSendFriendRequest}
                disabled={friendRequestSent || sendingRequest}
              >
                {sendingRequest ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.friendRequestButtonText}>Sending Request...</Text>
                  </View>
                ) : friendRequestSent ? (
                  <View style={styles.buttonContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.friendRequestButtonText}>Friend Request Sent</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContainer}>
                    <Ionicons name="person-add" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.friendRequestButtonText}>Send Friend Request</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#121212" 
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  searchCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252525",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    height: 50,
  },
  clearButton: {
    padding: 6,
  },
  searchButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  searchButtonDisabled: {
    backgroundColor: "rgba(29, 185, 84, 0.4)",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  searchingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  searchingText: {
    color: "#BBBBBB",
    marginLeft: 8,
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  clearHistoryText: {
    color: "#1DB954",
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  historyIcon: {
    marginRight: 12,
  },
  historyItemText: {
    color: "#BBBBBB",
    fontSize: 15,
  },
  noResultCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  noResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultText: {
    color: "#BBBBBB",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#1DB954",
  },
  resultHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  resultName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  walletContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletText: {
    color: "#BBBBBB",
    fontSize: 14,
    marginLeft: 4,
  },
  bioContainer: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1DB954",
    marginBottom: 4,
  },
  bioText: {
    color: "#DDDDDD",
    fontSize: 15,
    lineHeight: 20,
  },
  bioEmpty: {
    color: "#888888",
    fontSize: 15,
    fontStyle: "italic",
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    color: "#DDDDDD",
    fontSize: 14,
  },
  friendRequestButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  friendRequestSentButton: {
    backgroundColor: "#444444",
  },
  friendRequestLoadingButton: {
    backgroundColor: "rgba(29, 185, 84, 0.6)",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  friendRequestButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252525",
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default SearchScreen;