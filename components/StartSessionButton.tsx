import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent, TouchableOpacity, Text, TouchableOpacityProps, TextStyle } from 'react-native';

interface StartSessionButtonProps extends TouchableOpacityProps {
  onPress: (event: GestureResponderEvent) => void;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  isLoading?: boolean;
}

export default function StartSessionButton({ 
  onPress, 
  textStyle,
  activeOpacity = 0.7,
  isLoading = false,
}: StartSessionButtonProps) {
  const title = "Start a New Session";

  return (
    <TouchableOpacity
      className="bg-blue-600 rounded-full py-4 mx-2 mb-[60px] shadow-start-session-glow"
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={isLoading}
    >
      <Text 
        className="text-base text-primary font-semibold text-center"
        style={textStyle}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
} 