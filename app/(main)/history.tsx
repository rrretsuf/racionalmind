import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HistoryScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-[#0F1726]">
      <View className="flex-row items-center p-4 border-b border-gray-700 mb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-lg">Back {/* Replace with Icon later */}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-white">History</Text>
      </View>

      {/* History List Placeholder */}
      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-400 text-center italic">Session history will appear here...</Text>
        {/* Add FlatList/history item components later */}
      </ScrollView>
    </SafeAreaView>
  )
} 