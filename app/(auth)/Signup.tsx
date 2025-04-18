import 'react-native-get-random-values';
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
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { initContract } from "../../blockchain/authContract";

const SignupScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (!password) return "weak";
    if (password.length < 8) return "weak";
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    if (hasLower && hasUpper && hasNumber && hasSpecial) return "strong";
    if ((hasLower || hasUpper) && hasNumber) return "medium";
    return "weak";
  };

  const getPasswordStrengthColor = (strength: "weak" | "medium" | "strong") => {
    switch (strength) {
      case "weak": return "#E74C3C";
      case "medium": return "#F39C12";
      case "strong": return "#1DB954";
      default: return "#333333";
    }
  };

  const getPasswordStrengthText = (strength: "weak" | "medium" | "strong") => {
    switch (strength) {
      case "weak": return "Weak password";
      case "medium": return "Medium strength";
      case "strong": return "Strong password";
      default: return "";
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleSignUp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError("no email");
      shakeInputs();
      return;
    }
    
    if (!emailRegex.test(normalizedEmail)) {
      setError("invalid email");
      shakeInputs();
      return;
    }
    
    if (!password) {
      setError("no password");
      shakeInputs();
      return;
    }
    
    if (password.length < 8) {
      setError("password must be at least 8 characters");
      shakeInputs();
      return;
    }
    
    const strength = getPasswordStrength(password);
    if (strength === "weak") {
      setError("weak password");
      shakeInputs();
      return;
    }
    
    if (!confirmPassword) {
      setError("no confirm password");
      shakeInputs();
      return;
    }
    
    if (password !== confirmPassword) {
      setError("passwords do not match");
      shakeInputs();
      return;
    }

    try {
      setIsLoading(true);

      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      router.replace({ pathname: "/Varify", params: { email: normalizedEmail, password } });
    } catch (err: any) {
      console.error("Signup error:", err);
      setError("Signup failed. Maybe already registered or invalid.");
      shakeInputs();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </SafeAreaView>
    );
  }

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = getPasswordStrengthColor(passwordStrength);
  const strengthText = getPasswordStrengthText(passwordStrength);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1DB954" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>B</Text>
              </View>
              <Text style={styles.appName}>Blip</Text>
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the decentralized social revolution</Text>
            </View>

            <Animated.View 
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  email ? styles.inputContainerActive : {},
                  error === "no email" || error === "invalid email" ? styles.inputContainerError : {}
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={email ? "#1DB954" : "#888"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error === "no email" || error === "invalid email") setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {(error === "no email" || error === "invalid email") && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                    <Text style={styles.errorText}>
                      {error === "no email" ? "Please enter an email" : "Please enter a valid email"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  password ? { borderColor: strengthColor } : {},
                  error === "no password" || error === "password must be at least 8 characters" || error === "weak password" 
                    ? styles.inputContainerError : {}
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={password ? strengthColor : "#888"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error === "no password" || error === "password must be at least 8 characters" || error === "weak password") 
                        setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                
                {password && passwordFocused && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      <View style={[
                        styles.strengthBar, 
                        { backgroundColor: passwordStrength !== "weak" ? strengthColor : "#333" }
                      ]} />
                      <View style={[
                        styles.strengthBar, 
                        { backgroundColor: passwordStrength === "strong" ? strengthColor : "#333" }
                      ]} />
                      <View style={[
                        styles.strengthBar, 
                        { backgroundColor: passwordStrength === "strong" ? strengthColor : "#333" }
                      ]} />
                    </View>
                    <Text style={[styles.strengthText, { color: strengthColor }]}>
                      {strengthText}
                    </Text>
                  </View>
                )}
                
                {(error === "no password" || error === "password must be at least 8 characters" || error === "weak password") && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                    <Text style={styles.errorText}>
                      {error === "no password" ? "Please enter a password" : 
                       error === "password must be at least 8 characters" ? "Password must be at least 8 characters" : 
                       "Password is too weak"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  confirmPassword ? styles.inputContainerActive : {},
                  error === "no confirm password" || error === "passwords do not match" ? styles.inputContainerError : {}
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={confirmPassword ? "#1DB954" : "#888"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error === "no confirm password" || error === "passwords do not match") setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                {(error === "no confirm password" || error === "passwords do not match") && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                    <Text style={styles.errorText}>
                      {error === "no confirm password" ? "Please confirm your password" : "Passwords do not match"}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.signUpButton, isLoading && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.signUpButtonText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/Login")}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordTipsContainer}>
              <Text style={styles.passwordTipsTitle}>Password Tips:</Text>
              <View style={styles.passwordTip}>
                <Ionicons name="checkmark-circle" size={16} color="#1DB954" style={styles.tipIcon} />
                <Text style={styles.tipText}>At least 8 characters</Text>
              </View>
              <View style={styles.passwordTip}>
                <Ionicons name="checkmark-circle" size={16} color="#1DB954" style={styles.tipIcon} />
                <Text style={styles.tipText}>Include uppercase & lowercase letters</Text>
              </View>
              <View style={styles.passwordTip}>
                <Ionicons name="checkmark-circle" size={16} color="#1DB954" style={styles.tipIcon} />
                <Text style={styles.tipText}>Include numbers and special characters</Text>
              </View>
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
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#BBBBBB",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1DB954",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerActive: {
    borderColor: "#1DB954",
  },
  inputContainerError: {
    borderColor: "#E74C3C",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    height: 4,
    width: 50,
    borderRadius: 2,
    backgroundColor: "#333",
  },
  strengthText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginLeft: 6,
  },
  signUpButton: {
    backgroundColor: "#1DB954",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "rgba(29, 185, 84, 0.6)",
  },
  signUpButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#888888",
    fontSize: 15,
  },
  loginLink: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
  },
  passwordTipsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1DB954",
  },
  passwordTipsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  passwordTip: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    color: "#BBBBBB",
    fontSize: 14,
  },
});

export default SignupScreen;