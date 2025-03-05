"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import axios from "axios"

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("")
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleSendResetLink = async () => {
    if (!email.trim()) {
        setError('no email');
        return;
    }
    if(!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        setError("invalid email");
        return;
    }

    try {
        setLoading(true);
        setError('');
  
        const response = await axios.post('http://192.168.72.238:5000/send-reset-code', {
          email: email.trim().toLowerCase(),
        });
  
        if (response.data.success) {
          router.push({ pathname: '/Varify', params: { email: encodeURIComponent(email) } });
        } else {
          throw new Error(response.data.message || 'Failed to send reset link');
        }
      } catch (err) {
        const errorMessage = (err as any).response?.data?.message || (err as Error).message || 'Failed to send reset link. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1DB954" />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        {/* <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.logo} /> */}
        <Text style={styles.logoText}>Blip</Text>
      </View>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={24} color="#ffffff" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {error==="no email" ? <Text style={styles.errorText}>Email is required</Text> : null}
      {error==="invalid email" ? <Text style={styles.errorText}>Invalid email</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.sendButton} onPress={handleSendResetLink}>
        <Text style={styles.sendButtonText}>Send Reset Link</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: "100%",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 15,
  },
  sendButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 20,
    width: "100%",
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 11,
  },
})

export default ForgotPasswordScreen

