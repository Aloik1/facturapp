import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { getProfile, upsertProfile } from '../../services/profiles'
import { colors, radii, shadows } from '../../lib/theme'

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
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSaving(true)
    const { error } = await upsertProfile(session!.user.id, {
      business_name: businessName.trim(),
      business_nif: businessNif.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
      sector,
    })
    setSaving(false)
    if (error) { Alert.alert('Error', error.message); return }
    router.replace('/(tabs)')
  }

  if (loading) {
    return (
      <View style={styles.container}><View style={styles.content}><Text style={[styles.subtitle, { color: colors.textTertiary }]}>Cargando...</Text></View></View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>Necesitamos estos datos para crear facturas</Text>

          <TextInput
            style={[styles.input, errors.businessName && styles.inputError]}
            placeholder="Nombre del negocio"
            placeholderTextColor={colors.inputPlaceholder}
            value={businessName}
            onChangeText={(t) => { setBusinessName(t); setErrors((e) => ({ ...e, businessName: '' })) }}
          />
          {errors.businessName ? <Text style={styles.errorText}>{errors.businessName}</Text> : null}

          <TextInput
            style={[styles.input, errors.businessNif && styles.inputError]}
            placeholder="CIF / NIF"
            placeholderTextColor={colors.inputPlaceholder}
            value={businessNif}
            onChangeText={(t) => { setBusinessNif(t); setErrors((e) => ({ ...e, businessNif: '' })) }}
            autoCapitalize="characters"
          />
          {errors.businessNif ? <Text style={styles.errorText}>{errors.businessNif}</Text> : null}

          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="Dirección"
            placeholderTextColor={colors.inputPlaceholder}
            value={address}
            onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: '' })) }}
          />
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Teléfono (opcional)"
            placeholderTextColor={colors.inputPlaceholder}
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

          <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }} onPress={() => router.replace('/(tabs)')}>
            <Text style={{ color: colors.textTertiary, fontSize: 14 }}>Hacer más tarde</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, padding: 32, ...shadows.card,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, padding: 12, fontSize: 15, color: colors.text, marginBottom: 4,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sectorBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.sm,
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  sectorBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  sectorBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  sectorBtnTextActive: { color: colors.accent },
  button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
})
