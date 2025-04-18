import '../../blockchain/cryptoShim';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Wallet, JsonRpcProvider } from 'ethers';
import { loginOnChain } from "../../blockchain/authContract";
import axios from 'axios';
import AntDesign from '@expo/vector-icons/AntDesign';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeAnimation] = useState(new Animated.Value(0));

  const handleLogin = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required");
      shakeInputs();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Invalid email format");
      shakeInputs();
      return;
    }
    
    if (!password.trim()) {
      setError("Password is required");
      shakeInputs();
      return;
    }
    
    if (!privateKey.trim()) {
      setError("Private key is required to login");
      shakeInputs();
      return;
    }

    setIsLoading(true);
    try {
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(privateKey.trim()).connect(provider);

      console.log("[LOGIN] Reconstructed wallet:", userWallet.address);

      const isValid = await loginOnChain(normalizedEmail, password.trim(), userWallet);

      if (!isValid) {
        setError("Invalid credentials");
        shakeInputs();
        return;
      }

      setError("");
      await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/log-login`, {
        email: normalizedEmail,
        timestamp: new Date().toISOString()
      });

      await AsyncStorage.setItem('userToken', normalizedEmail);
      await AsyncStorage.setItem('walletPrivateKey', privateKey.trim());
      router.replace('../(app)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error("[LOGIN ERROR]", errorMessage);
      shakeInputs();
    } finally {
      setIsLoading(false);
    }
  }, [email, password, privateKey]);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.appName}>Blip</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          <Animated.View 
            style={[
              styles.formContainer,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, email ? styles.inputContainerActive : {}]}>
                <Ionicons name="mail-outline" size={20} color={email ? "#1DB954" : "#fff"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  editable={!isLoading}
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, password ? styles.inputContainerActive : {}]}>
                <Ionicons name="lock-closed-outline" size={20} color={password ? "#1DB954" : "#fff"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon} disabled={isLoading}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, privateKey ? styles.inputContainerActive : {}]}>
                {/* <AntDesign name="key" size={20} color={privateKey ? "#1DB954" : "#fff"} style={styles.inputIcon} /> */}
                <Ionicons name="key-outline" size={20} color={privateKey ? "#1DB954" : "#fff"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your private key"
                  placeholderTextColor="#666"
                  value={privateKey}
                  onChangeText={(text) => {
                    setPrivateKey(text);
                    if (error) setError(null);
                  }}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={true}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginButtonText}>Logging in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/Forgot')} 
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footerContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/Signup')} disabled={isLoading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  keyboardAvoidingView: { 
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
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
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#BBBBBB',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1DB954',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerActive: {
    borderColor: '#1DB954',
  },
  inputIcon: { 
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    color: '#ffffff', 
    fontSize: 16,
  },
  eyeIcon: { 
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: { 
    color: "#E74C3C", 
    fontSize: 14,
    marginLeft: 6,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: { 
    backgroundColor: 'rgba(29, 185, 84, 0.6)',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPassword: { 
    color: '#1DB954', 
    fontSize: 15,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 'auto',
  },
  signupText: { 
    color: '#888888',
    fontSize: 15,
  },
  signupLink: { 
    color: '#1DB954', 
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginScreen;