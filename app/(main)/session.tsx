import { View, KeyboardAvoidingView, Platform, ImageBackground, FlatList, Text } from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventSource, { MessageEvent as SseMessageEvent } from 'react-native-sse';
import BackButton from '../../components/BackButton';
import ChatInput from '../../components/ChatInput';
import ChatBubble from '../../components/ChatBubble';
import { logger } from '@/utils/logger';
import { supabase } from '@/utils/supabaseClient';

interface Message {
  role: 'user' | 'ai';
  content: string;
  id: string;
}

const INACTIVITY_TIMEOUT_MS = 30000;

export default function SessionScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const currentAiMessageIdRef = useRef<string | null>(null);

  const closeEventSource = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      logger.info("Closing EventSource connection...");
      eventSourceRef.current.removeAllEventListeners();
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      logger.info("EventSource connection closed.");
    }
    setIsLoading(false);
  }, []);

  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      logger.warn(`SSE inactivity timeout (${INACTIVITY_TIMEOUT_MS}ms) reached. Closing connection.`);
      closeEventSource();
    }, INACTIVITY_TIMEOUT_MS);
  }, [closeEventSource]);

  // --- Event Handlers ---
  // Define handlers outside useCallback initially if they don't depend on changing state/props
  // Or ensure useCallback dependencies are correct.

  const handleSseMessage = useCallback((event: SseMessageEvent) => {
      resetInactivityTimeout();
      if (!event.data) {
          logger.warn("SSE received empty data");
          return;
      }

      if (event.data === '[DONE]') {
          logger.info("SSE stream finished signal [DONE] received from Edge Function.");
          const finalAiMsgId = currentAiMessageIdRef.current;
          setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === finalAiMsgId && msg.content === "...") {
              return { ...msg, content: "" };
            }
            return msg;
          }));
          closeEventSource();
          currentAiMessageIdRef.current = null;
          return;
      }

      try {
          const jsonData = JSON.parse(event.data);

          if (jsonData.error) {
              logger.error('Error message from server stream:', jsonData.error);
              setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                      if (msg.id === currentAiMessageIdRef.current && msg.role === 'ai') {
                          return { ...msg, content: msg.content.replace("...","") + ` [Server Error: ${jsonData.error}]` };
                      }
                      return msg;
                  });
              });
              closeEventSource();
              currentAiMessageIdRef.current = null;
              return;
          }

          if (jsonData.text !== undefined) {
              setMessages(prevMessages =>
                  prevMessages.map(msg => {
                      if (msg.id === currentAiMessageIdRef.current && msg.role === 'ai') {
                          const newContent = msg.content === "..." ? jsonData.text : msg.content + jsonData.text;
                          return { ...msg, content: newContent };
                      }
                      return msg;
                  })
              );
          } else {
              logger.warn("Parsed SSE data missing 'text' property:", jsonData);
          }
      } catch (e) {
          logger.error("Failed to parse SSE data:", { data: event.data, error: e });
          setMessages(prevMessages =>
            prevMessages.map(msg => {
              if (msg.id === currentAiMessageIdRef.current && msg.role === 'ai') {
                return { ...msg, content: msg.content.replace("...","") + ` [Parsing Error]` };
              }
              return msg;
            })
          );
          closeEventSource();
          currentAiMessageIdRef.current = null;
      }
  }, [closeEventSource, resetInactivityTimeout, isLoading]);

  const handleSseError = useCallback((event: SseMessageEvent | { type: string }) => {
      logger.error('EventSource error event:', event);

      let displayErrorMessage = 'A connection error occurred.';

      if (event && event.type) {
          displayErrorMessage = `Error type: ${event.type}.`;
          if ('data' in event && event.data && typeof event.data === 'string') {
              try {
                  const parsedData = JSON.parse(event.data);
                  if (parsedData && typeof parsedData.error === 'string') {
                      displayErrorMessage = `Server error: ${parsedData.error}`;
                  } else if (parsedData && typeof parsedData.message === 'string') {
                      displayErrorMessage = `Server message: ${parsedData.message}`;
                  } else {
                      displayErrorMessage += ` Details: ${event.data}`;
                  }
              } catch (e) {
                  displayErrorMessage += ` Details: ${event.data}`;
              }
          }
      }

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === currentAiMessageIdRef.current && msg.role === 'ai') {
            return { ...msg, content: msg.content.replace("...","") + ` [Error: ${displayErrorMessage}]` };
          }
          return msg;
        })
      );
      closeEventSource();
      currentAiMessageIdRef.current = null;
  }, [closeEventSource, isLoading]);

  const handleSseOpen = useCallback((event: { type: string }) => {
      logger.info("EventSource connection opened.", event);
      resetInactivityTimeout();
  }, [resetInactivityTimeout]);


  // --- Component Unmount Cleanup ---
  useEffect(() => {
    return () => {
      logger.info("SessionScreen unmounting, ensuring EventSource cleanup.");
      closeEventSource();
    };
  }, [closeEventSource]);

  // --- Scroll Logic ---
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]); 

  // --- Send Handler ---
  const handleSend = async () => {
    if (inputText.trim().length === 0 || isLoading) {
      // logger.debug("Send ignored: Input empty or already loading.");
      return;
    }

    const userMessageContent = inputText.trim();
    const userMessage: Message = {
      role: 'user',
      content: userMessageContent,
      id: Date.now().toString() + '-user'
    };

    const newAiId = Date.now().toString() + '-ai';
    const aiPlaceholderMessage: Message = {
      role: 'ai',
      content: '...', 
      id: newAiId
    };

    setMessages(prevMessages => [...prevMessages, userMessage, aiPlaceholderMessage]);
    setInputText('');
    setIsLoading(true);
    currentAiMessageIdRef.current = newAiId; 

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.error('Error fetching session or no active session for SSE request:', sessionError);
        const errorId = Date.now().toString() + '-error-auth';
        setMessages(prev => [...prev, { role: 'ai', content: `Authentication Error: Session invalid. Please log in again.`, id: errorId}]);
        setIsLoading(false); 
        return;
      }

      const accessToken = session.access_token;
      const userId = session.user.id;

      // IMPORTANT: Implement proper session_id generation/retrieval logic here!
      // This SHOULD come from route params, state, or context, not hardcoded.
      const sessionId = 'REAL_SESSION_ID_FROM_APP_STATE_OR_ROUTE'; // <<< REPLACE THIS

      const queryParams = new URLSearchParams({
        session_id: sessionId,
        user_id: userId, 
        text: userMessageContent, 
      });

      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) {
          logger.error("FATAL: EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables.");
           const errorId = Date.now().toString() + '-error-env';
           setMessages(prev => [...prev, { role: 'ai', content: `Client Configuration Error: Anon key missing.`, id: errorId}]);
          setIsLoading(false);
          return;
      }
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/openai-chat?${queryParams.toString()}`;

      logger.info(`Connecting to EventSource: ${functionUrl}`);

      if (eventSourceRef.current) {
          logger.warn("Closing existing EventSource before creating new one.");
          closeEventSource();
      }


      eventSourceRef.current = new EventSource(functionUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': anonKey, 
        },
         withCredentials: false 
      });

      // Attach listeners
      eventSourceRef.current.addEventListener('message', handleSseMessage);
      eventSourceRef.current.addEventListener('error', handleSseError);
      eventSourceRef.current.addEventListener('open', handleSseOpen);

      // Start inactivity timer *after* successfully creating the EventSource
      resetInactivityTimeout();

    } catch (error: any) {
      logger.error("EventSource setup failed:", error);
      const errorId = Date.now().toString() + '-error-setup';
      setMessages(prev => [...prev, { role: 'ai', content: `Connection Setup Error: ${error.message}`, id: errorId}]);
      setIsLoading(false); 
    }
  };

  // --- Render ---
  return (
    <ImageBackground
      source={require('../../assets/images/background-other.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0} 
        >
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <BackButton />
            {/* Add Title or other header elements here */}
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
            keyExtractor={(item) => item.id}
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled" 
          />

          <View style={{ padding: 16 }}>
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