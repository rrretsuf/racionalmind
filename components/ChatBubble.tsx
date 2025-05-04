import React from 'react';
import { View, Text } from 'react-native';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';

  const bubbleBaseStyle = "p-3 rounded-xl my-1 max-w-[80%]";
  const textStyle = "text-base text-primary"; 

  const userStyle = "self-end bg-[rgba(49,76,144,0.4)] border border-[#6F8DD6]";
  const aiStyle = "self-start bg-[rgba(35,56,109,0.4)] border border-[#6F8DD6]";

  return (
    <View 
      className={`${bubbleBaseStyle} ${isUser ? userStyle : aiStyle}`}
    >
      <Text className={textStyle}>{content}</Text>
    </View>
  );
};

export default ChatBubble; 