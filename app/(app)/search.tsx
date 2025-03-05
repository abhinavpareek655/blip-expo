"use client"

import { useState } from "react"
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Dummy data for search results
const DUMMY_SEARCH_RESULTS: SearchResultItemProps['item'][] = [
  { id: "1", type: "user", name: "alice_blockchain", avatar: "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=2048x2048&w=is&k=20&c=8QovDK9XochFpaIC-N3pn5EEaRSVuE1SKpQDVUxLSUk=" },
  { id: "2", type: "hashtag", name: "blockchain" },
  { id: "3", type: "post", content: "Just launched my new DApp!", username: "bob_crypto" },
  { id: "4", type: "user", name: "charlie_web3", avatar: "https://media.istockphoto.com/id/1285124274/photo/middle-age-man-portrait.jpg?s=2048x2048&w=is&k=20&c=bTE9WTRrEu0QmBJhr-3bqc4xO5jLpkuXFScIpSJWXRQ=" },
  { id: "5", type: "hashtag", name: "cryptocurrency" },
  { id: "6", type: "post", content: "What are your thoughts on the latest NFT trends?", username: "dave_nft" },
]

interface SearchResultItemProps {
  item: {
    id: string;
    type: "user" | "hashtag" | "post";
    name?: string;
    avatar?: string;
    content?: string;
    username?: string;
  };
  onPress: () => void;
}

const SearchResultItem = ({ item, onPress }: SearchResultItemProps) => {
  const getIcon = () => {
    switch (item.type) {
      case "user":
        return "person"
      case "hashtag":
        return "pricetag"
      case "post":
        return "document-text"
      default:
        return "help-circle"
    }
  }

  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.resultIconContainer}>
        {item.type === "user" && item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Ionicons name={getIcon()} size={24} color="#1DB954" />
        )}
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultName}>
          {item.type === "hashtag" ? "#" : ""}
          {item.name || item.username}
        </Text>
        {item.type === "post" && (
          <Text style={styles.resultSubtext} numberOfLines={1}>
            {item.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState(DUMMY_SEARCH_RESULTS)

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    // In a real app, you would make an API call here to fetch search results
    // For now, we'll just filter the dummy data
    const filteredResults = DUMMY_SEARCH_RESULTS.filter(
      (item) =>
        item.name?.toLowerCase().includes(text.toLowerCase()) ||
        item.content?.toLowerCase().includes(text.toLowerCase()) ||
        item.username?.toLowerCase().includes(text.toLowerCase()),
    )
    setSearchResults(filteredResults)
  }

  const handleResultPress = (item: SearchResultItemProps['item']) => {
    // Handle navigation to the appropriate screen based on the item type
    console.log("Pressed:", item)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users, posts, or hashtags"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={searchResults}
        renderItem={({ item }) => <SearchResultItem item={item} onPress={() => handleResultPress(item)} />}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        ListEmptyComponent={<Text style={styles.emptyResultText}>No results found</Text>}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    margin: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 10,
    borderColor: "#1E1E1E",
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 2,
  },
  emptyResultText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
})

export default SearchScreen

