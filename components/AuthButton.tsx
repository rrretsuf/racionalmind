import React from 'react';
import { StyleProp, ViewStyle, GestureResponderEvent, TouchableOpacity, Text, TouchableOpacityProps, TextStyle } from 'react-native';

interface AuthButtonProps extends TouchableOpacityProps {
  onPress: (event: GestureResponderEvent) => void;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
}

export default function AuthButton({ 
  onPress, 
  buttonStyle, 
  textStyle,
  activeOpacity = 0.7,
  ...rest
}: AuthButtonProps) {
  const title = "Sign up or Log in";
  const accessibilityLabel = "Sign up or Log in";

  return (
    <TouchableOpacity
      className="bg-button-secondary-bg py-4 px-6 rounded-full w-full shadow-auth-button backdrop-blur-sm border border-component-border"
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    >
      <Text 
        className="text-base text-primary text-center font-bold"
        style={textStyle}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
} 