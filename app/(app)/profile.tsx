"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from "ethers";
import { initProfileContract, getProfile } from "../../blockchain/profileContract";
import BlipAuthABI from "../../blockchain/BlipAuth.json";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateProfileOnChain } from "../../blockchain/profileContract";
import { uploadToIPFS } from "../../utils/ipfs";

const AUTH_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
  const [newAvatar, setNewAvatar] = useState("");

  const fetchUserProfile = async () => {
    try {
      console.log("[FETCH] Starting profile fetch...");
  
      const email = await AsyncStorage.getItem("userToken");
      if (!email) throw new Error("Email not found in AsyncStorage");
      console.log("[FETCH] Email from storage:", email);
  
      const provider = new JsonRpcProvider("http://10.50.15.98:8545");
      const authContract = new Contract(
        AUTH_CONTRACT_ADDRESS,
        BlipAuthABI.abi,
        provider
      );
  
      const emailHash = keccak256(toUtf8Bytes(email.trim().toLowerCase()));
      console.log("[FETCH] Email hash:", emailHash);
  
      const wallet = await authContract.getUserByEmailHash(emailHash);
      console.log("[FETCH] Wallet address from contract:", wallet);
  
      if (!wallet || wallet === "0x0000000000000000000000000000000000000000") {
        throw new Error("No wallet found for this email");
      }
  
      await initProfileContract();
      const profile = await getProfile(wallet);
      console.log("[FETCH] Raw profile from contract:", profile);
  
      // Validate post format
      const postCIDs = Array.isArray(profile.posts) ? profile.posts.map((p) => {
        const cid = p.toString?.() || p;
        console.log("[FETCH] Processing post CID:", cid);
        return {
          id: cid,
          image: `https://cloudflare-ipfs.com/ipfs/${cid}`,
        };
      }) : [];
  
      // Handle BigInt or BigNumber createdAt
      let createdAt;
      try {
        createdAt = Number(profile.createdAt?.toString?.() || profile.createdAt);
        if (isNaN(createdAt)) throw new Error("createdAt is NaN");
        console.log("[FETCH] Converted createdAt:", createdAt);
      } catch (err) {
        console.error("[FETCH ERROR] Invalid createdAt value:", profile.createdAt, err);
        createdAt = 0;
      }
  
      setUserProfile({
        ...profile,
        username: wallet,
        email: email.trim().toLowerCase(),
        wallet,
        createdAt,
        avatar: profile.avatar,
        posts: postCIDs,
      });
  
      console.log("[FETCH] Final user profile set in state");
    } catch (err) {
      console.error("❌ [FETCH USER PROFILE ERROR]", err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const renderPostItem = ({ item }: { item: { id: string; image: string } }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", marginTop: 50 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {userProfile.name || userProfile.username.slice(0, 6) + "..."}
          </Text>
          <Text style={styles.detailText}>Since {new Date(Number(userProfile.createdAt) * 1000).toLocaleDateString()}</Text>
        </View>

        <View style={styles.profileInfo}>
          <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.bio}>Bio: {userProfile.bio}</Text>
          <Text style={styles.detailText}>Email: {userProfile.email}</Text>
          <View style={{flexDirection:'row'}}>
          <Text style={styles.detailText}>Wallet: {userProfile.wallet.slice(0,6)}...{userProfile.wallet.slice(-4)}</Text>
          <TouchableOpacity onPress={() => Clipboard.setString(userProfile.wallet)}>
            <Text style={{ color: "#1DB954", textAlign: "center" }}> Copy</Text>
          </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.blippers.length}</Text>
            <Text style={styles.statLabel}>Blippers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.bliping.length}</Text>
            <Text style={styles.statLabel}>Bliping</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setEditModalVisible(true)}
          >
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

        <View style={styles.postViewToggle}>
          <TouchableOpacity onPress={() => setIsGridView(true)}>
            <Ionicons
              name="grid-outline"
              size={24}
              color={isGridView ? "#1DB954" : "#ffffff"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsGridView(false)}>
            <Ionicons
              name="list-outline"
              size={24}
              color={!isGridView ? "#1DB954" : "#ffffff"}
            />
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
          numColumns={isGridView ? 3 : 1}
          key={isGridView ? "grid" : "list"}
          scrollEnabled={false}
          contentContainerStyle={styles.postList}
        />
        )}
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 1,
                });

                if (!result.canceled && result.assets.length > 0) {
                  const uri = result.assets[0].uri;

                  const compressImage = async (uri: string, quality = 0.8): Promise<string | null> => {
                    const response = await fetch(uri);
                    const blob = await response.blob();

                    if (blob.size <= 3 * 1024 * 1024) return uri;
                    if (quality < 0.2) {
                      Alert.alert("Image too large", "Please choose a smaller image.");
                      return null;
                    }

                    const compressed = await ImageManipulator.manipulateAsync(uri, [], {
                      compress: quality,
                      format: ImageManipulator.SaveFormat.JPEG,
                    });

                    return await compressImage(compressed.uri, quality - 0.1);
                  };

                  const compressedUri = await compressImage(uri);
                  if (!compressedUri) return;

                  const cid = await uploadToIPFS(compressedUri);
                  const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
                  setNewAvatar(ipfsUrl);
                }
              }}
              style={{ alignSelf: "center", marginBottom: 15 }}
            >
              <Image
                source={{ uri: newAvatar || userProfile.avatar || "https://ipfs.io/ipfs/QmcZRa4uNoDjzQryG2MJQ8C4P3KEP1sBbdNH39HTGpojzG" }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </TouchableOpacity>

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
                    await updateProfileOnChain(newName || userProfile.name, newAvatar || userProfile.avatar, newBio || userProfile.bio);
                    setUserProfile((prev: any) => ({
                      ...prev,
                      name: newName || prev.name,
                      bio: newBio || prev.bio,
                      avatar: newAvatar || prev.avatar,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  profileInfo: { alignItems: "center", padding: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "bold", color: "#ffffff", marginBottom: 5 },
  bio: { fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 20 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2C",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  statLabel: { fontSize: 12, color: "#888" },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 15,
  },
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
  postViewToggle: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2C",
  },
  postList: { paddingTop: 5 },
  postItem: {
    width: SCREEN_WIDTH / 3 - 2,
    height: SCREEN_WIDTH / 3 - 2,
    margin: 1,
  },
  postImage: { width: "100%", height: "100%" },
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
  detailText: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
    marginTop: 2,
  },
});

export default ProfileScreen;
