import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { initContract, signupOnChain } from "../../blockchain/authContract";

const SignupScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("[INIT] Checking Auth + Contract Init");
        const userToken = await AsyncStorage.getItem("userToken");
        if (userToken) {
          router.replace("../(app)");
          return;
        }
        await initContract();
      } catch (error) {
        console.error("[INIT ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const getPasswordStrength = (password: string): "Weak" | "Medium" | "Strong" => {
    if (password.length < 8) return "Weak";
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    if (hasLower && hasUpper && hasNumber && hasSpecial) return "Strong";
    if ((hasLower || hasUpper) && hasNumber) return "Medium";
    return "Weak";
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSignUp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) return setError("no email");
    if (!emailRegex.test(normalizedEmail)) return setError("invalid email");
    if (!password) return setError("no password");
    if (password.length < 8) return setError("password must be at least 8 characters");
    const strength = getPasswordStrength(password);
    if (strength === "Weak") return setError("weak password");
    if (!confirmPassword) return setError("no confirm password");
    if (password !== confirmPassword) return setError("passwords do not match");

    try {
      setIsLoading(true);

      await fetch("http://10.50.15.98:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      router.replace({ pathname: "/Varify", params: { email: normalizedEmail, password } });
    } catch (err: any) {
      console.error("Signup error:", err);
      setError("Signup failed. Maybe already registered or invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1DB954" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Blip</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the decentralized social revolution</Text>

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
          {error === "no email" && <Text style={styles.errorText}>Please enter an email</Text>}
          {error === "invalid email" && <Text style={styles.errorText}>Please enter a valid email</Text>}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#ffffff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#888" />
            </TouchableOpacity>
          </View>
          {error === "no password" && <Text style={styles.errorText}>Please enter a password</Text>}
          {error === "password must be at least 8 characters" && <Text style={styles.errorText}>Password must be at least 8 characters</Text>}
          {error === "weak password" && <Text style={styles.errorText}>Password is weak</Text>}
          {getPasswordStrength(password) === "Medium" && <Text style={styles.mediumPassword}>Password is medium</Text>}
          {getPasswordStrength(password) === "Strong" && <Text style={styles.strongPassword}>Password is strong</Text>}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#ffffff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#888" />
            </TouchableOpacity>
          </View>
          {error === "no confirm password" && <Text style={styles.errorText}>Please confirm your password</Text>}
          {error === "passwords do not match" && <Text style={styles.errorText}>Passwords do not match</Text>}

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/Login")}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  keyboardAvoidingView: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
  eyeIcon: {
    padding: 10,
  },
  signUpButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 20,
    width: "100%",
  },
  signUpButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  loginText: {
    color: "#888",
  },
  loginLink: {
    color: "#1DB954",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 11,
  },
  mediumPassword: {
    color: "#fff04d",
    fontSize: 14,
    marginBottom: 11,
    fontWeight: "bold",
  },
  strongPassword: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 11,
  },
});

export default SignupScreen;
