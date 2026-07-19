import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native'
import ClientPicker from './ClientPicker'
import type { InvoiceItem, InvoiceInsert } from '../types/database'

const TAX_OPTIONS = [21, 10, 4, 0]

interface InvoiceFormProps {
  onSubmit: (invoice: InvoiceInsert) => Promise<{ error?: { message: string } | null }>
  initialValues?: {
    client_name?: string
    client_nif?: string
    description?: string
    amount?: number
    tax_pct?: number
  }
}

export default function InvoiceForm({ onSubmit, initialValues }: InvoiceFormProps) {
  const [clientName, setClientName] = useState(initialValues?.client_name ?? '')
  const [clientNif, setClientNif] = useState(initialValues?.client_nif ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState(initialValues?.amount?.toString() ?? '')
  const [taxPct, setTaxPct] = useState(initialValues?.tax_pct ?? 21)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const base = qty * price
  const taxAmount = base * (taxPct / 100)
  const total = base + taxAmount

  function isValid() {
    return clientName.trim() && clientNif.trim() && description.trim() && base > 0
  }

  function resetForm() {
    setClientName('')
    setClientNif('')
    setDescription('')
    setQuantity('1')
    setUnitPrice('')
    setTaxPct(21)
    setNotes('')
  }

  async function handleSubmit() {
    if (!isValid()) return

    setSubmitting(true)

    const items: InvoiceItem[] = [{
      description: description.trim(),
      quantity: qty,
      unit_price: price,
      tax_pct: taxPct,
    }]

    const result = await onSubmit({
      user_id: '',
      client_name: clientName.trim(),
      client_nif: clientNif.trim(),
      items,
      base_amount: Math.round(base * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      status: 'sent',
    })

    setSubmitting(false)

    if (result.error) {
      Alert.alert('Error', result.error.message)
    } else {
      resetForm()
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ClientPicker
        clientName={clientName}
        clientNif={clientNif}
        onNameChange={setClientName}
        onNifChange={setClientNif}
      />

      <Text style={styles.label}>Concepto</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reforma baño"
        placeholderTextColor="#94A3B8"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#94A3B8"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Precio unitario (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            value={unitPrice}
            onChangeText={setUnitPrice}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Text style={styles.label}>IVA</Text>
      <View style={styles.taxRow}>
        {TAX_OPTIONS.map((pct) => (
          <TouchableOpacity
            key={pct}
            style={[styles.taxBtn, taxPct === pct && styles.taxBtnActive]}
            onPress={() => setTaxPct(pct)}
          >
            <Text style={[styles.taxBtnText, taxPct === pct && styles.taxBtnTextActive]}>
              {pct}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Base imponible</Text>
          <Text style={styles.summaryValue}>{base.toFixed(2)}€</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>IVA ({taxPct}%)</Text>
          <Text style={styles.summaryValue}>{taxAmount.toFixed(2)}€</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
        </View>
      </View>

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Instrucciones extra, referencia..."
        placeholderTextColor="#94A3B8"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid() || submitting) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid() || submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? 'Creando...' : 'Crear factura'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF', marginBottom: 12,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  taxRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  taxBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  taxBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  taxBtnText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  taxBtnTextActive: { color: '#FFFFFF' },
  summary: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  submitBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    marginBottom: 40,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
})
