import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function handleReset() {
    setError('')
    if (!email.trim()) {
      setError('El email es obligatorio')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://facturapp-six.vercel.app/(auth)/update-password',
      })
      if (error) {
        setError(error.message)
        return
      }
      setCooldown(60)
    } catch (err: any) {
      setError(err?.message || 'Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || cooldown > 0

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Restablecer contraseña</Text>
        <Text style={styles.subtitle}>Te enviaremos un enlace a tu email</Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={(v) => { setEmail(v); setError('') }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {cooldown > 0 && (
          <Text style={styles.successText}>Enlace enviado. Revisa tu email (y la bandeja de spam).</Text>
        )}

        <TouchableOpacity style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={handleReset} disabled={isDisabled}>
          <Text style={styles.buttonText}>
            {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar enlace (${cooldown}s)` : 'Enviar enlace'}
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Volver a iniciar sesión</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2563EB', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, backgroundColor: '#F8FAFC' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, marginLeft: 4 },
  successText: { color: '#22C55E', fontSize: 13, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontSize: 14 },
})
