import { View, Text, TouchableOpacity, Alert, ImageBackground } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { signOut } from '../../services/auth'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'
import { Ionicons } from '@expo/vector-icons'
import BackButton from '../../components/BackButton'


export default function ProfileScreen() {
  const router = useRouter()
  useAuth()

  const handleSignOut = async () => {
    const { error } = await signOut(router)
    if (error) {
      Alert.alert('Sign Out Error', error.message ?? 'Could not sign out. Please try again.')
    }
  }

  const handleSettings = () => {
    // todo
  }


  return (
    <ImageBackground
      source={require('../../assets/images/background-other.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1 items-center pt-4 pb-8 px-6">
        <View className="w-full flex-row justify-start mb-6">
          <BackButton />
        </View>


        <View className="w-36 h-36 rounded-full bg-button-secondary-bg justify-center items-center mb-4">
          <Ionicons name="person-outline" size={72} color="rgba(255, 255, 255, 0.7)" />
        </View>


        <Text className="text-h3 font-medium text-primary mb-16">
        Filip
        </Text>


        <View className="w-full bg-transparent border border-profile-card-border rounded-standard p-4 mb-6 min-h-[120px]">
          <Text className="text-base font-semibold text-primary mb-6 text-left">Psychological Profile</Text>
          <Text className="text-sm font-regular text-placeholder-light text-center">Your profile will appear here</Text>
        </View>


        <View className="w-full bg-transparent border border-profile-card-border rounded-standard p-4 mb-10 min-h-[120px]">
          <Text className="text-base font-semibold text-primary mb-6 text-left">Journey</Text>
          <Text className="text-sm font-regular text-placeholder-light text-center">Your journey visualization will appear here</Text>
        </View>


        <View className="w-full">
          <TouchableOpacity
            className="w-full bg-settings-btn-bg rounded-lg py-4 items-center mb-4"
            onPress={handleSettings}
          >
            <Text className="text-base font-semibold text-primary">Settings</Text>
          </TouchableOpacity>


          <TouchableOpacity
            className="w-full bg-logout-btn-bg rounded-lg py-4 flex-row items-center justify-center"
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" className="mr-2" />
            <Text className="text-base font-semibold text-primary">Log out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

