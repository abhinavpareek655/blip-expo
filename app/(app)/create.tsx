"use client"

import { useState } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { Video, ResizeMode } from "expo-av"

const Create = () => {
  const [mediaType, setMediaType] = useState<null | 'image' | 'video'>(null) // 'image' or 'video'
  const [mediaUri, setMediaUri] = useState<string | null>("")
  const [postText, setPostText] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Request permission to access the media library
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission Required", "Sorry, we need camera roll permissions to make this work!")
      return false
    }
    return true
  }

  // Request permission to access the camera
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission Required", "Sorry, we need camera permissions to make this work!")
      return false
    }
    return true
  }

  // Pick an image from the media library
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      setMediaUri(asset.uri)
      setMediaType(asset.type === "video" ? "video" : "image")
    }
  }

  // Take a photo with the camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      setMediaUri(asset.uri)
      setMediaType("image")
    }
  }

  // Record a video with the camera
  const recordVideo = async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      videoMaxDuration: 60,
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      setMediaUri(asset.uri)
      setMediaType("video")
    }
  }

  // Remove the selected media
  const removeMedia = () => {
    setMediaUri("")
    setMediaType(null)
  }

  // Create the post
  const createPost = () => {
    if (!mediaUri && !postText.trim()) {
      Alert.alert("Error", "Please add a photo, video, or text to create a post")
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Creating post:", {
        mediaType,
        mediaUri,
        postText,
        isPublic,
      })

      // Reset form after successful post
      setMediaUri(null)
      setMediaType(null)
      setPostText("")
      setIsPublic(true)
      setIsLoading(false)

      Alert.alert("Success", "Your post has been created!")
    }, 1500)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Post</Text>
          </View>

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
                <TouchableOpacity style={styles.mediaButton} onPress={recordVideo}>
                  <Ionicons name="videocam-outline" size={24} color="#1DB954" />
                  <Text style={styles.mediaButtonText}>Video</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.mediaPlaceholderText}>Add a photo or video</Text>
            </View>
          ) : (
            <View style={styles.mediaPreviewContainer}>
              {mediaType === "image" ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              ) : (
                <Video source={{ uri: mediaUri }} style={styles.mediaPreview} useNativeControls resizeMode={ResizeMode.CONTAIN} />
              )}
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
            />
          </View>

          <View style={styles.privacyContainer}>
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsPublic(!isPublic)}>
              <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                {isPublic && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxLabel}>Make this post public</Text>
            </TouchableOpacity>
            <Text style={styles.privacyInfo}>
              {isPublic ? "This post will be visible to everyone" : "This post will only be visible to your friends"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, !mediaUri && !postText.trim() && styles.createButtonDisabled]}
            onPress={createPost}
            disabled={(!mediaUri && !postText.trim()) || isLoading}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  mediaPlaceholder: {
    height: 200,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  mediaButtons: {
    flexDirection: "row",
    marginBottom: 15,
  },
  mediaButton: {
    alignItems: "center",
    marginHorizontal: 15,
  },
  mediaButtonText: {
    color: "#1DB954",
    marginTop: 5,
  },
  mediaPlaceholderText: {
    color: "#888",
  },
  mediaPreviewContainer: {
    position: "relative",
    height: 300,
    marginBottom: 20,
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeMediaButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
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
  privacyContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
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
  checkboxLabel: {
    color: "#ffffff",
    fontSize: 16,
  },
  privacyInfo: {
    color: "#888",
    fontSize: 14,
    marginLeft: 30,
  },
  createButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: "auto",
  },
  createButtonDisabled: {
    backgroundColor: "#1E1E1E",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
})

export default Create

