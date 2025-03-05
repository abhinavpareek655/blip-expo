import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Home from "../(app)";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "http://10.50.8.161:5000/signup" // Added endpoint

type RootParamList = {
    SignUpScreen: undefined;
    Login: undefined;
    Home: undefined;
};

interface SignUpScreenProps {
    navigation: StackNavigationProp<RootParamList, 'SignUpScreen'>;
}

const SignupScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken')
        if (userToken) {
          navigation.replace('Home')
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  const getPasswordStrength = (password: string): "Weak" | "Medium" | "Strong" => {
    if (password.length < 8) return "Weak";
  
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
  
    if (hasLower && hasUpper && hasNumber && hasSpecial) {
      return "Strong";
    } else if ((hasLower || hasUpper) && hasNumber) {
      return "Medium";
    }
  
    return "Weak";
  };

  const handleSignUp = async () => {
      if (!username) {
        setError("no username");
        return;
      }
      if(!email){
        setError("no email");
        return;
      }
      if(!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        setError("invalid email");
        return;
      }
      if(!password){
        setError("no password");
        return;
      }
      if(password.length < 8){
        setError("password must be at least 8 characters");
        return;
      }
      if(getPasswordStrength(password) === "Weak"){
        setError("weak password");
      }
      if(getPasswordStrength(password) === "Medium"){
        setError("medium password");
      }
      if(getPasswordStrength(password) === "Strong"){
        setError("strong password");
      }
      if(!confirmPassword){
        setError("no confirm password");
        return;
      }
      if (password !== confirmPassword) {
        setError("passwords do not match");
        return;
      }
    
      try {
        const response = await fetch(SERVER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
          setError(data.message || "Could not create account.");
          return;
        }
    
        await AsyncStorage.setItem("userToken", data.token);
        router.replace("../(app)");
      } catch (error) {
        setError("server connection error.");
        console.error("Signup error:", error);
      }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1DB954" />
        </TouchableOpacity> 

        <View style={styles.logoContainer}>
          {/* <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.logo} /> */}
          <Text style={styles.logoText}>Blip</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the decentralized social revolution</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={24} color="#ffffff" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={40}
          />
        </View>
        {error === "no username" ? <Text style={styles.errorText}>Please enter a username</Text> : null}
        {error === "username already in use" ? <Text style={styles.errorText}>This username is already in use</Text> : null}

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
        {error === "no email" ? <Text style={styles.errorText}>Please enter an email</Text> : null}
        {error === "invalid email" ? <Text style={styles.errorText}>Please enter a valid email</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color="#ffffff" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        {error === "no password" ? <Text style={styles.errorText}>Please enter a password</Text> : null}
        {error === "password must be at least 8 characters" ? <Text style={styles.errorText}>Password must be at least 8 characters</Text> : null}
        {error === "weak password" ? <Text style={styles.errorText}>Password is weak</Text> : null}
        {error === "medium password" ? <Text style={styles.mediumPassword}>Password is medium</Text> : null}
        {error === "strong password" ? <Text style={styles.strongPassword}>Password is strong</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color="#ffffff" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        {error === "no confirm password" ? <Text style={styles.errorText}>Please confirm your password</Text> : null}
        {error === "passwords do not match" ? <Text style={styles.errorText}>Passwords do not match</Text> : null}

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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  keyboardAvoidingView: {
    flex: 1,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
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
  }
})

export default SignupScreen

