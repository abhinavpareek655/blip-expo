import 'react-native-get-random-values';
import { useState, useRef, useEffect } from "react"
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
  ActivityIndicator,
  Modal,
  Clipboard,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons"
import { RouteProp } from '@react-navigation/native';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import axios from "axios";
import { signupOnChain, createUserWallet, createProfileOnChain } from "../../blockchain/authContract";
import { initProfileContract, createProfile } from "../../blockchain/profileContract";
import { Wallet, JsonRpcProvider, parseEther, ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";

type VerificationScreenRouteProp = RouteProp<{ params: { email: string, password: string } }, 'params'>;

const VerificationScreen = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(TextInput | null)[]>([])
  const route = useRoute<VerificationScreenRouteProp>();
  const { email, password } = route.params;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [walletKey, setWalletKey] = useState("")
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedMessage] = useState(new Animated.Value(0));
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, countdown]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
  
    // ✨ Paste full code into any box
    if (text.length === 6 && /^\d{6}$/.test(text)) {
      const digits = text.split('');
      setCode(digits);
      inputs.current[5]?.focus();
      return;
    }
  
    // 👆 Single digit entry
    if (/^\d$/.test(text)) {
      newCode[index] = text;
      setCode(newCode);
      if (index < 5) {
        inputs.current[index + 1]?.focus();
      }
    }
  };
  
  const handleKeyPress = (
    { nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (nativeEvent.key === "Backspace") {
      const newCode = [...code];
  
      if (code[index] === '') {
        if (index > 0) {
          newCode[index - 1] = '';
          setCode(newCode);
          inputs.current[index - 1]?.focus();
        }
      } else {
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter 6 digit verification code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/verify-otp`,
        {
          email: email.trim().toLowerCase(),
          code: verificationCode,
        }
      );

      if (response.data.success) {
        try {
          const wallet: Wallet = createUserWallet();

          const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
          const funder = await provider.getSigner(0);
          const txFund = await funder.sendTransaction({
            to: wallet.address,
            value: parseEther("1")
          });
          await txFund.wait();
          console.log("[VERIFY] Wallet funded:", wallet.address);

          console.log("[VERIFY] Signing up on chain...");
          await signupOnChain(wallet, email, password);

          console.log("[VERIFY] Initializing profile contract...");
          await initProfileContract(wallet);

          console.log("[VERIFY] Creating on-chain profile...");
          await createProfileOnChain(wallet, "User", email, "I am a Blip User");

          await AsyncStorage.setItem("userToken", email.trim().toLowerCase());
          await AsyncStorage.setItem("walletPrivateKey", wallet.privateKey);
          const passwordHash = keccak256(toUtf8Bytes(password)); 
          await AsyncStorage.setItem("passwordHash", passwordHash);

          //temperory line of code for testing remove this sfter testing:
          const stored = await AsyncStorage.getItem("walletPrivateKey");
          console.log("Stored wallet key:", stored);

          console.log("[VERIFY] Profile created. Redirecting...");
          setWalletKey(wallet.privateKey);
          setShowKeyModal(true);
        } catch (profileError) {
          console.error("[VERIFY ERROR] Profile creation failed:", profileError);
          setError("Profile creation failed. Please try again.");
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Verification failed");
      } else {
        setError("Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    try {
      setLoading(true);
      setError("");
      await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/send-otp`, { email });
      setResendDisabled(true);
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyModalContinue = async () => {
    router.replace("../(app)");
  }

  const copyToClipboard = () => {
    Clipboard.setString(walletKey);
    setCopied(true);
    
    Animated.sequence([
      Animated.timing(copiedMessage, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(copiedMessage, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCopied(false);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1DB954" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.appName}>Blip</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
              <Text style={styles.emailHighlight}> {email}</Text>
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : {},
                  error && code.join("").length !== 6 ? styles.codeInputError : {}
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(key) => handleKeyPress(key, index)}
                keyboardType="number-pad"
                maxLength={6}
                selectionColor="#1DB954"
              />
            ))}
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.verifyButton, loading && styles.buttonDisabled]} 
            onPress={handleVerify} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>Didn't receive the code?</Text>
            
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={handleResendCode} 
              disabled={loading || resendDisabled}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1DB954" />
              ) : resendDisabled ? (
                <Text style={styles.resendDisabledText}>Resend in {countdown}s</Text>
              ) : (
                <Text style={styles.resendButtonText}>Resend Code</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.changeEmailContainer}>
            <Text style={styles.changeEmailText}>Not your email address? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/Signup')}
              disabled={loading}
            >        
              <Text style={styles.changeEmailLink}>Change email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal that shows the wallet private key with instructions */}
        <Modal 
          visible={showKeyModal} 
          transparent={true} 
          animationType="fade" 
          statusBarTranslucent
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="shield-key" size={32} color="#1DB954" />
                </View>
                <Text style={styles.modalTitle}>Secure Your Private Key</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  Please back up your private key securely. It's the only way to recover your account and cannot be retrieved
                  if lost.
                </Text>

                <View style={styles.keyContainer}>
                  <Text selectable style={styles.privateKey}>
                    {walletKey}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton} 
                    onPress={copyToClipboard} 
                    activeOpacity={0.7}
                  >
                    {copied ? (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    ) : (
                      <Ionicons name="copy-outline" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={20} color="#E74C3C" style={styles.warningIcon} />
                  <Text style={styles.warningText}>Never share this key with anyone</Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  onPress={handleKeyModalContinue} 
                  style={styles.continueButton} 
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>I've Saved My Key</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Copied notification */}
          {copied && (
            <Animated.View 
              style={[
                styles.copiedMessage,
                {
                  opacity: copiedMessage,
                  transform: [
                    {
                      translateY: copiedMessage.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.copiedText}>Copied to clipboard!</Text>
            </Animated.View>
          )}
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
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
    color: "#FFFFFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#BBBBBB",
    textAlign: "center",
    lineHeight: 22,
  },
  emailHighlight: {
    color: "#1DB954",
    fontWeight: "500",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: "#1DB954",
    backgroundColor: "#1E1E1E",
  },
  codeInputError: {
    borderColor: "#E74C3C",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginLeft: 6,
  },
  verifyButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "rgba(29, 185, 84, 0.6)",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  helpContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  helpText: {
    color: "#BBBBBB",
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: "#1DB954",
    fontSize: 16,
    fontWeight: "500",
  },
  resendDisabledText: {
    color: "#666666",
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  changeEmailContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  changeEmailText: {
    color: "#888888",
  },
  changeEmailLink: {
    color: "#1DB954",
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalBody: {
    padding: 24,
  },
  modalText: {
    fontSize: 15,
    color: "#BBBBBB",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  keyContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 20,
    backgroundColor: "#252525",
    borderRadius: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    paddingRight: 8,
  },
  privateKey: {
    padding: 16,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#FFFFFF",
    flex: 1,
  },
  copyButton: {
    backgroundColor: "#1DB954",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "500",
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  continueButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  copiedMessage: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: "rgba(29, 185, 84, 0.9)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  copiedText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default VerificationScreen