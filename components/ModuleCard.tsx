import React from 'react';
import { View, ViewProps } from 'react-native';

interface ModuleCardProps extends ViewProps {}

export default function ModuleCard({ style, ...rest }: ModuleCardProps) {
  return (
    <View 
      className="w-40 h-56 bg-transparent border border-component-border rounded-standard mr-4"
      style={style}
      {...rest}
    >
      {/* Content of the card will go here */}
    </View>
  );
} 