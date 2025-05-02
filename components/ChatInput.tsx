import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps extends TextInputProps {
  message: string;
  setMessage: (text: string) => void;
  onSend: () => void;
}

export default function ChatInput({ message, setMessage, onSend, ...rest }: ChatInputProps) {
  const isSendDisabled = message.trim().length === 0;

  return (
    <View className="flex-row items-center bg-input-field border border-input-border rounded-full pl-4 pr-2 py-2"> 
      <TextInput
        className="flex-1 text-base text-text-primary font-regular py-2 mr-2"
        placeholder="What is on your mind..."
        placeholderTextColor="#7784A5"
        value={message}
        onChangeText={setMessage}
        multiline
        style={{ textAlignVertical: 'center' }} 
        {...rest}
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={isSendDisabled}
        className={`w-10 h-10 rounded-full bg-primary justify-center items-center ml-1 ${isSendDisabled ? 'opacity-50' : ''}`}
        accessibilityLabel="Send message"
      >
        <Ionicons name="arrow-up" size={22} color="#18274D" />
      </TouchableOpacity>
    </View>
  );
} 