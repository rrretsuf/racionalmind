import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { useRouter, useSegments } from 'expo-router'

export default function Index() {
  const { initialized, session } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (!initialized) return

    const inAuthGroup = segments[0] === '(auth)'
    const inMainGroup = segments[0] === '(main)'

    if (session && !inMainGroup) {
      router.replace('/(main)/home')
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    }

  }, [initialized, session, segments, router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
