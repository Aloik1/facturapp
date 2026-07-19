import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { signUp } from '../../services/auth'

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Mínimo 6 caracteres'
  if (!/[A-Z]/.test(password)) return 'Debe contener una mayúscula'
  if (!/[a-z]/.test(password)) return 'Debe contener una minúscula'
  if (!/[0-9]/.test(password)) return 'Debe contener un número'
  return null
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

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio'
    }
    const pwError = validatePassword(password)
    if (pwError) {
      newErrors.password = pwError
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email.trim(), password)
      if (error) {
        setErrors({ email: error.message })
        return
      }
      Alert.alert(
        'Cuenta creada',
        'Registro completado. Ahora puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      )
    } catch (err: any) {
      setErrors({ email: err?.message || 'Error de conexión. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Regístrate para empezar</Text>

        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })) }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Contraseña"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })) }}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        <Text style={styles.hint}>Mínimo 6 caracteres, 1 mayúscula, 1 minúscula, 1 número</Text>

        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: undefined })) }}
          secureTextEntry
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Registrando...' : 'Registrarse'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4, backgroundColor: '#F8FAFC' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, marginLeft: 4 },
  hint: { color: '#94A3B8', fontSize: 12, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontSize: 14 },
})
