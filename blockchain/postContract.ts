import { JsonRpcProvider, Contract } from "ethers";
import BlipPostsABI from "./BlipPosts.json";

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

let postContract: Contract;

export const initPostContract = async () => {
  const provider = new JsonRpcProvider("http://192.168.112.238:8545");
  const signer = await provider.getSigner();
  postContract = new Contract(CONTRACT_ADDRESS, BlipPostsABI.abi, signer);
};

export const createPost = async (text: string, imageHash: string, isPublic: boolean) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.createPost(text, imageHash, isPublic);
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

export const addFriend = async (friendAddress: string) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.addFriend(friendAddress);
  await tx.wait();
  console.log(`[ADD FRIEND] Added friend ${friendAddress}`);
};

export const getPrivatePostsOfFriends = async () => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getPrivatePostsFromFriends(); 
};

export const getPostById = async (postId: number) => {
    if (!postContract) throw new Error("Post contract not initialized");
    return await postContract.posts(postId);
  };
  
export const getUserAvatar = (user: string) => {
    
}
