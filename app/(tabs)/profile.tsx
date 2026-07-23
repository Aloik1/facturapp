import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { signOut } from '../../services/auth'
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

export default function ProfileScreen() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const successRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [businessName, setBusinessName] = useState('')
  const [businessNif, setBusinessNif] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [sector, setSector] = useState('')
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
    setErrors({})
    const newErrors: Record<string, string> = {}
    if (!businessName.trim()) newErrors.businessName = 'Campo obligatorio'
    if (!businessNif.trim()) newErrors.businessNif = 'Campo obligatorio'
    if (!address.trim()) newErrors.address = 'Campo obligatorio'
    if (!sector) newErrors.sector = 'Selecciona un sector'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setSaving(true)
    try {
      const { error } = await upsertProfile(session!.user.id, {
        business_name: businessName.trim(), business_nif: businessNif.trim(),
        address: address.trim(), phone: phone.trim() || null, sector,
      })
      setSaving(false)
      if (error) Alert.alert('Error', error.message)
      else { setSuccess(true); clearTimeout(successRef.current); successRef.current = setTimeout(() => setSuccess(false), 3000) }
    } catch (err) { setSaving(false); Alert.alert('Error', (err as Error)?.message || 'Inténtalo de nuevo') }
  }

  async function handleSignOut() { await signOut(); router.replace('/(auth)/login') }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Mi perfil</Text>

        <Text style={styles.label}>Nombre del negocio *</Text>
        <TextInput style={[styles.input, errors.businessName && styles.inputError]} value={businessName} onChangeText={(t) => { setBusinessName(t); setErrors((e) => ({ ...e, businessName: '' })) }} placeholder="Nombre" placeholderTextColor={colors.inputPlaceholder} />
        {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

        <Text style={styles.label}>CIF / NIF *</Text>
        <TextInput style={[styles.input, errors.businessNif && styles.inputError]} value={businessNif} onChangeText={(t) => { setBusinessNif(t); setErrors((e) => ({ ...e, businessNif: '' })) }} placeholder="CIF/NIF" placeholderTextColor={colors.inputPlaceholder} autoCapitalize="characters" />
        {errors.businessNif && <Text style={styles.errorText}>{errors.businessNif}</Text>}

        <Text style={styles.label}>Dirección *</Text>
        <TextInput style={[styles.input, errors.address && styles.inputError]} value={address} onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: '' })) }} placeholder="Dirección" placeholderTextColor={colors.inputPlaceholder} />
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono (opcional)" placeholderTextColor={colors.inputPlaceholder} keyboardType="phone-pad" />

        <Text style={styles.label}>Sector *</Text>
        <View style={[styles.sectorGrid, errors.sector && { marginBottom: 4 }]}>
          {SECTORS.map((s) => (
            <TouchableOpacity
              key={s.value} style={[styles.sectorBtn, sector === s.value && styles.sectorBtnActive]}
              onPress={() => { setSector(s.value); setErrors((e) => ({ ...e, sector: '' })) }}
            >
              <Text style={[styles.sectorBtnText, sector === s.value && styles.sectorBtnTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.sector && <Text style={styles.errorText}>{errors.sector}</Text>}

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>
        {success && <Text style={styles.successText}>Perfil actualizado correctamente</Text>}

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: {
    margin: 24, marginTop: 60, padding: 24,
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  title: { fontSize: 24, fontWeight: '600', color: colors.text, letterSpacing: -0.02, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, marginBottom: 4,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12, marginLeft: 4 },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  sectorBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.sm,
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  sectorBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  sectorBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  sectorBtnTextActive: { color: colors.accent },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  successText: { color: colors.success, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  logoutButton: {
    backgroundColor: colors.dangerBg, borderRadius: radii.sm, paddingVertical: 14,
    alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: 'rgba(217,92,92,0.2)',
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
})
