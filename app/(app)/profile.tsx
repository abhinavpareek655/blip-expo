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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes, Wallet } from "ethers";
import {
  initProfileContract,
  getProfile,
  updateProfileOnChain,
} from "../../blockchain/profileContract";
import BlipAuthABI from "../../blockchain/BlipAuth.json";

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
  const router = useRouter();

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

      // Initialize the Profile contract with the proper wallet (runner) so that calls are supported.
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
    } catch (err) {
      console.error("[FETCH PROFILE ERROR]", err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <View style={styles.postItem}>
      <Text style={styles.postContent}>{item.text}</Text>
      <Text style={styles.postMeta}>
        {new Date(item.timestamp * 1000).toLocaleString()} — {item.isPublic ? "🌍 Public" : "🔒 Private"}
      </Text>
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#1DB954" size="large" />
        <Text style={{ color: "#fff", marginTop: 12 }}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{userProfile.name || userProfile.wallet.slice(0, 6)}</Text>
          <Text style={styles.detailText}>
            Since {new Date(userProfile.createdAt * 1000).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.bio}>Bio: {userProfile.bio}</Text>
          <Text style={styles.detailText}>Email: {userProfile.email}</Text>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.detailText}>
              Wallet: {userProfile.wallet.slice(0, 6)}...{userProfile.wallet.slice(-4)}
            </Text>
            <TouchableOpacity onPress={() => Clipboard.setString(userProfile.wallet)}>
              <Text style={{ color: "#1DB954", marginLeft: 6 }}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
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
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {userProfile.posts.length === 0 ? (
          <Text style={{ flex: 1, color: "#888", textAlign: "center", marginTop: 20 }}>
            You haven’t posted yet!
          </Text>
        ) : (
          <FlatList
            data={userProfile.posts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.postList}
          />
        )}
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor="#888"
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Bio"
              placeholderTextColor="#888"
              value={newBio}
              onChangeText={setNewBio}
              style={styles.modalInput}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
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
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#2C2C2C" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  profileInfo: { alignItems: "center", padding: 20 },
  name: { fontSize: 20, fontWeight: "bold", color: "#ffffff", marginBottom: 5 },
  bio: { fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 20 },
  detailText: { fontSize: 13, color: "#bbb", textAlign: "center", marginTop: 2 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2C",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  statLabel: { fontSize: 12, color: "#888" },
  actionButtons: { flexDirection: "row", justifyContent: "center", paddingVertical: 15 },
  editProfileButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  editProfileButtonText: { color: "#ffffff", fontWeight: "bold" },
  logoutButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  logoutButtonText: { color: "#ffffff", fontWeight: "bold" },
  postList: { paddingHorizontal: 16, paddingTop: 10 },
  postItem: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  postContent: { color: "#fff", fontSize: 16, marginBottom: 4 },
  postMeta: { color: "#888", fontSize: 12 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: "#2C2C2C",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    marginBottom: 10,
  },
  cancelText: { color: "#888", fontSize: 16 },
  saveText: { color: "#1DB954", fontSize: 16, fontWeight: "bold" },
});

export default ProfileScreen;
