import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { getProfile, upsertProfile } from '../../services/profiles'

const SECTORS = [
  { label: 'Construcción', value: 'construccion' },
  { label: 'Fontanería', value: 'fontaneria' },
  { label: 'Electricidad', value: 'electricidad' },
  { label: 'Reformas', value: 'reformas' },
  { label: 'Pintura', value: 'pintura' },
  { label: 'Otro', value: 'otro' },
]

export default function OnboardingScreen() {
  const { session } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [businessNif, setBusinessNif] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [sector, setSector] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!session?.user?.id) return
    getProfile(session.user.id).then(({ data }) => {
      if (data) {
        setBusinessName(data.business_name || '')
        setBusinessNif(data.business_nif || '')
        setAddress(data.address || '')
        setPhone(data.phone || '')
        setSector(data.sector || '')
      }
      setLoading(false)
    })
  }, [session])

  async function handleSave() {
    const newErrors: Record<string, string> = {}
    if (!businessName.trim()) newErrors.businessName = 'Obligatorio'
    if (!businessNif.trim()) newErrors.businessNif = 'Obligatorio'
    if (!address.trim()) newErrors.address = 'Obligatorio'
    if (!sector) newErrors.sector = 'Selecciona un sector'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    const { error } = await upsertProfile(session!.user.id, {
      business_name: businessName.trim(),
      business_nif: businessNif.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
      sector,
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    router.replace('/(tabs)')
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Cargando...</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Completa tu perfil</Text>
        <Text style={styles.subtitle}>Necesitamos estos datos para crear facturas</Text>

        <TextInput
          style={[styles.input, errors.businessName && styles.inputError]}
          placeholder="Nombre del negocio"
          placeholderTextColor="#94A3B8"
          value={businessName}
          onChangeText={(t) => { setBusinessName(t); setErrors((e) => ({ ...e, businessName: '' })) }}
        />
        {errors.businessName ? <Text style={styles.errorText}>{errors.businessName}</Text> : null}

        <TextInput
          style={[styles.input, errors.businessNif && styles.inputError]}
          placeholder="CIF / NIF"
          placeholderTextColor="#94A3B8"
          value={businessNif}
          onChangeText={(t) => { setBusinessNif(t); setErrors((e) => ({ ...e, businessNif: '' })) }}
          autoCapitalize="characters"
        />
        {errors.businessNif ? <Text style={styles.errorText}>{errors.businessNif}</Text> : null}

        <TextInput
          style={[styles.input, errors.address && styles.inputError]}
          placeholder="Dirección"
          placeholderTextColor="#94A3B8"
          value={address}
          onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: '' })) }}
        />
        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Teléfono (opcional)"
          placeholderTextColor="#94A3B8"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Sector</Text>
        <View style={styles.sectorGrid}>
          {SECTORS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.sectorBtn, sector === s.value && styles.sectorBtnActive]}
              onPress={() => { setSector(s.value); setErrors((e) => ({ ...e, sector: '' })) }}
            >
              <Text style={[styles.sectorBtnText, sector === s.value && styles.sectorBtnTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.sector ? <Text style={styles.errorText}>{errors.sector}</Text> : null}

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipBtnText}>Hacer más tarde</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2563EB', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#F8FAFC', marginBottom: 4,
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 8, marginLeft: 4 },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sectorBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sectorBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  sectorBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  sectorBtnTextActive: { color: '#FFFFFF' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  skipBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { color: '#94A3B8', fontSize: 14 },
})
