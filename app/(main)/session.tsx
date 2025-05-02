import { View, ScrollView, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '../../components/BackButton';
import ChatInput from '../../components/ChatInput';


export default function SessionScreen() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim().length > 0) {
      console.log('Sending:', message)
      setMessage('')
    }
  }

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


          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
          </ScrollView>


          <View className="p-4">
            <ChatInput 
              message={message}
              setMessage={setMessage}
              onSend={handleSend}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  )
}

