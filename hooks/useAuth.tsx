import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../utils/supabaseClient'
import { User, Session } from '@supabase/supabase-js'

type AuthContextType = { user: User | null; session: Session | null; initialized: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setInitialized(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setInitialized(true)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])
  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthContext.Provider value={{ user, session, initialized, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 