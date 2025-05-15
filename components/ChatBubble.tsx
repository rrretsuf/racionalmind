import React from 'react';
import { View, Text, Linking, StyleSheet, Platform } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { logger } from '@/utils/logger';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
}

const markdownStyles = StyleSheet.create({
  // General Text
  text: {
    color: '#FFFFFF', // primary
    fontSize: 18, // base
    lineHeight: 24, // base
  },
  strong: {
    color: '#FFFFFF', // primary
    fontWeight: '600', // bold
  },
  em: {
    color: '#FFFFFF', // primary
    fontStyle: 'italic',
  },
  link: {
    color: '#A0AEC0', // placeholder-light, or a more specific link color if defined
    textDecorationLine: 'underline',
  },
  heading1: {
    color: '#FFFFFF', // primary
    fontSize: 36, // h1
    lineHeight: 40, // h1
    fontWeight: '600', // bold
    marginTop: 10,
    marginBottom: 5,
  },
  heading2: {
    color: '#FFFFFF', // primary
    fontSize: 28, // h2
    lineHeight: 32, // h2
    fontWeight: '600', // bold
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    color: '#FFFFFF', // primary
    fontSize: 22, // h3
    lineHeight: 30, // h3
    fontWeight: '600', // bold
    marginTop: 6,
    marginBottom: 3,
  },
  // Add other heading levels (h4, h5, h6) if needed, mapping to appropriate fontSizes from tailwind.config.js
  paragraph: {
    color: '#FFFFFF', // primary
    fontSize: 18, // base
    lineHeight: 24, // base
    marginTop: 5,
    marginBottom: 5,
  },
  bullet_list_icon: {
    color: 'rgba(255, 255, 255, 0.7)', // secondary
    fontSize: 18,
  },
  ordered_list_icon: {
    color: 'rgba(255, 255, 255, 0.7)', // secondary
    fontSize: 18,
  },
  list_item: {
    color: '#FFFFFF', // primary
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: 'rgba(30, 47, 80, 0.6)', // A bit darker/more opaque than component-bg for emphasis
    color: '#A0AEC0', // placeholder-light
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace font
  },
  code_block: {
    backgroundColor: 'rgba(23, 37, 64, 0.5)', // Slightly different from input-bg for differentiation
    color: '#FFFFFF', // primary
    padding: 10,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace font
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // component-border
  },
  blockquote: {
    backgroundColor: 'rgba(30, 47, 80, 0.25)', // Lighter component-bg
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)', // Lighter component-border
    borderLeftWidth: 3,
    marginTop: 5,
    marginBottom: 5,
  },
  hr: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // component-border
    height: 1,
    marginVertical: 10,
  },
  // table, th, tr, td styles can be added if tables are expected
});

const markdownItInstance = MarkdownIt({
  html: false, // Disable HTML
  linkify: true,
  typographer: true,
}).disable(['image']); // Disable images

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';

  // User specific styles
  const userContainerStyle = "p-3 rounded-xl my-1 max-w-[80%] self-end bg-[rgba(49,76,144,0.4)] border border-[#6F8DD6]";
  const userTextStyle = "text-base text-primary";

  // AI specific styles for the container
  // self-start to align content to the left, my-1 for vertical margin, py-2 for vertical padding.
  // No background, no border, no max-width, no rounded-xl
  const aiContainerStyle = "self-start my-1 py-2 self-stretch";

  const handleLinkPress = (url: string): boolean => {
    Linking.openURL(url).catch(err => {
      logger.error('Failed to open URL:', { url, error: err });
      // Optionally, show an alert to the user
    });
    return true; // Explicitly return true to indicate the event was handled
  };

  return (
    <View
      className={isUser ? userContainerStyle : aiContainerStyle}
    >
      {isUser ? (
        <Text className={userTextStyle}>{content}</Text>
      ) : (
        <Markdown
          style={markdownStyles}
          markdownit={markdownItInstance}
          onLinkPress={handleLinkPress}
        >
          {content}
        </Markdown>
      )}
    </View>
  );
};

export default ChatBubble; 