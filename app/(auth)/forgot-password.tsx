import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, radii, shadows } from '../../lib/theme'

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
    if (!email.trim()) { setError('El email es obligatorio'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://facturapp-six.vercel.app/(auth)/update-password',
      })
      if (error) { setError(error.message); return }
      setCooldown(60)
    } catch (err: any) {
      setError(err?.message || 'Error de conexión.')
    } finally { setLoading(false) }
  }

  const isDisabled = loading || cooldown > 0

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>Te enviaremos un enlace a tu email</Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Email"
            placeholderTextColor={colors.inputPlaceholder}
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {cooldown > 0 && <Text style={styles.successText}>Enlace enviado. Revisa tu email (y la bandeja de spam).</Text>}

          <TouchableOpacity style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={handleReset} disabled={isDisabled}>
            <Text style={styles.buttonText}>
              {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar enlace (${cooldown}s)` : 'Enviar enlace'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Volver a iniciar sesión</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, padding: 40, ...shadows.card,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, padding: 14, fontSize: 15, color: colors.text, marginBottom: 16,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12, marginLeft: 4 },
  successText: { color: colors.success, fontSize: 13, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
})
