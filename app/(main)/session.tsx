import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SessionScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-[#0F1726]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust as needed
      >
        <View className="flex-row items-center p-4 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-white text-lg">Back</Text> {/* Replace with Icon later */}
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-white">Session</Text>
        </View>

        {/* Message List Placeholder */}
        <ScrollView className="flex-1 p-4">
          <Text className="text-gray-400 text-center italic">Message history will appear here...</Text>
          {/* Add FlatList/message components later */}
        </ScrollView>

        {/* Input Area Placeholder */}
        <View className="flex-row items-center p-4 border-t border-gray-700">
          <TextInput
            className="flex-1 bg-gray-700 text-white rounded-lg p-3 mr-3 border border-gray-600"
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            editable={false} // Non-functional for now
          />
          <TouchableOpacity className="bg-blue-600 rounded-lg p-3" disabled>
            <Text className="text-white font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
} 