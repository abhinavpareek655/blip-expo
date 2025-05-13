import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { generateAvatarUrl } from '../../blockchain/genAvatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JsonRpcProvider, Wallet } from 'ethers';
import { initPostContract, likePost } from '../../blockchain/postContract';
import { addFriend } from '../../blockchain/profileContract';
import { ethers } from 'ethers';

interface PostOwner {
  address: string;
  isFriend: boolean;
}

export interface PostData {
  id: string;
  owner: PostOwner;
  name: string;
  email: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface PostProps {
  post: PostData;
  onAddFriend?: (friendAddress: string) => void;
  onComment?: (post: PostData) => void;
}

export default function Post({ post, onAddFriend, onComment }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [friendAdded, setFriendAdded] = useState(post.owner.isFriend);
  const [isLoading, setIsLoading] = useState(false);
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const friendAnimation = useRef(new Animated.Value(1)).current;

  const avatarUrl = generateAvatarUrl(post.owner.address);

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFriend = () => {
    Animated.sequence([
      Animated.timing(friendAnimation, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(friendAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

 const handleLike = async () => {
  if (liked || isLoading) return;
  
  animateLike();
  setIsLoading(true);
  
  try {
    const storedPrivateKey = await AsyncStorage.getItem('walletPrivateKey');
    if (!storedPrivateKey) throw new Error("Wallet not found");

    const provider = new ethers.JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
    const userWallet = new ethers.Wallet(storedPrivateKey, provider);

    // Convert post ID safely
    const numericPostId = Number(post.id);
    console.log("Post ID:", numericPostId);
    if (numericPostId < 0) {
      throw new Error("Invalid post ID");
    }

    await initPostContract(userWallet);
    
    // Get the transaction response

    const tx = await likePost(numericPostId);
    console.log("Transaction hash:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error("Transaction failed");

    setLiked(true);
    setLikeCount(prev => prev + 1);

  } catch (error) {
    console.error("Like error:", error);
    
    let errorMessage = "Failed to like post";
    if (error instanceof Error) {
      if (error.message.includes("Invalid post ID")) {
        errorMessage = "Invalid post";
      } else if (error.message.includes("Already liked")) {
        errorMessage = "You already liked this post";
      } else if (error.message.includes("rejected")) {
        errorMessage = "Transaction rejected";
      }
    }

    Alert.alert("Error", errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  
  const handleComment = () => {
    if (onComment) {
      onComment(post);
    } else {
      console.log("Comment button pressed for post", post.id);
    }
  };

  const handleAddFriend = async () => {
    if (friendAdded || isLoading) return;
    
    animateFriend();
    setIsLoading(true);
    
    try {
      await addFriend(post.owner.address);
      setFriendAdded(true);
      if (onAddFriend) onAddFriend(post.owner.address);
    } catch (error) {
      console.error("Error adding friend:", error);
      Alert.alert("Error", "Failed to add friend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Pressable style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </Pressable>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.username}>{post.name || 'Anonymous'}</Text>
          <Text style={styles.email}>{post.email}</Text>
          <View style={styles.timestampContainer}>
            <Ionicons name="time-outline" size={12} color="#888888" style={styles.timeIcon} />
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#BBBBBB" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.postContent}>{post.content}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.postActions}>
        <TouchableOpacity 
          onPress={handleLike} 
          style={styles.actionButton}
          disabled={liked || isLoading}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
            {liked ? (
              <Ionicons name="heart" size={22} color="#E74C3C" />
            ) : (
              <Ionicons name="heart-outline" size={22} color="#BBBBBB" />
            )}
          </Animated.View>
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleComment} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#BBBBBB" />
          <Text style={styles.actionText}>
            {post.comments > 0 ? post.comments : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleAddFriend} 
          style={styles.actionButton}
          disabled={friendAdded || isLoading}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: friendAnimation }] }}>
            {friendAdded ? (
              <Ionicons name="person-add" size={20} color="#1DB954" />
            ) : (
              <Ionicons name="person-add-outline" size={20} color="#BBBBBB" />
            )}
          </Animated.View>
          <Text style={[styles.actionText, friendAdded && styles.friendAddedText]}>
            {friendAdded ? 'Friend' : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={20} color="#BBBBBB" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  avatarContainer: {
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#252525',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1DB954',
  },
  username: {
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 16,
  },
  email: {
    color: '#BBBBBB',
    fontSize: 13,
    marginTop: 1,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeIcon: {
    marginRight: 4,
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postContent: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#252525',
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    color: "#BBBBBB",
    marginLeft: 6,
    fontSize: 14,
    minWidth: 16,
  },
  likedText: {
    color: "#E74C3C",
  },
  friendAddedText: {
    color: "#1DB954",
  },
});