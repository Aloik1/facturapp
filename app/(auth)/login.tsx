import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { signIn } from '../../services/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Email y contraseña son obligatorios')
      return
    }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email no confirmado',
          'Revisa tu bandeja de entrada (y la de spam). Confirma tu email antes de iniciar sesión. Si no encuentras el email, regístrate de nuevo para recibir otro.'
        )
      } else {
        Alert.alert('Error', error.message)
      }
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>facturap</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#2563EB', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, backgroundColor: '#F8FAFC' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontSize: 14 },
})
