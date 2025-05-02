import { View, KeyboardAvoidingView, ImageBackground, Platform } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '../../components/BackButton'

export default function HistoryScreen() {

  return (
<ImageBackground
      source={require('../../assets/images/background-other.png')}
      className="flex-1"
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View className="p-4 flex-row justify-start items-center">
            <BackButton />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  )
}

