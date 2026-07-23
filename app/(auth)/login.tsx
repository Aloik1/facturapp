import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { signIn } from '../../services/auth'
import { colors, radii, shadows, typography } from '../../lib/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const { error } = await signIn(email.trim(), password)
      if (error) {
        setError('Email o contraseña incorrectos')
        return
      }
      router.replace('/(tabs)')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.wordmark}>
            <Text style={styles.wordmarkText}>Facturapp</Text>
            <Text style={styles.wordmarkSub}>Facturación para autónomos</Text>
          </View>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Correo electrónico"
            placeholderTextColor={colors.inputPlaceholder}
            value={email}
            onChangeText={() => setError('')}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Contraseña"
            placeholderTextColor={colors.inputPlaceholder}
            value={password}
            onChangeText={() => setError('')}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Link href="/(auth)/register" style={styles.link}>
              <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </Link>
            <Link href="/(auth)/forgot-password" style={[styles.link, { marginTop: 8 }]}>
              <Text style={[styles.linkText, { color: colors.textTertiary }]}>¿Olvidaste tu contraseña?</Text>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 40,
    ...shadows.card,
  },
  wordmark: { alignItems: 'center', marginBottom: 40 },
  wordmarkText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.02,
  },
  wordmarkSub: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.sm,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12, marginLeft: 4 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 24 },
  link: { alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
})
