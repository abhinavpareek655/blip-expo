import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Buffer } from "buffer";
import { createPost as saveToContract, initPostContract } from "../../blockchain/postContract";
import Toast from "react-native-toast-message";

global.Buffer = global.Buffer || Buffer;

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

const Create = () => {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadToIPFS = async (
    fileUri: string,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", {
        uri: fileUri,
        name: "upload.jpg",
        type: "image/jpeg",
      } as any);

      xhr.open("POST", "http://192.168.112.238:5001/api/v0/add");

      xhr.onload = () => {
        try {
          const resText = xhr.responseText;
          const match = resText.match(/"Hash":"([^"]+)"/) || resText.match(/([a-zA-Z0-9]{46})/);
          if (!match) throw new Error("CID not found in response");
          resolve(match[1]);
        } catch (e) {
          reject(new Error("Could not parse IPFS response"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(Math.round(percent));
          }
        };
      }

      xhr.send(formData);
    });
  };

  const requestPermission = async () => {
    const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    return mediaStatus.status === "granted" && cameraStatus.status === "granted";
  };

  const compressImageIfNeeded = async (
    uri: string,
    quality: number = 0.8
  ): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      if (blob.size <= MAX_IMAGE_SIZE) return uri;
      if (quality < 0.2) {
        Alert.alert("Error", "Image is too large to compress below 3MB. Please choose a smaller image.");
        return null;
      }

      const compressed = await ImageManipulator.manipulateAsync(uri, [], {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return await compressImageIfNeeded(compressed.uri, quality - 0.1);
    } catch (err) {
      console.error("Compression failed:", err);
      return null;
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const compressedUri = await compressImageIfNeeded(asset.uri);
      if (!compressedUri) return;
      setMediaUri(compressedUri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const compressedUri = await compressImageIfNeeded(asset.uri);
      if (!compressedUri) return;
      setMediaUri(compressedUri);
    }
  };

  const removeMedia = () => setMediaUri(null);

  const createPost = async () => {
    if (!mediaUri && !postText.trim()) {
      Alert.alert("Error", "Please add a photo or text to create a post");
      return;
    }

    setIsLoading(true);
    try {
      let imageCid: string | null = null;

      if (mediaUri) {
        imageCid = await uploadToIPFS(mediaUri, setUploadProgress);
      }

      const postData = {
        text: postText.trim(),
        image: imageCid ? `https://ipfs.io/ipfs/${imageCid}` : null,
        public: isPublic,
        createdAt: new Date().toISOString(),
      };
      console.log("🧠 Post metadata:", postData);

      await initPostContract(); 
      await saveToContract(postText.trim(), imageCid ?? "", isPublic);


      setMediaUri(null);
      setPostText("");
      setIsPublic(true);
      setUploadProgress(null);

      Toast.show({
        type: "success",
        text1: "✅ Post Created",
        text2: "Uploaded to IPFS & saved on-chain",
        onPress: () =>
          imageCid && Linking.openURL(`https://ipfs.io/ipfs/${imageCid}`),
      });
    } catch (err) {
      console.error("Post creation failed:", err);
      Alert.alert("Error", "Failed to upload or store post");
    } finally {
      setIsLoading(false);
    }
  };

  return ( 
    <>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.headerTitle}>Create Post</Text>
          {!mediaUri ? (
            <View style={styles.mediaPlaceholder}>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={24} color="#1DB954" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color="#1DB954" />
                  <Text style={styles.mediaButtonText}>Photo</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.mediaPlaceholderText}>Add a photo</Text>
            </View>
          ) : (
            <View style={styles.mediaPreviewContainer}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                <Ionicons name="close-circle" size={30} color="#1DB954" />
              </TouchableOpacity>
            </View>
          )}

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

          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsPublic(!isPublic)}>
            <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
              {isPublic && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxLabel}>Make this post public</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, !mediaUri && !postText.trim() && styles.createButtonDisabled]}
            onPress={createPost}
            disabled={(!mediaUri && !postText.trim()) || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.createButtonText}>Create Post</Text>}
          </TouchableOpacity>
          {uploadProgress !== null && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#fff", marginBottom: 5 }}>Uploading: {uploadProgress}%</Text>
              <View style={{ height: 8, backgroundColor: "#333", borderRadius: 4 }}>
                <View
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    backgroundColor: "#1DB954",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    <Toast/>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#ffffff", marginBottom: 20 },
  mediaPlaceholder: {
    height: 200, backgroundColor: "#1E1E1E", borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  mediaButtons: { flexDirection: "row", marginBottom: 15 },
  mediaButton: { alignItems: "center", marginHorizontal: 15 },
  mediaButtonText: { color: "#1DB954", marginTop: 5 },
  mediaPlaceholderText: { color: "#888" },
  mediaPreviewContainer: { position: "relative", height: 300, marginBottom: 20 },
  mediaPreview: { width: "100%", height: "100%", borderRadius: 10 },
  removeMediaButton: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)", borderRadius: 15,
  },
  inputContainer: {
    backgroundColor: "#1E1E1E", borderRadius: 10, padding: 15, marginBottom: 20,
  },
  textInput: {
    color: "#ffffff", fontSize: 16, minHeight: 100, textAlignVertical: "top",
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: "#1DB954", marginRight: 10, justifyContent: "center", alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#1DB954" },
  checkboxLabel: { color: "#ffffff", fontSize: 16 },
  createButton: {
    backgroundColor: "#1DB954", paddingVertical: 15,
    borderRadius: 30, alignItems: "center",
  },
  createButtonDisabled: { backgroundColor: "#1E1E1E" },
  createButtonText: {
    color: "#ffffff", fontSize: 18, fontWeight: "bold",
  },
});

export default Create;
