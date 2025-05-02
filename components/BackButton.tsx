import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  color?: string;
  size?: number;
}

export default function BackButton({ color = "#FFFFFF", size = 28 }: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.back()} className="p-2">
      <Ionicons name="chevron-back" size={size} color={color} />
    </TouchableOpacity>
  );
} 