import { JsonRpcProvider, Contract } from "ethers";
import BlipPostsABI from "./BlipPosts.json";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_POST_CONTRACT!;
const PROVIDER_URL = process.env.EXPO_PUBLIC_RPC_URL!;

let postContract: Contract;

export const initPostContract = async () => {
  const provider = new JsonRpcProvider(PROVIDER_URL);
  const signer = await provider.getSigner();
  postContract = new Contract(CONTRACT_ADDRESS, BlipPostsABI.abi, signer);
};

export const createPost = async (text: string, isPublic: boolean) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.createPost(text, isPublic);
  console.log("[CREATE POST] Tx sent:", tx.hash);
  await tx.wait();
  console.log("[CREATE POST] Post created");
};

export const likePost = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.likePost(postId);
  await tx.wait();
  console.log(`[LIKE POST] Post ${postId} liked`);
};

export const commentOnPost = async (postId: number, comment: string) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.commentOnPost(postId, comment);
  await tx.wait();
  console.log(`[COMMENT] Comment added to post ${postId}`);
};

export const sharePost = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.sharePost(postId);
  await tx.wait();
  console.log(`[SHARE POST] Post ${postId} shared`);
};

export const getUserPosts = async (user: string): Promise<number[]> => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getUserPosts(user);
};

export const getComments = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getComments(postId);
};

export const getLikes = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getLikes(postId);
};

export const getPostById = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.posts(postId);
};
