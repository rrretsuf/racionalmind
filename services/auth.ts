import { supabase } from '@/utils/supabaseClient';
import { logger } from '@/utils/logger';

export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.error('signInWithEmail Error:', error.message);
      throw error;
    }
    logger.info('signInWithEmail successful.');
    return data; 
  } catch (error) {
    logger.error('signInWithEmail Exception:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      logger.error('signUpWithEmail Error:', error.message);
      throw error;
    }
    logger.info('signUpWithEmail successful. Check email for confirmation.');
    return data;
  } catch (error) {
    logger.error('signUpWithEmail Exception:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const identityToken = null; 
    if (!identityToken) {
      logger.warn('signInWithApple: Native implementation needed to get identityToken.');
      throw new Error('Apple Sign In not implemented yet.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) {
      logger.error('signInWithApple Supabase Error:', error.message);
      throw error;
    }

    logger.info('signInWithApple successful.');
    return data;

  } catch (error) {
    logger.error('signInWithApple Exception:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('signOut Error:', error.message);
      throw error;
    }
    logger.info('signOut successful.');
  } catch (error) {
    logger.error('signOut Exception:', error);
    throw error;
  }
};

export const getCurrentSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        logger.error('getCurrentSession Error:', error.message);
        return { session: null, error };
    }
    return { session: data.session, error: null };
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};