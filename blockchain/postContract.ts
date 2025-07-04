import { Contract, Signer, ethers } from "ethers";
import BlipPostsABI from "./BlipPosts.json";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_POST_CONTRACT!;

let postContract: Contract;

/**
 * Initializes the posts contract instance using the user’s wallet.
 *
 * @param wallet - The user’s Wallet which was used to create their profile.
 */
export const initPostContract = async (signer: Signer) => {
  postContract = new Contract(CONTRACT_ADDRESS, BlipPostsABI.abi, signer);
};

/**
 * Creates a post.
 *
 * @param text - The post text.
 * @param isPublic - Whether the post is public.
 */
export const createPost = async (text: string, isPublic: boolean) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.createPost(text, isPublic);
  console.log("[CREATE POST] Tx sent:", tx.hash);
  return tx.wait();
  // console.log("[CREATE POST] Post created");
};

/**
 * Likes a post.
 *
 * @param postId - The ID of the post to like.
 */
export const likePost = async (postId: number): Promise<ethers.ContractTransactionResponse> => {
  if (!postContract) throw new Error("Post contract not initialized");
  console.log(`[LIKE POST] Post ${postId} liked`);
  return postContract.likePost(postId);
};

/**
 * Comments on a post.
 *
 * @param postId - The ID of the post.
 * @param comment - The comment text.
 */
export const commentOnPost = async (postId: number, comment: string) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.commentOnPost(postId, comment);
  await tx.wait();
  console.log(`[COMMENT] Comment added to post ${postId}`);
};

/**
 * Shares a post.
 *
 * @param postId - The ID of the post to share.
 */
export const sharePost = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  const tx = await postContract.sharePost(postId);
  await tx.wait();
  console.log(`[SHARE POST] Post ${postId} shared`);
};

/**
 * Retrieves the list of post IDs associated with a user.
 *
 * @param user - The address of the user.
 * @returns A promise that resolves to an array of post IDs.
 */
export const getUserPosts = async (user: string): Promise<number[]> => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getUserPosts(user);
};

/**
 * Retrieves the comments for a given post.
 *
 * @param postId - The ID of the post.
 * @returns A promise that resolves to the comments.
 */
export const getComments = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getComments(postId);
};

/**
 * Retrieves the likes for a given post.
 *
 * @param postId - The ID of the post.
 * @returns A promise that resolves to the likes.
 */
export const getLikes = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.getLikes(postId);
};

/**
 * Retrieves the post details by ID.
 *
 * @param postId - The ID of the post.
 * @returns A promise that resolves to the post data.
 */
export const getPostById = async (postId: number) => {
  if (!postContract) throw new Error("Post contract not initialized");
  return await postContract.posts(postId);
};
