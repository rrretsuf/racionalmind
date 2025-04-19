import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import React, { useState } from 'react'
import { signInWithEmail, signUpWithEmail, signInWithApple } from '../../services/auth'
import { useRouter } from 'expo-router'

export default function Welcome() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithEmail(email, password, router)
      if (error) {
        Alert.alert('Sign In Error', error.message)
      }
    } catch (e: any) {
      Alert.alert('Sign In Error', e?.message ?? 'An unexpected error occurred.')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    try {
      const { error } = await signUpWithEmail(email, password, router)
      if (error) {
        Alert.alert('Sign Up Error', error.message)
      }
    } catch (e: any) {
      Alert.alert('Sign Up Error', e?.message ?? 'An unexpected error occurred.')
    }
    setLoading(false)
  }

  const handleAppleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithApple(router)
      if (error && error.message !== 'User cancelled Apple signin') {
        Alert.alert('Apple Sign In Error', error.message)
      }
    } catch (e: any) {
      Alert.alert('Apple Sign In Error', e?.message ?? 'An unexpected error occurred.')
    }
    setLoading(false)
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#0F1726] p-4">
      <Text className="text-3xl font-bold text-white mb-8">Welcome to Inner</Text>

      <TextInput
        className="w-full bg-gray-700 text-white rounded-lg p-3 mb-3 border border-gray-600"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="w-full bg-gray-700 text-white rounded-lg p-3 mb-6 border border-gray-600"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" className="mb-4" />
      ) : (
        <>
          <TouchableOpacity
            className="w-full bg-blue-600 rounded-lg p-4 mb-3 items-center"
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-green-600 rounded-lg p-4 mb-6 items-center"
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-black rounded-lg p-4 items-center border border-gray-400"
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">Sign In with Apple</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
} 