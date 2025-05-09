import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import StartSessionButton from '../../components/StartSessionButton';
import ModuleCard from '../../components/ModuleCard';
import { supabase } from '@/utils/supabaseClient'


export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const userName = "Filip"

  useFocusEffect(
    useCallback(() => {
      setIsLoading(false);
      return () => {};
    }, [])
  );

  const handleStartSession = async () => {
    if (isLoading) return
    setIsLoading(true)

    router.push({ pathname: '/(main)/session', params: { sessionId: 'pending' } });

    try {
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !authSession) {
        console.error("Auth session error in handleStartSession:", sessionError);
        try { router.setParams({ sessionId: 'error' }); } catch (e) { console.warn("Could not set params for error state during rapid nav", e); }
        setIsLoading(false)
        return
      }
      const accessToken = authSession.access_token
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      if (response.ok && result.sessionId) {
        try { router.setParams({ sessionId: result.sessionId }); } catch (e) { console.warn("Could not set params for session ID during rapid nav", e); }
      } else {
        console.error("Failed to create session in background:", result.error);
        try { router.setParams({ sessionId: 'error' }); } catch (e) { console.warn("Could not set params for error state during rapid nav", e); }
      }
    } catch (e) {
      console.error("Exception in handleStartSession (background):", e);
      try { router.setParams({ sessionId: 'error' }); } catch (e) { console.warn("Could not set params for error state during rapid nav", e); }
    }
  }

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
          onPress={handleStartSession}
          isLoading={isLoading}
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



