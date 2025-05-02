import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent, TouchableOpacity, Text, TouchableOpacityProps, TextStyle } from 'react-native';

interface StartSessionButtonProps extends TouchableOpacityProps {
  onPress: (event: GestureResponderEvent) => void;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
}

export default function StartSessionButton({ 
  onPress, 
  buttonStyle, 
  textStyle,
  activeOpacity = 0.7,
  ...rest
}: StartSessionButtonProps) {
  const title = "Start a New Session";
  const accessibilityLabel = "Start a new session";

  return (
    <TouchableOpacity
      className="bg-blue-600 rounded-full py-4 mx-2 shadow-start-session-glow"
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      {...rest}
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