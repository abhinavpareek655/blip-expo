import { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addTextPost, initProfileContract } from "../../blockchain/profileContract";
import Toast from "react-native-toast-message";

const Create = () => {
  const [postText, setPostText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const createPost = async () => {
    if (!postText.trim()) {
      Alert.alert("Empty post", "Please write something to post.");
      return;
    }

    try {
      setIsLoading(true);
      await initProfileContract();
      await addTextPost(postText.trim(), isPublic);

      setPostText("");
      setIsPublic(true);

      Toast.show({
        type: "success",
        text1: "✅ Post Created",
        text2: "Your post was saved on-chain",
      });
    } catch (err) {
      console.error("❌ Post creation failed:", err);
      Alert.alert("Error", "Failed to create post on chain.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.headerTitle}>Create Post</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#888"
                multiline
                value={postText}
                onChangeText={setPostText}
                maxLength={2048}
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsPublic(!isPublic)}
            >
              <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                {isPublic && <Text style={styles.checkmark}>✔</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Make this post public</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                !postText.trim() && styles.createButtonDisabled,
              ]}
              onPress={createPost}
              disabled={!postText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Create Post</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  textInput: {
    color: "#ffffff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#1DB954",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#1DB954",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    color: "#ffffff",
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#1E1E1E",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Create;
