"use client"

import { useState } from "react"
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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';


const SCREEN_WIDTH = Dimensions.get("window").width

// Dummy data for user profile
const USER_DATA = {
  username: "satoshi_nakamoto",
  name: "Satoshi Nakamoto",
  avatar: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=",
  bio: "Mysterious creator of Bitcoin. Decentralization enthusiast. Blockchain pioneer.",
  followers: 1000000,
  following: 0,
  posts: 1,
}

// Dummy data for user posts
const USER_POSTS = [
  { id: "1", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "2", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "3", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "4", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "5", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "6", image: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
]

const clearAsyncStorage = async() => {
  AsyncStorage.clear();
}

const ProfileScreen = () => {
  const [isGridView, setIsGridView] = useState(true)
  const router = useRouter();

  const renderPostItem = ({ item }: { item: { id: string; image: string } }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{USER_DATA.username}</Text>
          <TouchableOpacity onPress={() => console.log("Open settings")}>
            <Ionicons name="settings-outline" size={24} color="#1DB954" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Image source={{ uri: USER_DATA.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{USER_DATA.name}</Text>
          <Text style={styles.bio}>{USER_DATA.bio}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER_DATA.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER_DATA.followers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{USER_DATA.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => console.log("Edit profile")}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={() => {
            Alert.alert(
              "Confirm Logout",
              "Are you sure you want to logout?",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Logout",
                  onPress: () => {
                    clearAsyncStorage();
                    router.replace('../(auth)/Login');
                  }
                }
              ]
            )
          }}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.postViewToggle}>
          <TouchableOpacity onPress={() => setIsGridView(true)}>
            <Ionicons name="grid-outline" size={24} color={isGridView ? "#1DB954" : "#ffffff"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsGridView(false)}>
            <Ionicons name="list-outline" size={24} color={!isGridView ? "#1DB954" : "#ffffff"} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={USER_POSTS}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          numColumns={isGridView ? 3 : 1}
          key={isGridView ? "grid" : "list"}
          scrollEnabled={false}
          contentContainerStyle={styles.postList}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  profileInfo: {
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2C",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
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
  editProfileButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  postViewToggle: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2C",
  },
  postList: {
    paddingTop: 5,
  },
  postItem: {
    width: SCREEN_WIDTH / 3 - 2,
    height: SCREEN_WIDTH / 3 - 2,
    margin: 1,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
})

export default ProfileScreen

