import { FlatList, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Post from '../(post)/Post';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DUMMY_POSTS = [
    {
      id: "1",
      username: "alice_blockchain",
      avatar: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=",
      content: "Just minted my first NFT on Blip! #blockchain #nft",
      likes: 42,
      comments: 7,
      timestamp: "2h ago",
    },
    {
      id: "2",
      username: "bob_crypto",
      avatar: "https://media.istockphoto.com/id/1386479313/photo/happy-millennial-afro-american-business-woman-posing-isolated-on-white.jpg?s=2048x2048&w=is&k=20&c=JecbHiBxM7ZzAADbPkqJuvNoCs3uO2VrK2LmrSpm3Ek=",
      content: "Thoughts on the latest decentralized finance protocols? 🤔 #defi #crypto",
      likes: 31,
      comments: 15,
      timestamp: "4h ago",
    },
    {
      id: "3",
      username: "charlie_web3",
      avatar: "https://media.istockphoto.com/id/1285124274/photo/middle-age-man-portrait.jpg?s=2048x2048&w=is&k=20&c=bTE9WTRrEu0QmBJhr-3bqc4xO5jLpkuXFScIpSJWXRQ=",
      content: "Building the future of social media on the blockchain! 🚀 #web3 #decentralized",
      likes: 89,
      comments: 23,
      timestamp: "6h ago",
    },
  ]

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Blip</Text>
        </View>
        <View style={styles.feed}>
          <Post post={DUMMY_POSTS[0]}></Post>
          <Post post={DUMMY_POSTS[1]}></Post>
          <Post post={DUMMY_POSTS[2]}></Post>
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
    },
    header: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#2C2C2C",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#ffffff",
    },
    feed: {
      flex: 1,
    },
  })