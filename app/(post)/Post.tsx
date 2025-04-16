import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { generateAvatarUrl } from '../../blockchain/genAvatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JsonRpcProvider, Wallet } from 'ethers';
import { initPostContract, likePost } from '../../blockchain/postContract';
import { addFriend } from '../../blockchain/profileContract';

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

  const avatarUrl = generateAvatarUrl(post.owner.address);

  const handleLike = async () => {
    if (liked) return;
    try {
      const storedPrivateKey = await AsyncStorage.getItem('walletPrivateKey');
      if (!storedPrivateKey) throw new Error("Wallet not found");
  
      const provider = new JsonRpcProvider(process.env.EXPO_PUBLIC_RPC_URL);
      const userWallet = new Wallet(storedPrivateKey).connect(provider);
  
      await initPostContract(userWallet);
  
      const numericPostId = parseInt(post.id, 10);
      if (isNaN(numericPostId)) {
        console.error("Invalid post ID:", post.id);
        throw new Error("Invalid post ID");
      }
  
      await likePost(numericPostId);
      setLiked(true);
      setLikeCount(likeCount + 1);
    } catch (error) {
      console.error("Error liking post:", error);
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
    if (friendAdded) return;
    try {
      await addFriend(post.owner.address);
      setFriendAdded(true);
      if (onAddFriend) onAddFriend(post.owner.address);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.username}>{post.name}</Text>
          <Text style={styles.email}>{post.email}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.divider} />

      <View style={styles.postActions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          {liked ? (
            <AntDesign name="like1" size={24} color="white" />
          ) : (
            <AntDesign name="like2" size={24} color="white" />
          )}
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
          <FontAwesome name="comment-o" size={24} color="white" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAddFriend} style={styles.actionButton}>
          <FontAwesome5
            name="user-friends"
            size={24}
            color={friendAdded ? "#1DB954" : "white"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#252525',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#333333',
  },
  username: {
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 16,
  },
  email: {
    color: '#BBBBBB',
    fontSize: 13,
    marginTop: 2,
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
    },
  postContent: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    color: "#ffffff",
    marginLeft: 5,
    fontSize: 14,
  },
});
