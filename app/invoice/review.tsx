import { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { createInvoice } from '../../services/invoices'
import type { OcrResult } from '../../services/ocr'

export default function ReviewScreen() {
  const { data, imageUri } = useLocalSearchParams<{ data: string; imageUri: string }>()
  const { session } = useAuth()
  const parsed: OcrResult = JSON.parse(data!)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    emisor_nif: parsed.emisor_nif,
    emisor_razon_social: parsed.emisor_razon_social,
    factura_numero: parsed.factura_numero,
    fecha_emision: parsed.fecha_emision,
    base_imponible: String(parsed.base_imponible),
    tipo_iva: String(parsed.tipo_iva),
    cuota_iva: String(parsed.cuota_iva),
    importe_total: String(parsed.importe_total),
    concepto: parsed.concepto,
  })

  function updateField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!session?.user?.id) return
    if (!form.emisor_nif || !form.emisor_razon_social || !form.importe_total) {
      Alert.alert('Error', 'Completa los campos obligatorios: NIF, razón social e importe total')
      return
    }

    setSaving(true)
    const { error } = await createInvoice({
      user_id: session.user.id,
      emisor_nif: form.emisor_nif,
      emisor_razon_social: form.emisor_razon_social,
      factura_numero: form.factura_numero,
      fecha_emision: form.fecha_emision,
      base_imponible: parseFloat(form.base_imponible) || 0,
      tipo_iva: parseFloat(form.tipo_iva) || 0,
      cuota_iva: parseFloat(form.cuota_iva) || 0,
      importe_total: parseFloat(form.importe_total) || 0,
      concepto: form.concepto,
      imagen_url: imageUri || null,
      pagada: false,
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error al guardar', error.message)
      return
    }

    Alert.alert('Factura guardada', 'La factura se ha registrado correctamente.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Revisar factura</Text>
      <Text style={styles.subtitle}>Verifica y corrige los datos extraídos</Text>

      <Field label="NIF del emisor *" value={form.emisor_nif} onChange={v => updateField('emisor_nif', v)} />
      <Field label="Razón social *" value={form.emisor_razon_social} onChange={v => updateField('emisor_razon_social', v)} />
      <Field label="Nº factura" value={form.factura_numero} onChange={v => updateField('factura_numero', v)} />
      <Field label="Fecha emisión" value={form.fecha_emision} onChange={v => updateField('fecha_emision', v)} />
      <Field label="Base imponible" value={form.base_imponible} onChange={v => updateField('base_imponible', v)} keyboardType="decimal-pad" />
      <Field label="% IVA" value={form.tipo_iva} onChange={v => updateField('tipo_iva', v)} keyboardType="decimal-pad" />
      <Field label="Cuota IVA" value={form.cuota_iva} onChange={v => updateField('cuota_iva', v)} keyboardType="decimal-pad" />
      <Field label="Importe total *" value={form.importe_total} onChange={v => updateField('importe_total', v)} keyboardType="decimal-pad" />
      <Field label="Concepto" value={form.concepto} onChange={v => updateField('concepto', v)} multiline />

      <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar factura'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({
  label, value, onChange, keyboardType, multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  keyboardType?: 'default' | 'decimal-pad'
  multiline?: boolean
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        placeholderTextColor="#94A3B8"
      />
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#64748B', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: '#F8FAFC' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 28 },
  saveButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
