import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { signOut } from '../../services/auth'
import { getProfile, upsertProfile } from '../../services/profiles'

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
  const [businessName, setBusinessName] = useState('')
  const [businessNif, setBusinessNif] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [sector, setSector] = useState('')

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
    if (!businessName.trim() || !businessNif.trim() || !address.trim() || !sector) {
      Alert.alert('Error', 'Todos los campos obligatorios deben estar rellenos')
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
    } else {
      Alert.alert('Perfil actualizado', 'Tus datos se han guardado correctamente.')
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Mi perfil</Text>

      <Text style={styles.label}>Nombre del negocio *</Text>
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Nombre" placeholderTextColor="#94A3B8" />

      <Text style={styles.label}>CIF / NIF *</Text>
      <TextInput style={styles.input} value={businessNif} onChangeText={setBusinessNif} placeholder="CIF/NIF" placeholderTextColor="#94A3B8" autoCapitalize="characters" />

      <Text style={styles.label}>Dirección *</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Dirección" placeholderTextColor="#94A3B8" />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono (opcional)" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />

      <Text style={styles.label}>Sector *</Text>
      <View style={styles.sectorGrid}>
        {SECTORS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.sectorBtn, sector === s.value && styles.sectorBtnActive]}
            onPress={() => setSector(s.value)}
          >
            <Text style={[styles.sectorBtnText, sector === s.value && styles.sectorBtnTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#F8FAFC', marginBottom: 16,
  },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  sectorBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sectorBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  sectorBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  sectorBtnTextActive: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  logoutButton: { backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
})
