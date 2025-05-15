import { View, KeyboardAvoidingView, Platform, ImageBackground, FlatList, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventSource, { MessageEvent as SseMessageEvent } from 'react-native-sse';
import BackButton from '../../components/BackButton';
import ChatInput from '../../components/ChatInput';
import ChatBubble from '../../components/ChatBubble';
import { logger } from '@/utils/logger';
import { supabase } from '@/utils/supabaseClient';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Message {
  role: 'user' | 'ai';
  content: string;
  id: string;
}

const INACTIVITY_TIMEOUT_MS = 30000;

export default function SessionScreen() {
  const router = useRouter();
  const { sessionId: initialSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [rationality, setRationality] = useState<number>(3); // Default rationality

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For AI response loading
  const [isSessionEstablishing, setIsSessionEstablishing] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const currentAiMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialSessionId !== currentSessionId) {
        setCurrentSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  useEffect(() => {
    if (currentSessionId && currentSessionId !== 'pending' && currentSessionId !== 'error') {
      setIsSessionEstablishing(false);
      setSessionError(null);
      logger.info(`Session active with ID: ${currentSessionId}`);

      const fetchUserProfileRationality = async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            logger.warn(
              'SessionScreen: Could not get user for fetching rationality, using default.',
              userError ? { error: userError.message } : undefined
            );
            // Rationality state already defaults to 3, so no need to set it here
            return;
          }

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('rationality')
            .eq('id', user.id)
            .single();

          if (profileError) {
            logger.warn(
              `SessionScreen: Failed to fetch profile rationality for user ${user.id}, using default.`,
              profileError ? { error: profileError.message } : undefined
            );
          } else if (profileData && typeof profileData.rationality === 'number' && profileData.rationality >= 1 && profileData.rationality <= 5) {
            logger.info(`SessionScreen: Setting rationality to ${profileData.rationality} from user profile.`);
            setRationality(profileData.rationality);
          } else {
            logger.info(`SessionScreen: User profile rationality not set or invalid, using default (3). Profile data:`, profileData);
            // Rationality state already defaults to 3
          }
        } catch (e) {
          logger.error(
            'SessionScreen: Unexpected error fetching user profile rationality, using default.',
            e instanceof Error ? { error: e.message, stack: e.stack } : { error: String(e) }
          );
        }
      };

      fetchUserProfileRationality();

    } else if (currentSessionId === 'pending') {
      setIsSessionEstablishing(true);
      setSessionError(null);
    } else if (currentSessionId === 'error') {
      setIsSessionEstablishing(false);
      setSessionError("Failed to create or load session. Please try again.");
      logger.error("Session entered error state from router params");
    } else if (!currentSessionId) {
      setIsSessionEstablishing(false);
      setSessionError("Session ID is missing. Please start a new session.");
      logger.warn("SessionScreen loaded without a session ID param");
    }
  }, [currentSessionId]);

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

  useEffect(() => {
    return () => {
      logger.info("SessionScreen unmounting, ensuring EventSource cleanup.");
      closeEventSource();
    };
  }, [closeEventSource]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || isLoading || isSessionEstablishing || sessionError || !currentSessionId || currentSessionId === 'pending' || currentSessionId === 'error') {
      logger.debug("Send ignored: Input empty, AI loading, session establishing, session error, or invalid/pending session ID.");
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
      const { data: { session: authSession }, error: authSessionError } = await supabase.auth.getSession();
      if (authSessionError || !authSession) {
        logger.error('Error fetching auth session or no active session for SSE request:', authSessionError);
        const errorId = Date.now().toString() + '-error-auth';
        setMessages(prev => prev.map(m => m.id === newAiId ? { ...m, content: `Authentication Error: Session invalid. Please log in again.`} : m));
        setIsLoading(false);
        return;
      }
      const userId = authSession.user.id;
      const accessToken = authSession.access_token;

      const queryParams = new URLSearchParams({
        session_id: currentSessionId,
        user_id: userId,
        text: userMessageContent,
        rationality: String(rationality),
      });

      const baseFunctionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || (process.env.EXPO_PUBLIC_SUPABASE_URL ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1` : undefined);
      if (!baseFunctionsUrl) {
        logger.error("FATAL: Neither EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL nor EXPO_PUBLIC_SUPABASE_URL is defined.");
        setMessages(prev => prev.map(m => m.id === newAiId ? { ...m, content: `Client Configuration Error: Supabase Functions URL missing.`} : m));
        setIsLoading(false);
        return;
      }

      const sseUrl = `${baseFunctionsUrl}/openai-chat?${queryParams.toString()}`;
      logger.info(`Connecting to EventSource: ${sseUrl}`);
      if (eventSourceRef.current) {
          logger.warn("Closing existing EventSource before creating new one.");
          closeEventSource();
      }
      eventSourceRef.current = new EventSource(sseUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
         withCredentials: false
      });
      eventSourceRef.current.addEventListener('message', handleSseMessage);
      eventSourceRef.current.addEventListener('error', handleSseError);
      eventSourceRef.current.addEventListener('open', handleSseOpen);
      resetInactivityTimeout();
    } catch (error: any) {
      logger.error("EventSource setup failed:", error);
      const errorId = Date.now().toString() + '-error-setup';
       setMessages(prev => prev.map(m => m.id === newAiId ? { ...m, content: `Connection Setup Error: ${error.message || 'Unknown error'}`} : m));
      setIsLoading(false);
    }
  };

  if (isSessionEstablishing) {
    return (
      <ImageBackground
        source={require('../../assets/images/background-other.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className="text-primary text-lg mt-4">Initializing session...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (sessionError) {
    return (
      <ImageBackground
        source={require('../../assets/images/background-other.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <BackButton />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Text className="text-red-400 text-lg text-center mb-4">{sessionError}</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 py-2 px-4 rounded-lg">
                <Text className="text-primary">Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

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
              isLoading={isLoading} // AI response loading
              // ChatInput is implicitly disabled by handleSend checks when session is not ready
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}