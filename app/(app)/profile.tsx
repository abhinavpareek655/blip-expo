import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Clipboard,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes, Wallet } from "ethers";
import {
  initProfileContract,
  getProfile,
  updateProfileOnChain,
} from "../../blockchain/profileContract";
import BlipAuthABI from "../../blockchain/BlipAuth.json";
import { generateAvatarUrl } from '../../blockchain/genAvatar';

const AUTH_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_AUTH_CONTRACT!;
const PROVIDER_URL = process.env.EXPO_PUBLIC_RPC_URL!;
const SCREEN_WIDTH = Dimensions.get("window").width;

const clearAsyncStorage = async () => {
  await AsyncStorage.clear();
  console.log("[LOGOUT] AsyncStorage cleared");
};

const ProfileScreen = () => {
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [copiedAnimation] = useState(new Animated.Value(0));
  const [showCopied, setShowCopied] = useState(false);
  const router = useRouter();
  
  // New state variables for private key functionality
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [password, setPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKeySection, setShowPrivateKeySection] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      // Retrieve email from storage.
      const email = await AsyncStorage.getItem("userToken");
      if (!email) throw new Error("Email not found");

      // Create a provider and build a read-only instance of the Auth contract.
      const provider = new JsonRpcProvider(PROVIDER_URL);
      const authContract = new Contract(AUTH_CONTRACT_ADDRESS, BlipAuthABI.abi, provider);

      // Compute the email hash and get the on-chain wallet.
      const emailHash = keccak256(toUtf8Bytes(email.trim().toLowerCase()));
      const onChainWallet = await authContract.getUserByEmailHash(emailHash);
      if (!onChainWallet || onChainWallet === "0x0000000000000000000000000000000000000000") {
        throw new Error("No wallet found for this email");
      }

      // Retrieve the stored wallet's private key.
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) throw new Error("Wallet not found");

      // Reconstruct the user's wallet and connect to the provider.
      const userWallet = new Wallet(storedPrivateKey).connect(provider);

      // Validate that the reconstructed wallet matches the on-chain record.
      if (userWallet.address.toLowerCase() !== onChainWallet.toLowerCase()) {
        throw new Error("Wallet mismatch");
      }

      // Initialize the Profile contract with the proper wallet so that calls are supported.
      await initProfileContract(userWallet);

      // Retrieve profile data using the user's wallet address.
      const profile = await getProfile(userWallet.address);
      const createdAt = Number(profile.createdAt?.toString?.() || profile.createdAt) || 0;
      const formattedPosts = Array.isArray(profile.posts)
        ? profile.posts.map((p, index) => ({
            id: index.toString(),
            text: p.text,
            timestamp: Number(p.timestamp),
            isPublic: p.isPublic,
          }))
        : [];
      setUserProfile({
        ...profile,
        email,
        wallet: userWallet.address,
        createdAt,
        posts: formattedPosts,
      });
      
      // Pre-populate edit fields
      setNewName(profile.name || "");
      setNewBio(profile.bio || "");
    } catch (err) {
      console.error("[FETCH PROFILE ERROR]", err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    setShowCopied(true);
    
    Animated.sequence([
      Animated.timing(copiedAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(copiedAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCopied(false);
    });
  };

  // Function to verify password and show private key
  const verifyPasswordAndShowKey = async () => {
    if (!password.trim()) {
      setPasswordError("Please enter your password");
      return;
    }

    try {
      setVerifyingPassword(true);
      setPasswordError(null);

      // Get the stored password hash
      const storedHash = await AsyncStorage.getItem("passwordHash");
      if (!storedHash) {
        Alert.alert("Error", "Password hash not found. Please log in again.");
        return;
      }

      // Compute hash of entered password
      const computedHash = keccak256(toUtf8Bytes(password.trim()));

      // Compare hashes
      if (computedHash !== storedHash) {
        setPasswordError("Incorrect password");
        return;
      }

      // Retrieve the private key
      const privateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!privateKey) {
        Alert.alert("Error", "Private key not found. Please log in again.");
        return;
      }

      // Set the private key and close the modal
      setPrivateKey(privateKey);
      setShowPrivateKeyModal(false);
      setShowPrivateKeySection(true);
      
      // Reset password field
      setPassword("");
    } catch (error) {
      console.error("[VERIFY PASSWORD ERROR]", error);
      Alert.alert("Error", "Failed to verify password");
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Function to handle cancel button in password modal
  const handleCancelPasswordModal = () => {
    setShowPrivateKeyModal(false);
    setPassword("");
    setPasswordError(null);
  };

  const renderPostItem = ({ item }: { item: any }) => {
    const date = new Date(item.timestamp * 1000);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return (
      <View style={styles.postItem}>
        <View style={styles.postHeader}>
          <View style={styles.postVisibility}>
            {item.isPublic ? (
              <MaterialCommunityIcons name="earth" size={16} color="#1DB954" />
            ) : (
              <MaterialCommunityIcons name="lock" size={16} color="#E0A458" />
            )}
            <Text style={[styles.postVisibilityText, { color: item.isPublic ? "#1DB954" : "#E0A458" }]}>
              {item.isPublic ? "Public" : "Private"}
            </Text>
          </View>
          <Text style={styles.postDate}>{formattedDate} • {formattedTime}</Text>
        </View>
        <Text style={styles.postContent}>{item.text}</Text>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color="#1DB954" size="large" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.logoutIconButton}
          onPress={() => {
            Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                onPress: () => {
                  clearAsyncStorage();
                  router.replace("../(auth)/Login");
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#1DB954" 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: generateAvatarUrl(userProfile.wallet) }}
              style={styles.avatarProfile}
            />
            
            <View style={styles.profileNameContainer}>
              <Text style={styles.name}>{userProfile.name || "Unnamed User"}</Text>
              <Text style={styles.joinDate}>
                Joined {new Date(userProfile.createdAt * 1000).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          {userProfile.bio ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.bio}>{userProfile.bio}</Text>
            </View>
          ) : (
            <View style={styles.bioContainer}>
              <Text style={styles.bioEmpty}>No bio yet</Text>
            </View>
          )}
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={16} color="#1DB954" style={styles.detailIcon} />
              <Text style={styles.detailText}>{userProfile.email}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="ethereum" size={16} color="#1DB954" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {userProfile.wallet.slice(0, 6)}...{userProfile.wallet.slice(-4)}
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(userProfile.wallet)}
              >
                <Ionicons name="copy-outline" size={14} color="#1DB954" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Private Key Section (shown after verification) */}
          {showPrivateKeySection && (
            <View style={styles.privateKeySection}>
              <View style={styles.privateKeyHeader}>
                <MaterialCommunityIcons name="key" size={18} color="#E0A458" style={styles.privateKeyIcon} />
                <Text style={styles.privateKeyTitle}>Private Key</Text>
                <TouchableOpacity 
                  style={styles.closePrivateKeyButton}
                  onPress={() => {
                    setShowPrivateKeySection(false);
                    setPrivateKeyVisible(false);
                    setPrivateKey("");
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.privateKeyContainer}>
                <Text style={styles.privateKeyText}>
                  {privateKeyVisible 
                    ? privateKey 
                    : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                </Text>
                <View style={styles.privateKeyActions}>
                  <TouchableOpacity 
                    style={styles.toggleVisibilityButton}
                    onPress={() => setPrivateKeyVisible(!privateKeyVisible)}
                  >
                    <Ionicons 
                      name={privateKeyVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#BBBBBB" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.copyKeyButton}
                    onPress={() => copyToClipboard(privateKey)}
                  >
                    <Ionicons name="copy-outline" size={20} color="#1DB954" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.privateKeyWarning}>
                Never share your private key with anyone. Anyone with your private key has full control of your wallet.
              </Text>
            </View>
          )}
          
          <View style={styles.profileButtonsContainer}>
            <TouchableOpacity 
              style={styles.editProfileButton} 
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="pencil-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            {/* Show Private Key Button */}
            <TouchableOpacity 
              style={styles.showPrivateKeyButton} 
              onPress={() => setShowPrivateKeyModal(true)}
            >
              <MaterialCommunityIcons name="key-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.showPrivateKeyButtonText}>Show Private Key</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          
          {/* You can add more stats here if needed */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>
        
        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          
          {userProfile.posts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <MaterialCommunityIcons name="post-outline" size={48} color="#444" />
              <Text style={styles.emptyPostsText}>No posts yet</Text>
              <Text style={styles.emptyPostsSubtext}>Your posts will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={userProfile.posts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.postList}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                  value={newName}
                  onChangeText={setNewName}
                  style={styles.modalInput}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#666"
                  value={newBio}
                  onChangeText={setNewBio}
                  style={[styles.modalInput, styles.bioInput]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={async () => {
                  try {
                    await updateProfileOnChain(newName || userProfile.name, newBio || userProfile.bio);
                    setUserProfile((prev: any) => ({
                      ...prev,
                      name: newName || prev.name,
                      bio: newBio || prev.bio,
                    }));
                    setEditModalVisible(false);
                  } catch (err) {
                    console.error("[EDIT PROFILE ERROR]", err);
                    Alert.alert("Error", "Failed to update profile");
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Password Verification Modal for Private Key */}
      <Modal
        visible={showPrivateKeyModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Password</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleCancelPasswordModal}
                disabled={verifyingPassword}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.securityIconContainer}>
                <MaterialCommunityIcons name="shield-key" size={40} color="#1DB954" />
              </View>
              
              <Text style={styles.securityMessage}>
                For your security, please enter your password to view your private key
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError(null);
                    }}
                    style={styles.passwordInput}
                    secureTextEntry={true}
                    editable={!verifyingPassword}
                    autoCapitalize="none"
                  />
                </View>
                
                {passwordError && (
                  <View style={styles.passwordErrorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                    <Text style={styles.passwordErrorText}>{passwordError}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelPasswordModal}
                disabled={verifyingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, verifyingPassword && styles.disabledButton]}
                onPress={verifyPasswordAndShowKey}
                disabled={verifyingPassword}
              >
                {verifyingPassword ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}> Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Copied Animation */}
      {showCopied && (
        <Animated.View 
          style={[
            styles.copiedNotification,
            {
              opacity: copiedAnimation,
              transform: [
                {
                  translateY: copiedAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.copiedText}>Copied to clipboard!</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
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
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#ffffff",
  },
  logoutIconButton: {
    padding: 8,
  },
  profileCard: {
    margin: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileNameContainer: {
    flex: 1,
    marginLeft: 16,
  },
  avatarProfile: { 
    width: 70, 
    height: 70, 
    borderRadius: 40, 
    borderWidth: 1,
    borderColor: "#1DB954",
  },
  name: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#ffffff", 
  },
  joinDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
    padding: 8,
    paddingHorizontal: 14,
    backgroundColor: "#252525",
    borderRadius: 8,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1DB954",
    marginBottom: 4,
  },
  bio: { 
    fontSize: 15, 
    color: "#DDDDDD", 
    lineHeight: 20,
  },
  bioEmpty: {
    fontSize: 15,
    color: "#666",
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
    fontSize: 14, 
    color: "#DDDDDD", 
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  profileButtonsContainer: {
    gap: 12,
  },
  editProfileButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileButtonText: { 
    color: "#ffffff", 
    fontWeight: "bold",
    fontSize: 16,
  },
  showPrivateKeyButton: {
    backgroundColor: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444444",
  },
  showPrivateKeyButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: { 
    alignItems: "center" 
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#ffffff" 
  },
  statLabel: { 
    fontSize: 14, 
    color: "#888",
    marginTop: 4,
  },
  postsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  emptyPostsContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPostsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 12,
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  postList: { 
    paddingTop: 0,
  },
  postItem: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  postVisibility: {
    flexDirection: "row",
    alignItems: "center",
  },
  postVisibilityText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  postDate: {
    fontSize: 12,
    color: "#888",
  },
  postContent: { 
    color: "#fff", 
    fontSize: 15, 
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1c1c1c",
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#1DB954",
    marginBottom: 8,
    fontWeight: "500",
  },
  modalInput: {
    backgroundColor: "#2C2C2C",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  cancelButtonText: {
    color: "#DDD",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#1DB954",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#1DB954",
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "rgba(29, 185, 84, 0.6)",
  },
  copiedNotification: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: "rgba(29, 185, 84, 0.9)",
    padding: 10,
    borderRadius: 8,
    margin: 16,
    alignItems: "center",
  },
  copiedText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  // New styles for private key functionality
  securityIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  securityMessage: {
    color: "#BBBBBB",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInputContainer: {
    backgroundColor: "#2C2C2C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444444",
  },
  passwordInput: {
    color: "#fff",
    fontSize: 16,
    padding: 12,
  },
  passwordErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  passwordErrorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginLeft: 6,
  },
  privateKeySection: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#E0A458",
  },
  privateKeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  privateKeyIcon: {
    marginRight: 8,
  },
  privateKeyTitle: {
    color: "#E0A458",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  closePrivateKeyButton: {
    padding: 4,
  },
  privateKeyContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  privateKeyText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  privateKeyActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleVisibilityButton: {
    padding: 8,
    marginRight: 4,
  },
  copyKeyButton: {
    padding: 8,
  },
  privateKeyWarning: {
    color: "#E74C3C",
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default ProfileScreen;