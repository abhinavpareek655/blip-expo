"use client"

import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { RouteProp } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { useRoute } from '@react-navigation/native';
import axios from "axios";

type VerificationScreenRouteProp = RouteProp<{ params: { email: string } }, 'params'>;

const VerificationScreen = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(TextInput | null)[]>([])
  const route = useRoute<VerificationScreenRouteProp>();
  const { email } = route.params;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  
    // Move to next input when text is entered
    if (text.length === 1 && index < code.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (nativeEvent.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        // Delete previous input's content and focus it
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputs.current[index - 1]?.focus();
      }
    }
  };
  

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('not enough digits');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/auth/verify-reset-code', {
        email,
        code: verificationCode
      });

      if (response.data.success) {
        // Navigate to reset password screen with temp token
        router.push({ pathname: '/Reset', params: { token: response.data.tempToken } });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Verification failed');
      } else {
        setError('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1DB954" />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Blip</Text>
      </View>

      <Text style={styles.title}>Verification</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(key) => handleKeyPress(key, index)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>
      {error === "not enough digits" ? <Text style={styles.errorText}>Please enter 6 digits varification code</Text> : null}

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyButtonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
        <Text style={styles.resendButtonText}>Resend Code</Text>
      </TouchableOpacity>

      <View style={styles.changeEmailContainer}>
        <Text style={styles.changeEmailText}>Not your email address? </Text>
            <TouchableOpacity 
                onPress={() => router.push('/Forgot')}
                disabled={loading}
            >        
        <Text style={styles.changeEmailLink}>Change email</Text>
            </TouchableOpacity>
      </View>
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  codeInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: "#1DB954",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 24,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 20,
    width: "100%",
  },
  verifyButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    color: "#1DB954",
    fontSize: 16,
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 11,
  },
  changeEmailContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  changeEmailText: {
    color: '#888',
  },
  changeEmailLink: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
})

export default VerificationScreen

