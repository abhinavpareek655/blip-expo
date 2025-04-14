import { Contract, Wallet } from "ethers";
import BlipProfileABI from "./BlipProfile.json";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_PROFILE_CONTRACT!;

let profileContract: Contract;

/**
 * Initializes the profile contract instance using the supplied user wallet.
 * @param wallet - The user’s Wallet used to sign on-chain transactions.
 */
export const initProfileContract = async (wallet: Wallet) => {
  if (!wallet) {
    throw new Error("A funded wallet is required to initialize the Profile contract");
  }
  profileContract = new Contract(CONTRACT_ADDRESS, BlipProfileABI.abi, wallet);
};

export const createProfile = async (
  name: string,
  email: string,
  bio: string
) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.createProfile(name, email, bio);
  console.log(`[CREATE PROFILE] Tx sent: ${tx.hash}`);
  await tx.wait();
};

export const updateBio = async (newBio: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.updateBio(newBio);
  await tx.wait();
};

export const updateName = async (newName: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.updateName(newName);
  await tx.wait();
};

export const updateProfileOnChain = async (name: string, bio: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx1 = await profileContract.updateBio(bio);
  await tx1.wait();
  const tx2 = await profileContract.updateName(name);
  await tx2.wait();
};

export const addFriend = async (friendAddress: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.addFriend(friendAddress);
  await tx.wait();
};

export const removeFriend = async (friendAddress: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.removeFriend(friendAddress);
  await tx.wait();
};

export const isFriend = async (user1: string, user2: string): Promise<boolean> => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  return await profileContract.isFriend(user1, user2);
};

export const addTextPost = async (text: string, isPublic: boolean) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.addPost(text, isPublic);
  console.log(`[ADD POST] Tx sent: ${tx.hash}`);
  await tx.wait();
};

export const getProfile = async (wallet: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const result = await profileContract.getProfile(wallet);
  return {
    name: result[0],
    email: result[1],
    bio: result[2],
    wallet: result[3],
    createdAt: Number(result[4]),
    posts: result[5].map((p: any) => ({
      text: p.text,
      timestamp: Number(p.timestamp),
      isPublic: p.isPublic,
    })),
  };
};

export const getProfileByEmail = async (email: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const result = await profileContract.getProfileByEmail(email);
  return {
    name: result[0],
    email: result[1],
    bio: result[2],
    wallet: result[3],
    createdAt: Number(result[4]),
    posts: result[5].map((p: any) => ({
      text: p.text,
      timestamp: Number(p.timestamp),
      isPublic: p.isPublic,
    })),
  };
};

export const getFriends = async (wallet: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  return await profileContract.getFriends(wallet);
};

export const getFriendsWithProfiles = async (wallet: string) => {
  const friends = await getFriends(wallet);
  const profiles = await Promise.all(friends.map(getProfile));
  return profiles;
};
