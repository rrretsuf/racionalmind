import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import StartSessionButton from '../../components/StartSessionButton';
import ModuleCard from '../../components/ModuleCard';


export default function Home() {
  const router = useRouter()

  const userName = "Filip"

  return (
    <ImageBackground
      source={require('../../assets/images/background-home.png')}
      className="flex-1"
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row justify-end items-center mb-24">
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => router.push('/(main)/history')}
              className="w-10 h-10 rounded-full bg-button-secondary-bg border border-component-border items-center justify-center mr-1"
              accessibilityLabel="View History"
            >
              {/* <ClockIcon size={24} color="#FFFFFF" /> */}
              <Text className="text-primary text-sm">H</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(main)/profile')}
              className="w-10 h-10 rounded-full bg-button-secondary-bg border border-component-border items-center justify-center ml-1"
              accessibilityLabel="View Profile"
            >
              {/* <UserCircleIcon size={24} color="#FFFFFF" /> */}
               <Text className="text-primary text-sm">P</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Greeting */}
        <View className="mb-24">
          <Text className="text-h2 text-primary font-medium">
            Good Morning {userName}
          </Text>
          <Text className="text-h2 text-secondary font-medium">
            How are you feeling today?
          </Text>
        </View>


        {/* Start Session Button - Replace with component */}
        <StartSessionButton
          onPress={() => router.push('/(main)/session')}
        />


        {/* Spacer to push modules down */}
        <View className="flex-1" />


        {/* Modules Section */}
        <View className="pb-16">
          <Text className="text-h3 text-primary font-medium mb-4">Modules</Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            className="flex-grow -mx-6 px-6"
          >
            <ModuleCard />
            <ModuleCard />
            <ModuleCard />
            <ModuleCard />
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}



