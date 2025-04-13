import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { secureStorage } from "@/services/secure-storage"; 

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check your environment variables.");
}

const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return secureStorage.getToken(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await secureStorage.saveToken(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await secureStorage.removeToken(key);
  }
};

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
	auth: {
	  storage: secureStorageAdapter,
	  autoRefreshToken: true,
	  persistSession: true,
	  detectSessionInUrl: false, 
	},
  });

AppState.addEventListener("change", (state) => {
	if (state === "active") {
		supabase.auth.startAutoRefresh();
	} else {
		supabase.auth.stopAutoRefresh();
	}
}); 