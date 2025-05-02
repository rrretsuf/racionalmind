import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import AuthButton from '../../components/AuthButton';


export default function WelcomeScreen() {
  const router = useRouter();


  const handlePress = () => {
    router.push('/(main)/home');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background-welcome.png')}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 items-center p-8 bg-black/40">
        <View className="flex-1 w-full justify-center -mt-20">
          <View className="items-start w-full">
            <Text className="text-title text-primary font-medium">
              Welcome to
            </Text>
            <Text className="text-title text-primary font-medium">
              Inner
            </Text>
            <Text className="text-base text-secondary font-regular mt-6 leading-relaxed max-w-[300px]">
              Start your mental strength journey in a secure, personalized, safe space.
            </Text>
          </View>
        </View>

        <View className="w-full mb-20">
          <AuthButton
            onPress={handlePress}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

