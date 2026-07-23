import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './lib/AuthContext'
import { colors } from './lib/theme'

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
    </AuthProvider>
  )
}
