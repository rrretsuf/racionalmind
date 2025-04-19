import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { signOut } from '../../services/auth'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const handleSignOut = async () => {
    const { error } = await signOut(router)
    if (error) {
      Alert.alert('Sign Out Error', error.message ?? 'Could not sign out. Please try again.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0F1726]">
      <View className="flex-row items-center p-4 border-b border-gray-700 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-lg">Back {/* Replace with Icon later */}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-white">Profile</Text>
      </View>

      <View className="items-center px-4">
        {/* Avatar Placeholder */}
        <View className="w-24 h-24 bg-gray-600 rounded-full mb-4 justify-center items-center">
          <Text className="text-gray-400">Avatar</Text>
        </View>

        {/* Username Placeholder */}
        <Text className="text-white text-lg mb-8">
          {user?.email ?? 'Loading user...'}
        </Text>

        {/* Logout Button */}
        <TouchableOpacity
          className="w-full bg-red-600 rounded-lg p-4 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold text-lg">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
} 