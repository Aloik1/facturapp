import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { signUp } from '../../services/auth'
import { colors, radii, shadows } from '../../lib/theme'

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Mínimo 6 caracteres'
  if (!/[A-Z]/.test(password)) return 'Debe contener una mayúscula'
  if (!/[a-z]/.test(password)) return 'Debe contener una minúscula'
  if (!/[0-9]/.test(password)) return 'Debe contener un número'
  return null
}

function passwordHintColor(password: string): string {
  if (!password) return colors.textTertiary
  return validatePassword(password) ? colors.danger : colors.success
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({})

  async function handleRegister() {
    setErrors({})
    const newErrors: typeof errors = {}

    if (!email.trim()) newErrors.email = 'El email es obligatorio'
    const pwError = validatePassword(password)
    if (pwError) newErrors.password = pwError
    if (!confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden'

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const { error } = await signUp(email.trim(), password)
      if (error) { setErrors({ email: error.message }); return }
      Alert.alert('Cuenta creada', 'Registro completado. Completa tu perfil para empezar.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/onboarding') }])
    } catch (err: any) {
      setErrors({ email: err?.message || 'Error de conexión. Inténtalo de nuevo.' })
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para empezar</Text>

          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
            placeholderTextColor={colors.inputPlaceholder}
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })) }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Contraseña"
            placeholderTextColor={colors.inputPlaceholder}
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })) }}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirmar contraseña"
            placeholderTextColor={colors.inputPlaceholder}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: undefined })) }}
            secureTextEntry
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          <Text style={[styles.hint, { color: passwordHintColor(password) }]}>
            Mínimo 6 caracteres, 1 mayúscula, 1 minúscula, 1 número
          </Text>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Registrando...' : 'Registrarse'}</Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
    width: '100%', maxWidth: 400,
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 40, ...shadows.card,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, padding: 14, fontSize: 15, color: colors.text, marginBottom: 4,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12, marginLeft: 4 },
  hint: { fontSize: 12, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
})
