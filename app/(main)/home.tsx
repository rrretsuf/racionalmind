import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Home() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-[#0F1726] p-4">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-semibold text-white">Welcome Back!</Text>
        {/* Placeholder for icons */}
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={() => router.push('./history')}>
            <Text className="text-white text-lg">History {/* Replace with Icon later */}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('./profile')}>
            <Text className="text-white text-lg">Profile {/* Replace with Icon later */}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg p-4 mb-6 items-center"
        onPress={() => router.push('./session')}
      >
        <Text className="text-white font-semibold text-lg">Start New Session</Text>
      </TouchableOpacity>

      <Text className="text-xl font-semibold text-white mb-3">Modules</Text>
      <ScrollView>
        {/* Placeholder Modules */}
        <View className="bg-gray-700 p-4 rounded-lg mb-3">
          <Text className="text-white">Module 1 Placeholder</Text>
        </View>
        <View className="bg-gray-700 p-4 rounded-lg mb-3">
          <Text className="text-white">Module 2 Placeholder</Text>
        </View>
        <View className="bg-gray-700 p-4 rounded-lg mb-3">
          <Text className="text-white">Module 3 Placeholder</Text>
        </View>
        {/* Add more later */}
      </ScrollView>
    </SafeAreaView>
  )
}
