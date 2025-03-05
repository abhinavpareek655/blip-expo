import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const API_URL = 'http://192.168.72.238:5000/login';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!username.trim()) {
      setError("no username");
      return;
    }

    if(!password.trim()){
      setError("no password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setError("");

      // Store user token and navigate to Home
      await AsyncStorage.setItem('userToken', data.token);
      router.replace('../(app)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      // Alert.alert('Error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [username, password, navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Blip</Text>
          </View>

          <Text style={styles.subtitle}>Login to your account</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={24} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {error==="User not found" ? <Text style={styles.errorText}>User not found</Text> : null}
          {error==="no username" ? <Text style={styles.errorText}>Username or email is required to login</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />

            <TouchableOpacity 
              onPress={togglePasswordVisibility} 
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
          {error==="Invalid password" ? <Text style={styles.errorText}>Invalid password</Text> : null}
          {error==="no password" ? <Text style={styles.errorText}>Password is required to login</Text> : null}

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View>
            <TouchableOpacity 
              onPress={() => router.push('/Forgot')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={{flexDirection: 'row', marginTop: 20}}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/Signup')}
              disabled={isLoading}
            >
              
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  forgotPassword: {
    color: '#1DB954',
    marginTop: 15,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    color: '#888',
  },
  signupLink: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 11,
  }
});

export default LoginScreen;
