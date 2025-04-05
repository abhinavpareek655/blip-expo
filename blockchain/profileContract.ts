import { JsonRpcProvider, Contract } from "ethers";
import BlipProfileABI from "./BlipProfile.json";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 

let profileContract: Contract;

export const initProfileContract = async () => {
  const provider = new JsonRpcProvider("http://192.168.112.238:8545"); // adjust IP as needed
  const signer = await provider.getSigner();
  profileContract = new Contract(CONTRACT_ADDRESS, BlipProfileABI.abi, signer);
};

export const createProfile = async (
  name: string,
  email: string,
  avatar: string,
  bio: string
) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.createProfile(name, email, avatar, bio);
  console.log(`[CREATE PROFILE] Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`[CREATE PROFILE] Profile created`);
};

export const updateAvatar = async (newAvatar: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.updateAvatar(newAvatar);
  await tx.wait();
  console.log(`[AVATAR UPDATED]`);
};

export const updateBio = async (newBio: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.updateBio(newBio);
  await tx.wait();
  console.log(`[BIO UPDATED]`);
};

export const blipUser = async (targetAddress: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.blip(targetAddress);
  await tx.wait();
  console.log(`[BLIPPED] You blipped ${targetAddress}`);
};

export const unblipUser = async (targetAddress: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.unblip(targetAddress);
  await tx.wait();
  console.log(`[UNBLIPPED] You unblipped ${targetAddress}`);
};

export const addPostToProfile = async (postContractAddress: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const tx = await profileContract.addPost(postContractAddress);
  await tx.wait();
  console.log(`[POST ADDED] to profile`);
};

export const getProfile = async (user: string) => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  const result = await profileContract.getProfile(user);
  return {
    name: result[0],
    email: result[1],
    avatar: result[2],
    bio: result[3],
    createdAt: Number(result[4]),
    posts: result[5],
    blippers: result[6],
    bliping: result[7],
  };
};

export const isUserBlipping = async (from: string, to: string): Promise<boolean> => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  return await profileContract.isUserBlipping(from, to);
};

export const doesProfileExist = async (user: string): Promise<boolean> => {
  if (!profileContract) throw new Error("Profile contract not initialized");
  return await profileContract.profileExistsFor(user);
};

export const updateProfileOnChain = async (name: string, avatar: string, bio: string) => {
    if (!profileContract) throw new Error("Profile contract not initialized");
    const tx1 = await profileContract.updateAvatar(avatar);
    await tx1.wait();
    const tx2 = await profileContract.updateBio(bio);
    await tx2.wait();
    const tx3 = await profileContract.updateName(name);
    await tx3.wait();
};
  