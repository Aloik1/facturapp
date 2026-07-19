import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Mínimo 6 caracteres'
  if (!/[A-Z]/.test(password)) return 'Debe contener una mayúscula'
  if (!/[a-z]/.test(password)) return 'Debe contener una minúscula'
  if (!/[0-9]/.test(password)) return 'Debe contener un número'
  return null
}

function passwordHintColor(password: string): string {
  if (!password) return '#94A3B8'
  return validatePassword(password) ? '#EF4444' : '#22C55E'
}

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const redirectRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setError('Enlace inválido o caducado. Solicita un nuevo restablecimiento.')
      }
    })
  }, [])

  async function handleUpdate() {
    setError('')
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      setSuccess(true)
      if (!redirectRef.current) {
        redirectRef.current = true
        setTimeout(() => router.replace('/(tabs)'), 1500)
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            {error || 'Verificando enlace...'}
          </Text>
          {error ? (
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/forgot-password')}>
              <Text style={styles.buttonText}>Solicitar nuevo enlace</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Contraseña actualizada</Text>
          <Text style={styles.subtitle}>Redirigiendo a iniciar sesión...</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>Elige una contraseña segura</Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Nueva contraseña"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={(v) => { setPassword(v); setError('') }}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setError('') }}
          secureTextEntry
        />
        <Text style={[styles.hint, { color: passwordHintColor(password) }]}>Mínimo 6 caracteres, 1 mayúscula, 1 minúscula, 1 número</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Cambiar contraseña'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2563EB', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4, backgroundColor: '#F8FAFC' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, marginLeft: 4 },
  hint: { color: '#94A3B8', fontSize: 12, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
