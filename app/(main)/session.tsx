import { View, KeyboardAvoidingView, Platform, ImageBackground, FlatList, Text } from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import EventSource from 'react-native-sse';
import BackButton from '../../components/BackButton';
import ChatInput from '../../components/ChatInput';
import ChatBubble from '../../components/ChatBubble';
import { logger } from '@/utils/logger';

interface Message {
  role: 'user' | 'ai';
  content: string;
  id: string;
}

const INACTIVITY_TIMEOUT_MS = 15000;

function utf8ToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    logger.error("Failed to encode string to Base64:", e);
    throw new Error("Failed to encode payload for server."); 
  }
}

export default function SessionScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentAiId = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null); 

  // --- Centralized Cleanup Function --- 
  const closeEventSource = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      console.log("Closing EventSource connection...");
      eventSourceRef.current.removeEventListener('message', handleSseMessage);
      eventSourceRef.current.removeEventListener('error', handleSseError);
      eventSourceRef.current.removeEventListener('open', handleSseOpen);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("EventSource connection closed.");
    }
    setIsLoading(false);
    currentAiId.current = null;
  }, []); 

  // --- Function to Reset Inactivity Timeout --- 
  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      console.warn(`SSE inactivity timeout (${INACTIVITY_TIMEOUT_MS}ms) reached. Closing connection.`);
      closeEventSource();
    }, INACTIVITY_TIMEOUT_MS);
  }, [closeEventSource]);

  // --- Memoized Event Handlers --- 
  const handleSseMessage = useCallback((event: any) => {
    resetInactivityTimeout(); 
    
    if (!event.data) {
      console.warn("SSE received empty data");
      return;
    }

    if (event.data === '[DONE]') {
      console.log("SSE stream finished signal [DONE] received.");
      closeEventSource();
      return;
    }

    try {
      const jsonData = JSON.parse(event.data);
      
      if (jsonData.error) {
        console.error('Error message from server:', jsonData.error);
        setMessages(prevMessages => prevMessages.map(msg =>
          msg.id === currentAiId.current
            ? { ...msg, content: msg.content + ` [Server Error: ${jsonData.error}]` }
            : msg
        ));
        closeEventSource(); 
        return;
      }
      
      if (jsonData.text !== undefined) {
        console.log(`SSE Message Chunk: Processing text chunk. Current AI ID: ${currentAiId.current}`);
        setMessages(prevMessages => {
          if (currentAiId.current === null) {
            console.log("-> Creating NEW AI message bubble.");
            const newAiId = Date.now().toString() + '-ai';
            currentAiId.current = newAiId;
            return [...prevMessages, { role: 'ai', content: jsonData.text, id: newAiId }];
          } else {
            console.log(`-> Appending to existing AI message bubble (ID: ${currentAiId.current}).`);
            return prevMessages.map(msg =>
              msg.id === currentAiId.current
                ? { ...msg, content: msg.content + jsonData.text }
                : msg
            );
          }
        });
      } else {
        console.warn("Parsed SSE data missing 'text' property:", jsonData);
      }
    } catch (e) {
      console.error("Failed to parse SSE data:", event.data, e);
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === currentAiId.current
          ? { ...msg, content: msg.content + ` [Parsing Error]` }
          : msg
      ));
      closeEventSource(); 
    }
  }, [closeEventSource, resetInactivityTimeout]);

  const handleSseError = useCallback((error: any) => {
    console.error('EventSource error:', error?.message || error);
    setMessages(prevMessages => prevMessages.map(msg =>
      msg.id === currentAiId.current
        ? { ...msg, content: msg.content + ` [Connection Error]` }
        : msg
    ));
    closeEventSource(); 
  }, [closeEventSource]);

  const handleSseOpen = useCallback(() => {
    console.log("EventSource connection opened.");
    resetInactivityTimeout(); 
  }, [resetInactivityTimeout]);

  // --- Component Unmount Cleanup --- 
  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, [closeEventSource]);

  // --- Scroll Logic --- 
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // --- Send Handler --- 
  const handleSend = async () => {
    if (inputText.trim().length === 0 || isLoading) {
      return; 
    }

    closeEventSource(); 

    const userMessage: Message = { 
      role: 'user', 
      content: inputText.trim(),
      id: Date.now().toString() + '-user'
    };
    
    let historyPayload: any[] = [];
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, userMessage];
      historyPayload = updatedMessages.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));
      return updatedMessages;
    });
    
    setInputText('');
    setIsLoading(true);
    currentAiId.current = null; 

    try {
      const jsonString = JSON.stringify(historyPayload);
      const encodedPayload = utf8ToBase64(jsonString); 
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/gemini-chat?messages=${encodeURIComponent(encodedPayload)}`;

      eventSourceRef.current = new EventSource(functionUrl, {
        headers: {
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        pollingInterval: 0, 
      });

      console.log("Initiating EventSource connection (GET)...");

      eventSourceRef.current.addEventListener('message', handleSseMessage);
      eventSourceRef.current.addEventListener('error', handleSseError);
      eventSourceRef.current.addEventListener('open', handleSseOpen);

    } catch (error: any) {
      console.error("EventSource setup error:", error);
      const errorId = Date.now().toString() + '-error-setup';
      setMessages(prev => [...prev, { role: 'ai', content: `Setup Error: ${error.message}`, id: errorId}]);
      closeEventSource(); 
    }
  };

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Set iOS offset to 0, padding should handle it
        >
          <View className="p-4 flex-row justify-start items-center">
            <BackButton />
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
            keyExtractor={(item) => item.id}
            className="flex-1 px-4"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled"
          />

          <View className="p-4">
            <ChatInput 
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSend}
              placeholder="What is on your mind..."
              isLoading={isLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  )
}

