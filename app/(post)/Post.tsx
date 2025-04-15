import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// Import our custom avatar generator.
import { generateAvatarUrl } from '../../blockchain/genAvatar';

interface PostOwner {
  address: string;
  isFriend: boolean;
}

interface PostData {
  owner: PostOwner;
  name: string;       // Username of the post's owner
  email: string;      // Email of the post's owner
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface PostProps {
  post: PostData;
  onAddFriend?: () => void;
}

export default function Post({ post, onAddFriend }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [friendAdded, setFriendAdded] = useState(post.owner.isFriend);

  // Generate avatar URL using the owner's wallet address.
  const avatarUrl = generateAvatarUrl(post.owner.address);

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
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionButton}>
          {liked ? (
            <AntDesign name="like1" size={24} color="white" />
          ) : (
            <AntDesign name="like2" size={24} color="white" />
          )}
          <Text style={styles.actionText}>{liked ? post.likes + 1 : post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="comment-o" size={24} color="white" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setFriendAdded(!friendAdded);
            if (onAddFriend) onAddFriend();
          }}
          style={styles.actionButton}
        >
          {friendAdded ? (
            <FontAwesome5 name="user-friends" size={24} color="#1DB954" />
          ) : (
            <FontAwesome5 name="user-friends" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
    backgroundColor: "#1E1E1E",
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
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 16,
  },
  email: {
    color: "#ccc",
    fontSize: 12,
  },
  timestamp: {
    color: "#888",
    fontSize: 12,
  },
  postContent: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 10,
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
