import { supabase } from '../utils/supabaseClient'
import { logger } from '../utils/logger'
import { AuthError, AuthResponse, AuthTokenResponsePassword, Session, User } from '@supabase/supabase-js'
import * as AppleAuthentication from 'expo-apple-authentication'
import { type Router } from 'expo-router'

export const signUpWithEmail = async (
  email: string,
  password: string,
  router: Router
): Promise<AuthTokenResponsePassword> => {
  logger.info('Attempting email signup', { email })
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      logger.error('Email signup failed', signUpError, { email })
      return { data: { user: signUpData?.user ?? null, session: null }, error: signUpError }
    }
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      logger.error('Sign in after signup failed', signInError, { email })
      return { data: { user: signInData?.user ?? null, session: signInData?.session ?? null }, error: signInError }
    }
    logger.info('Email signup and signin successful, navigating to home.', { userId: signInData.user?.id })
    router.replace('/')
    return { data: { user: signInData.user, session: signInData.session }, error: null }
  } catch (error) {
    logger.error('Unexpected error during email signup', error, { email })
    return { data: { user: null, session: null }, error: error as AuthError }
  }
}

export const signInWithEmail = async (
  email: string,
  password: string,
  router: Router
): Promise<AuthTokenResponsePassword> => {
  logger.info('Attempting email signin', { email })
  try {
    const response = await supabase.auth.signInWithPassword({ email, password })
    if (response.error) {
      logger.error('Email signin failed', response.error, { email })
    } else if (response.data.session) {
      logger.info('Email signin successful, navigating to home.', { userId: response.data.user?.id })
      router.replace('/')
    }
    return response
  } catch (error) {
    logger.error('Unexpected error during email signin', error, { email })
    return { data: { user: null, session: null }, error: error as AuthError }
  }
}

export const signInWithApple = async (router: Router): Promise<AuthResponse> => {
  logger.info('Attempting Apple signin')
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    })

    if (credential.identityToken) {
      const response = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken
      })
      if (response.error) {
        logger.error('Apple signin with Supabase failed', response.error)
      } else if (response.data.session) {
        logger.info('Apple signin successful, navigating to home.', { userId: response.data.user?.id })
        router.replace('/')
      }
      return response
    } else {
      const error = new AuthError('Apple signin failed: No identity token received')
      logger.error('Apple signin failed: No identity token received', error)
      return { data: { user: null, session: null }, error }
    }
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      logger.info('Apple signin cancelled by user')
      return { data: { user: null, session: null }, error: new AuthError('User cancelled Apple signin') }
    } else {
      logger.error('Unexpected error during Apple signin', error)
      return { data: { user: null, session: null }, error: error as AuthError }
    }
  }
}

export const signOut = async (router: Router): Promise<{ error: AuthError | null }> => {
  logger.info('Attempting signout')
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error('Signout failed', error)
    } else {
      logger.info('Signout successful, navigating to welcome.')
      router.replace('/welcome')
    }
    return { error }
  } catch (error) {
    logger.error('Unexpected error during signout', error)
    return { error: error as AuthError }
  }
}

export const getSession = async (): Promise<{ data: { session: Session | null }; error: AuthError | null }> => {
  logger.debug('Attempting to get session')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      logger.error('Failed to get session', error)
    }
    return { data, error }
  } catch (error) {
    logger.error('Unexpected error while getting session', error)
    return { data: { session: null }, error: error as AuthError }
  }
} 