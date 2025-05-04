import React, { useState, useRef } from 'react';
import { 
  StyleProp, 
  ViewStyle, 
  TouchableOpacity, 
  Text, 
  TouchableOpacityProps, 
  TextStyle,
  View,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import Modal from 'react-native-modal';
import Dialog from 'react-native-dialog';
import { Router } from 'expo-router';
import { signInWithApple, signInWithEmail, signUpWithEmail } from '../services/auth';
import { logger } from '../utils/logger'; // Corrected import
import { LinearGradient } from 'expo-linear-gradient';

interface AuthButtonProps extends TouchableOpacityProps {
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  router: Router; // Router is now required
}

const INPUT_HEIGHT = 73;
const INPUT_BORDER_RADIUS = 14;

export default function AuthButton({ 
  activeOpacity = 0.7,
  router,
}: AuthButtonProps) {
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // true: Login, false: Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingEmailModal = useRef(false); // Add ref to track pending modal

  const showBottomSheet = () => {
    pendingEmailModal.current = false; // Reset pending state when showing bottom sheet
    setErrorMessage(null);
    setBottomSheetVisible(true);
  };

  const hideBottomSheet = () => {
    setBottomSheetVisible(false);
  };

  const showEmailModal = () => {
    // Don't hide bottom sheet or show email modal directly here
    // Instead, mark it as pending and start closing the bottom sheet
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setIsLoginMode(true); 
    pendingEmailModal.current = true; // Mark email modal as pending
    hideBottomSheet(); // Start closing the bottom sheet
  };

  const hideEmailModal = () => {
    setEmailModalVisible(false);
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleAppleSignIn = async () => {
    hideBottomSheet();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithApple(router);
      if (error) {
        setErrorMessage(error.message);
        // Optionally re-show the bottom sheet on error? Or display error elsewhere?
        // For now, just log and show error message if needed.
        logger.error('Apple Sign In Failed:', error);
      }
      // Success case is handled by router.replace('/') inside signInWithApple
    } catch (err: any) {
      logger.error('Unexpected Apple Sign In Error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during Apple Sign In.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let error;
      if (isLoginMode) {
        ({ error } = await signInWithEmail(email, password, router));
      } else {
        ({ error } = await signUpWithEmail(email, password, router));
      }

      if (error) {
        setErrorMessage(error.message);
        logger.error(isLoginMode ? 'Email Sign In Failed:' : 'Email Sign Up Failed:', error);
      } else {
        hideEmailModal(); // Close modal on success
      }
       // Success case is handled by router.replace('/') inside signIn/signUp functions
    } catch (err: any) {
      logger.error('Unexpected Email Auth Error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = "Sign up or Log in";

  const handleBottomSheetHidden = () => {
      // This function is called after the bottom sheet modal finishes hiding
      if (pendingEmailModal.current) {
          pendingEmailModal.current = false; // Reset pending state
          setEmailModalVisible(true); // Now, show the email modal
      }
  };

  const ErrorSlot = () => (
    <Text 
        style={{
            color: errorMessage ? '#FF6B6B' : 'transparent', // Show error or be transparent
            textAlign:'center', 
            minHeight: 20, // Reserve space
            marginBottom: 16, // Consistent margin
            fontSize: 14
        }}
    >
        {errorMessage ?? ' ' /* Use space or placeholder if needed, not null */} 
    </Text>
  );

  return (
    <>
      {/* Main Button */}
      <TouchableOpacity
        className="bg-button-secondary-bg py-4 px-6 rounded-full w-full shadow-auth-button backdrop-blur-sm border border-component-border"
        onPress={showBottomSheet} // Show bottom sheet on press
        activeOpacity={activeOpacity}
        disabled={isLoading} // Disable button when loading
      >
        {isLoading && !isBottomSheetVisible && !isEmailModalVisible ? (
          <ActivityIndicator color="#FFFFFF" /> 
        ) : (
          <Text 
            className="text-base text-primary text-center font-bold"
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        isVisible={isBottomSheetVisible}
        onBackdropPress={hideBottomSheet}
        onSwipeComplete={hideBottomSheet}
        swipeDirection={['down']}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.6}
        useNativeDriverForBackdrop
        onModalHide={handleBottomSheetHidden}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={500} // Smoother entrance
        animationOutTiming={500} // Smoother exit
      >
        <View className="bg-[#1A202C] p-6 rounded-t-3xl">
           {/* Optional Handle */}
          <View className="w-10 h-1 bg-gray-400 rounded-full self-center mb-4" />

          <TouchableOpacity
            className="bg-white py-3 px-6 rounded-full w-full mb-4 flex-row items-center justify-center"
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
            disabled={isLoading}
          >
             {/* You might want an Apple logo here */}
            <Text className="text-base text-black text-center font-bold">
              Sign in with Apple
            </Text>
          </TouchableOpacity>

          {/* Change bg-button-secondary-bg to a solid color, e.g., bg-[#495C8A] */}
          {/* Fix onPress handler */}
          <TouchableOpacity
            className="bg-[#495C8A] py-3 px-6 rounded-full w-full border border-component-border mb-4"
            onPress={showEmailModal} // Correctly call showEmailModal
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text className="text-base text-primary text-center font-bold">
              Sign in with Email
            </Text>
          </TouchableOpacity>

           <TouchableOpacity
            className="py-3 px-6 rounded-full w-full mt-2"
            onPress={hideBottomSheet}
            activeOpacity={0.8}
          >
            <Text className="text-base text-secondary text-center font-medium">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Centered Email/Password Dialog */}
       <Dialog.Container 
            visible={isEmailModalVisible} 
            onBackdropPress={hideEmailModal} 
            contentStyle={{ 
                backgroundColor: 'transparent',
                borderColor:'rgba(255, 255, 255, 0.12)',
                borderRadius: 20, 
                borderWidth: 1, 
                paddingTop: 24,
                paddingHorizontal: 24, 
                paddingBottom: 32,     
                width: 350,
                maxWidth: '90%',       
                minHeight: 420,        
                alignSelf: 'center',
                overflow: 'hidden'
            }}
        >
          <LinearGradient
                colors={['rgba(30,47,80,0.25)','rgba(90,96,110,0.25)']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Dialog.Title style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 24, textAlign: 'center', marginBottom: 24 }}> 
                {isLoginMode ? 'Log In' : 'Create Account'}
            </Dialog.Title>

            <ErrorSlot /> 

            <Dialog.Input
                placeholder="Email"
                placeholderTextColor="#A0AEC0" 
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor="#FFFFFF" 
                style={{ 
                    height: INPUT_HEIGHT,
                    fontSize: 18, 
                    color: '#FFFFFF', 
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: INPUT_BORDER_RADIUS,
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1, 
                    paddingHorizontal: 20 
                }}
                wrapperStyle={{ paddingHorizontal: 0, marginBottom: 24, borderWidth: 0 }} 
            />
            <Dialog.Input
                placeholder="Password"
                placeholderTextColor="#A0AEC0" 
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                selectionColor="#FFFFFF" 
                style={{ 
                    height: INPUT_HEIGHT,
                    fontSize: 18, 
                    color: '#FFFFFF', 
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: INPUT_BORDER_RADIUS,
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1, 
                    paddingHorizontal: 20 
                }}
                wrapperStyle={{ paddingHorizontal: 0, marginBottom: 24, borderWidth: 0 }} 
            />
            
            <TouchableOpacity 
                onPress={() => setIsLoginMode(!isLoginMode)} 
                activeOpacity={0.7} 
                style={{ alignItems: 'center', marginBottom: 32 }} 
            >
                <Text style={{ color: '#A0AEC0', fontSize: 14, textDecorationLine: 'underline' }}>
                    {isLoginMode ? "Don't have account? Create one!" : "Already have account? Log in"}
                </Text>
            </TouchableOpacity>

            <View style={{ height: 56, width: '100%', marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1, 
                  borderRadius: 28, 
                  backgroundColor: isLoading || !email || !password ? '#4A5568' : '#3498DB',
                  justifyContent:'center', 
                  alignItems:'center'
                }}
                onPress={handleEmailAuth}
                activeOpacity={0.8}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" style={{ position: 'absolute' }} />
                ) : (
                  <Text className="text-base text-primary text-center font-bold">
                    {isLoginMode ? 'Log In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                className="mt-4 items-center"
                onPress={hideEmailModal} 
                activeOpacity={0.7} 
            >
                <Text className="text-base text-secondary"> 
                    Cancel
                </Text>
            </TouchableOpacity>

         </KeyboardAvoidingView>
        </Dialog.Container>
    </>
  );
}
