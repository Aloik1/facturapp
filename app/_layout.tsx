import { Stack, Redirect } from 'expo-router'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { AuthProvider, useAuth } from '../lib/AuthContext'

function RootLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
})
