import 'react-native-get-random-values';
import { JsonRpcProvider, Contract, keccak256, toUtf8Bytes, Wallet } from "ethers";
import AuthABI from "./BlipAuth.json";
import { ethers } from "ethers";
import ProfileABI from "./BlipProfile.json";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_AUTH_CONTRACT!;
const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL!;
const PROFILE_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_PROFILE_CONTRACT!;

let provider: JsonRpcProvider;
let readOnlyContract: Contract;

/**
 * Initializes the provider and read-only contract instance.
 */
export const initContract = async () => {
  provider = new JsonRpcProvider(RPC_URL);
  readOnlyContract = new Contract(CONTRACT_ADDRESS, AuthABI.abi, provider);
  console.log("[CONTRACT] Initialized provider and read-only contract");
};

/**
 * Creates a new random wallet (Wallet) and connects it to the provider.
 */
export const createUserWallet = (): Wallet => {
  const wallet = ethers.Wallet.createRandom().connect(provider) as unknown as Wallet;
  console.log("[WALLET] New wallet created:", wallet.address);
  return wallet;
};

/**
 * Write function: Sign up user using the provided wallet.
 */
export const signupOnChain = async (wallet: Wallet, email: string, password: string) => {
  const walletSignerContract = new Contract(CONTRACT_ADDRESS, AuthABI.abi, wallet);
  const normalizedEmail = email.trim().toLowerCase();
  console.log("[SIGNUP] Preparing to sign up user:", normalizedEmail);

  const tx = await walletSignerContract.signup(normalizedEmail, password.trim());
  console.log("[SIGNUP] Transaction sent. Hash:", tx.hash);
  await tx.wait();
  console.log("[SIGNUP] Transaction confirmed.");
};

/**
 * Write function: Create user profile using the provided wallet.
 */
export const createProfileOnChain = async (
  wallet: Wallet,
  name: string,
  email: string,
  bio: string
) => {
  const walletSignerContract = new Contract(PROFILE_CONTRACT_ADDRESS, ProfileABI.abi, wallet);
  const normalizedEmail = email.trim().toLowerCase();
  console.log("[PROFILE] Creating profile for:", normalizedEmail);

  const tx = await walletSignerContract.createProfile(name, normalizedEmail, bio);
  console.log("[PROFILE] Transaction sent. Hash:", tx.hash);
  await tx.wait();
  console.log("[PROFILE] Profile creation confirmed.");
};

/**
 * Signer-based login function.
 * Verifies user credentials using msg.sender from the provided wallet.
 */
export const loginOnChain = async (
  email: string,
  password: string,
  wallet: Wallet
): Promise<boolean> => {
  if (!wallet || !wallet.provider) {
    throw new Error("Signer wallet not connected to provider");
  }

  const signerContract = new Contract(CONTRACT_ADDRESS, AuthABI.abi, wallet);
  const normalizedEmail = email.trim().toLowerCase();

  console.log("[LOGIN] Verifying credentials for:", normalizedEmail);

  try {
    const isValid = await signerContract.login(normalizedEmail, password.trim());
    console.log("[LOGIN] Result:", isValid);
    return isValid;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    throw err;
  }
};

/**
 * Read-only function: Get wallet address associated with hashed email.
 */
export const getWalletFromEmail = async (email: string): Promise<string> => {
  if (!readOnlyContract) throw new Error("Contract not initialized");

  const normalizedEmail = email.trim().toLowerCase();
  const emailHash = keccak256(toUtf8Bytes(normalizedEmail));
  return await readOnlyContract.getUserByEmailHash(emailHash);
};
