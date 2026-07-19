import { Stack, router, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { AuthProvider, useAuth } from '../lib/AuthContext'

function RootLayout() {
  const { session, loading, error } = useAuth()
  const segments = useSegments()

  useEffect(() => {
    if (loading || error) return

    const inAuthGroup = segments[0] === '(auth)'
    const isUpdatePassword = segments[1] === 'update-password'
    const isOnboarding = segments[1] === 'onboarding'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup && !isUpdatePassword && !isOnboarding) {
      router.replace('/(tabs)')
    }
  }, [session, loading, error, segments])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Conectando...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => window.location.reload()}>
          <Text style={styles.retryBtnText}>Recargar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 32,
  },
  loadingText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
  errorIcon: {
    fontSize: 48, fontWeight: '700', color: '#FCA5A5', marginBottom: 16,
    width: 64, height: 64, lineHeight: 64, textAlign: 'center',
    borderRadius: 32, backgroundColor: '#FEE2E2', overflow: 'hidden',
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
