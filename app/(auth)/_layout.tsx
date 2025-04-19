import { Stack } from 'expo-router'
import React from 'react'

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      {/* Add other auth screens like Login/Signup modals here later */}
    </Stack>
  )
} 