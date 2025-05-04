import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChangeText, onSend, isLoading, ...rest }) => {
  return (
    <View className="flex-row items-center bg-input-bg border border-input-border rounded-xl p-2 py-3">
      <TextInput
        className="flex-1 text-primary text-base px-2 mr-2"
        placeholderTextColor="#7784A5"
        value={value}
        onChangeText={onChangeText}
        multiline
        blurOnSubmit={false}
        {...rest}
      />
      <TouchableOpacity onPress={onSend} disabled={isLoading || value.trim().length === 0}>
        <View className={`p-2 rounded-full bg-white/20`}>
          <Ionicons 
            name={isLoading ? "square" : "arrow-up"}
            size={20} 
            color={'#FFFFFF'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput; 