import { Stack } from 'expo-router'
import React from 'react'


export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="session" />
      <Stack.Screen name="history" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="module" />
      {/* Add other main screens like settings, module details later */}
    </Stack>
  )
}



