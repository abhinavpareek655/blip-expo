import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
  StatusBar,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addTextPost, initProfileContract } from "../../blockchain/profileContract";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet, JsonRpcProvider } from "ethers";
import { getWalletFromEmail } from "../../blockchain/authContract";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const Create = () => {
  const [postText, setPostText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const maxCharacters = 2048;
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleTextChange = (text: string) => {
    setPostText(text);
    setCharacterCount(text.length);
  };

  const toggleVisibility = () => {
    setIsPublic(!isPublic);
    
    // Haptic feedback would be added here in a real app
    Vibration.vibrate(10);
  };

  const animatePreview = (focused: boolean) => {
    Animated.timing(animatedHeight, {
      toValue: focused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsFocused(focused);
  };

  const createPost = async () => {
    if (!postText.trim()) {
      Alert.alert("Empty post", "Please write something to post.");
      return;
    }

    Keyboard.dismiss();

    try {
      setIsLoading(true);
      
      // Retrieve email from AsyncStorage (userToken)
      const email = await AsyncStorage.getItem("userToken");
      if (!email) {
        Alert.alert("Error", "Email not found. Please log in again.");
        return;
      }
      
      // Get on-chain wallet address for verification (optional but recommended)
      const onChainWalletAddress = await getWalletFromEmail(email);
      
      // Retrieve the stored wallet's private key from AsyncStorage
      const storedPrivateKey = await AsyncStorage.getItem("walletPrivateKey");
      if (!storedPrivateKey) {
        Alert.alert("Error", "Wallet not found. Please log in again.");
        return;
      }
      
      // Reconstruct the wallet and connect it to your Hardhat provider
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
      
      // (Optional) Validate that the recovered wallet matches the on-chain record
      if (
        userWallet.address.toLowerCase() !== onChainWalletAddress.toLowerCase()
      ) {
        Alert.alert("Error", "Wallet mismatch. Please log in again.");
        return;
      }
      
      // Initialize the Profile contract using the user wallet
      await initProfileContract(userWallet);
      
      // Create the post on-chain
      await addTextPost(postText.trim(), isPublic);

      // Clear input fields and reset settings
      setPostText("");
      setIsPublic(true);
      setCharacterCount(0);

      Toast.show({
        type: "success",
        text1: "Post Created",
        text2: "Your post was saved on-chain",
        position: "bottom",
        visibilityTime: 3000,
      });
      
      // Navigate back to feed or profile after successful post
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      console.error("❌ Post creation failed:", err);
      Alert.alert("Error", "Failed to create post on chain.");
    } finally {
      setIsLoading(false);
    }
  };

  const previewHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#1DB954" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={styles.headerRight} />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Post Card */}
            <View style={styles.postCard}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#888"
                  multiline
                  value={postText}
                  onChangeText={handleTextChange}
                  maxLength={maxCharacters}
                  onFocus={() => animatePreview(true)}
                  onBlur={() => animatePreview(false)}
                  editable={!isLoading}
                />
              </View>
              
              {/* Character Counter */}
              <View style={styles.characterCountContainer}>
                <Text 
                  style={[
                    styles.characterCount, 
                    characterCount > maxCharacters * 0.9 && styles.characterCountWarning
                  ]}
                >
                  {characterCount}/{maxCharacters}
                </Text>
              </View>
              
              {/* Post Preview */}
              <Animated.View style={[styles.previewContainer, { height: previewHeight }]}>
                {isFocused && (
                  <>
                    <Text style={styles.previewTitle}>Preview</Text>
                    <View style={styles.previewContent}>
                      <View style={styles.previewHeader}>
                        <View style={styles.previewVisibility}>
                          {isPublic ? (
                            <MaterialCommunityIcons name="earth" size={16} color="#1DB954" />
                          ) : (
                            <MaterialCommunityIcons name="lock" size={16} color="#E0A458" />
                          )}
                          <Text style={[styles.previewVisibilityText, { color: isPublic ? "#1DB954" : "#E0A458" }]}>
                            {isPublic ? "Public" : "Private"}
                          </Text>
                        </View>
                        <Text style={styles.previewDate}>
                          {new Date().toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.previewText} numberOfLines={2}>
                        {postText || "Your post preview will appear here"}
                      </Text>
                    </View>
                  </>
                )}
              </Animated.View>
            </View>
            
            {/* Post Options */}
            <View style={styles.optionsCard}>
              <Text style={styles.optionsTitle}>Post Options</Text>
              
              <TouchableOpacity
                style={styles.visibilityOption}
                onPress={toggleVisibility}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  {isPublic ? (
                    <MaterialCommunityIcons name="earth" size={22} color="#1DB954" />
                  ) : (
                    <MaterialCommunityIcons name="lock" size={22} color="#E0A458" />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    {isPublic ? "Public Post" : "Private Post"}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {isPublic 
                      ? "Anyone can view this post" 
                      : "Only you can view this post"}
                  </Text>
                </View>
                <View style={styles.toggleContainer}>
                  <View style={[styles.toggleTrack, isPublic && styles.toggleTrackActive]}>
                    <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#888" />
              </View>
              <Text style={styles.infoText}>
                Your post will be stored on the blockchain and cannot be edited after creation.
              </Text>
            </View>
          </ScrollView>
          
          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!postText.trim() || isLoading) && styles.createButtonDisabled,
              ]}
              onPress={createPost}
              disabled={!postText.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.createButtonText}>Creating Post...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
                  <Text style={styles.createButtonText}>Create Post</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </>
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
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1, 
    padding: 16 
  },
  postCard: {
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
  inputContainer: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#333333",
  },
  textInput: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  characterCountContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCount: {
    color: "#888888",
    fontSize: 12,
  },
  characterCountWarning: {
    color: "#E74C3C",
  },
  previewContainer: {
    marginTop: 16,
    overflow: "hidden",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1DB954",
    marginBottom: 8,
  },
  previewContent: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  previewVisibility: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewVisibilityText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  previewDate: {
    fontSize: 12,
    color: "#888888",
  },
  previewText: {
    color: "#DDDDDD",
    fontSize: 14,
    lineHeight: 20,
  },
  optionsCard: {
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
  optionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#888888",
  },
  toggleContainer: {
    marginLeft: 8,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#333333",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: "rgba(29, 185, 84, 0.3)",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#888888",
  },
  toggleThumbActive: {
    backgroundColor: "#1DB954",
    alignSelf: "flex-end",
  },
  infoCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: "#BBBBBB",
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: "#2C2C2C",
  },
  createButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  createButtonDisabled: {
    backgroundColor: "rgba(29, 185, 84, 0.4)",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendIcon: {
    marginRight: 8,
  },
});

export default Create;