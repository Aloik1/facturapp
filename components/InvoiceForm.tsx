import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native'
import ClientPicker from './ClientPicker'
import ItemPicker from './ItemPicker'
import { saveUserItems } from '../services/items'
import type { InvoiceItem, InvoiceInsert } from '../types/database'
import { colors, radii, shadows } from '../lib/theme'

const TAX_OPTIONS = [21, 10, 4, 0]
const UNIT_OPTIONS = ['uds', 'ml', 'm²', 'h', 'kg', 'paq', 'viaje']

interface InvoiceFormProps {
  userId: string
  sector: string
  onSubmit: (invoice: InvoiceInsert) => Promise<{ error?: { message: string } | null }>
}

interface LineItem {
  id: string; description: string; quantity: string; unit: string; unitPrice: string; taxPct: number
}

let lineIdCounter = 0
function nextLineId() { return (++lineIdCounter).toString() }

function newBlankLine(): LineItem {
  return { id: nextLineId(), description: '', quantity: '1', unit: 'uds', unitPrice: '', taxPct: 21 }
}

function calcLine(line: LineItem) {
  const qty = parseFloat(line.quantity) || 0
  const price = parseFloat(line.unitPrice) || 0
  const base = qty * price
  const tax = base * (line.taxPct / 100)
  return { base, tax, total: base + tax }
}

export default function InvoiceForm({ userId, sector, onSubmit }: InvoiceFormProps) {
  const [clientName, setClientName] = useState('')
  const [clientNif, setClientNif] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totals = lines.reduce(
    (acc, line) => { const { base, tax } = calcLine(line); return { base: acc.base + base, tax: acc.tax + tax, total: acc.total + base + tax } },
    { base: 0, tax: 0, total: 0 }
  )

  function addLine(item?: { description: string; unit: string; unit_price: number; tax_pct: number }, prefillDesc?: string) {
    if (item) setLines((prev) => [...prev, { id: nextLineId(), description: item.description, quantity: '1', unit: item.unit, unitPrice: item.unit_price > 0 ? item.unit_price.toFixed(2) : '', taxPct: item.tax_pct }])
    else {
      const blank = newBlankLine()
      if (prefillDesc) blank.description = prefillDesc
      setLines((prev) => [...prev, blank])
    }
  }

  function updateLine(id: string, updates: Partial<LineItem>) { setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l))) }
  function removeLine(id: string) { setLines((prev) => prev.filter((l) => l.id !== id)) }

  function isValid() {
    return clientName.trim() && clientNif.trim() && lines.length > 0 && lines.every((l) => l.description.trim() && (parseFloat(l.unitPrice) || 0) > 0)
  }

  async function handleSubmit() {
    if (!isValid()) return
    setSubmitting(true)
    const items: InvoiceItem[] = lines.map((l) => ({ description: l.description.trim(), quantity: parseFloat(l.quantity) || 1, unit: l.unit, unit_price: parseFloat(l.unitPrice) || 0, tax_pct: l.taxPct }))
    const baseAmount = Math.round(totals.base * 100) / 100
    const taxAmount = Math.round(totals.tax * 100) / 100
    const totalAmount = Math.round(totals.total * 100) / 100
    const result = await onSubmit({ user_id: '', client_name: clientName.trim(), client_nif: clientNif.trim(), items, base_amount: baseAmount, tax_amount: taxAmount, total_amount: totalAmount, status: 'sent' })
    if (!result.error) saveUserItems(userId, items)
    setSubmitting(false)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ClientPicker clientName={clientName} clientNif={clientNif} onNameChange={setClientName} onNifChange={setClientNif} />

      <Text style={styles.sectionTitle}>Partidas</Text>

      <ItemPicker userId={userId} sector={sector} onSelect={(item) => addLine(item)} onAddBlank={(desc?: string) => addLine(undefined, desc)} />

      {lines.map((line) => {
        const { base, total } = calcLine(line)
        return (
          <View key={line.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <TextInput style={styles.itemDesc} placeholder="Descripción" placeholderTextColor={colors.inputPlaceholder}
                value={line.description} onChangeText={(t) => updateLine(line.id, { description: t })} />
              <TouchableOpacity onPress={() => removeLine(line.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemRow}>
              <View style={styles.itemField}>
                <Text style={styles.fieldLabel}>Cant</Text>
                <TextInput style={styles.itemInput} placeholder="1" placeholderTextColor={colors.inputPlaceholder}
                  value={line.quantity} onChangeText={(t) => updateLine(line.id, { quantity: t })} keyboardType="decimal-pad" />
              </View>
              <View style={styles.itemField}>
                <Text style={styles.fieldLabel}>Unidad</Text>
                <View style={styles.unitPicker}>
                  {UNIT_OPTIONS.map((u) => (
                    <TouchableOpacity key={u} style={[styles.unitOption, line.unit === u && styles.unitOptionActive]}
                      onPress={() => updateLine(line.id, { unit: u })}>
                      <Text style={[styles.unitOptionText, line.unit === u && styles.unitOptionTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.itemRow}>
              <View style={styles.itemField}>
                <Text style={styles.fieldLabel}>Precio / ud</Text>
                <TextInput style={styles.itemInput} placeholder="0.00" placeholderTextColor={colors.inputPlaceholder}
                  value={line.unitPrice} onChangeText={(t) => updateLine(line.id, { unitPrice: t })} keyboardType="decimal-pad" />
              </View>
              <View style={styles.itemField}>
                <Text style={styles.fieldLabel}>IVA</Text>
                <View style={styles.taxRowSmall}>
                  {TAX_OPTIONS.map((pct) => (
                    <TouchableOpacity key={pct} style={[styles.taxOption, line.taxPct === pct && styles.taxOptionActive]}
                      onPress={() => updateLine(line.id, { taxPct: pct })}>
                      <Text style={[styles.taxOptionText, line.taxPct === pct && styles.taxOptionTextActive]}>{pct}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.itemTotal}>Total línea: {total.toFixed(2)}€</Text>
          </View>
        )
      })}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Base imponible</Text>
          <Text style={styles.summaryValue}>{totals.base.toFixed(2)}€</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>IVA</Text>
          <Text style={styles.summaryValue}>{totals.tax.toFixed(2)}€</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totals.total.toFixed(2)}€</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notas (opcional)</Text>
      <TextInput style={styles.notesInput} placeholder="Instrucciones extra, referencia..."
        placeholderTextColor={colors.inputPlaceholder} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={[styles.submitBtn, (!isValid() || submitting) && { opacity: 0.5 }]}
        onPress={handleSubmit} disabled={!isValid() || submitting}>
        <Text style={styles.submitBtnText}>{submitting ? 'Creando...' : 'Crear factura'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 4 },
  itemCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemDesc: {
    flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.sm, paddingHorizontal: 10,
    paddingVertical: 8, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg,
  },
  deleteBtn: { marginLeft: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  itemField: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.08 },
  itemInput: {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.sm, paddingHorizontal: 10,
    paddingVertical: 8, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg,
  },
  unitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  unitOption: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6,
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  unitOptionActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  unitOptionText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  unitOptionTextActive: { color: colors.accent },
  taxRowSmall: { flexDirection: 'row', gap: 4 },
  taxOption: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  taxOptionActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  taxOptionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  taxOptionTextActive: { color: colors.accent },
  itemTotal: { fontSize: 13, fontWeight: '600', color: colors.accent, textAlign: 'right', marginTop: 4 },
  summary: {
    backgroundColor: colors.bgTertiary, borderRadius: radii.md, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.textTertiary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.accent },
  notesInput: {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.sm, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: colors.inputBg, marginBottom: 16,
    minHeight: 80, textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 16, alignItems: 'center', marginBottom: 40,
  },
  submitBtnText: { color: colors.textInverse, fontSize: 17, fontWeight: '700' },
})
