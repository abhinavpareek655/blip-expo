import { JsonRpcProvider, Contract, keccak256, toUtf8Bytes } from "ethers";
import AuthABI from "./BlipAuth.json";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_AUTH_CONTRACT!;
const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL!;

let provider: JsonRpcProvider;
let signerContract: Contract;
let readOnlyContract: Contract;

/**
 * Initializes both signer-based and read-only contracts
 */
export const initContract = async () => {
  provider = new JsonRpcProvider(RPC_URL);

  const signer = await provider.getSigner();
  signerContract = new Contract(CONTRACT_ADDRESS, AuthABI.abi, signer);
  readOnlyContract = new Contract(CONTRACT_ADDRESS, AuthABI.abi, provider);

  console.log("[CONTRACT] Initialized signer and read-only contract");
};

/**
 * Write function: Sign up user (writes to chain)
 */
export const signupOnChain = async (email: string, password: string) => {
  if (!signerContract) throw new Error("Signer contract not initialized");

  const normalizedEmail = email.trim().toLowerCase();
  console.log("[SIGNUP] Preparing to signup user:", normalizedEmail);

  const tx = await signerContract.signup(normalizedEmail, password.trim());
  console.log("[SIGNUP] Transaction sent. Hash:", tx.hash);
  await tx.wait();
  console.log("[SIGNUP] Transaction confirmed.");
};

/**
 * Read-only function: Log in (reads from chain)
 */
export const loginOnChain = async (email: string, password: string): Promise<boolean> => {
  if (!readOnlyContract) throw new Error("Read-only contract not initialized");

  const normalizedEmail = email.trim().toLowerCase();
  console.log("[LOGIN] Verifying credentials for:", normalizedEmail);

  try {
    const isValid = await readOnlyContract.login(normalizedEmail, password.trim());
    console.log("[LOGIN] Result:", isValid);
    return isValid;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    throw err;
  }
};

/**
 * Get wallet address associated with hashed email
 */
export const getWalletFromEmail = async (email: string): Promise<string> => {
  if (!readOnlyContract) throw new Error("Contract not initialized");

  const emailHash = keccak256(toUtf8Bytes(email.trim().toLowerCase()));
  return await readOnlyContract.getUserByEmailHash(emailHash);
};
