import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';


interface PostProps {
  post: {
    id: string;
    username: string;
    avatar: string;
    content: string;
    likes: number;
    comments: number;
    timestamp: string;
  };
}

export default function Post({ post }: PostProps) {
  const [liked, setLiked] = useState(false)
  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionButton}>
          {liked? <AntDesign name="like1" size={24} color="white" />:<AntDesign name="like2" size={24} color="white" />}
          <Text style={styles.actionText}>{liked? post.likes+1 : post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="comment-o" size={24} color="white" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <AntDesign name="sharealt" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    postContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#2C2C2C",
      },
      postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
      },
      avatar: {
        backgroundColor: "#333",
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
      },
      username: {
        fontWeight: "bold",
        color: "#ffffff",
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
      },  
})