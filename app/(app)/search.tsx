import React, { useState } from "react";
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
} from "react-native";
import { getProfileByEmail, initProfileContract } from "../../blockchain/profileContract";

const SearchScreen = () => {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchUser = async () => {
    if (!email.includes("@")) {
      return;
    }
  
    setLoading(true);
    try {
      await initProfileContract();
      const profile = await getProfileByEmail(email.trim().toLowerCase());
      setUser(profile);
    } catch (err: any) {
      if (err?.reason === "Email not registered") {
        console.log("[SEARCH] No user found for:", email);
        setUser(null);
      } else {
        console.error("[SEARCH ERROR]", err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Users</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Enter email"
            placeholderTextColor="#888"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchUser}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />}
        {!loading && user === null && (
          <Text style={styles.noResult}>No user found with that email</Text>
        )}
        {user && (
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{user.name}</Text>
            <Text style={styles.resultBio}>Bio: {user.bio}</Text>
            <Text style={styles.resultDetail}>Email: {user.email}</Text>
            <Text style={styles.resultDetail}>
              Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </Text>
            <Text style={styles.resultDetail}>
              Joined: {new Date(user.createdAt * 1000).toLocaleDateString()}
            </Text>
            <Text style={styles.resultDetail}>
              Posts: {user.posts.length}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    padding: 20,
    borderBottomColor: "#2C2C2C",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  searchBox: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: "#1DB954",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultCard: {
    backgroundColor: "#1E1E1E",
    margin: 20,
    padding: 16,
    borderRadius: 10,
  },
  resultName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  resultBio: {
    color: "#ccc",
    marginBottom: 6,
  },
  resultDetail: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  noResult: {
    color: "#888",
    fontSize: 16,
    marginTop: 30,
    textAlign: "center",
  }
  
});

export default SearchScreen;
