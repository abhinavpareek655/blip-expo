import '../../blockchain/cryptoShim'
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';


// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function AuthLayout() {
    const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Forgot"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Varify"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={colorScheme==="dark"? "light" : "dark"} backgroundColor={colorScheme==="dark" ? '#121212': "#fff"}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
