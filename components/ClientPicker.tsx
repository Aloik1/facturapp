import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { searchClients, createClient } from '../services/clients'
import type { Client } from '../types/database'

interface ClientPickerProps {
  clientName: string
  clientNif: string
  onNameChange: (name: string) => void
  onNifChange: (nif: string) => void
  onClientSelect?: (client: Client) => void
}

export default function ClientPicker({
  clientName,
  clientNif,
  onNameChange,
  onNifChange,
  onClientSelect,
}: ClientPickerProps) {
  const [suggestions, setSuggestions] = useState<Client[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (clientName.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { data } = await searchClients(clientName)
      if (data) {
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      }
    }, 300)
  }, [clientName])

  function handleSelect(client: Client) {
    onNameChange(client.name)
    onNifChange(client.nif)
    setShowSuggestions(false)
    onClientSelect?.(client)
  }

  async function handleSaveAsClient() {
    if (!clientName.trim() || !clientNif.trim()) return
    setSaving(true)
    const { data } = await createClient({
      user_id: '',
      name: clientName.trim(),
      nif: clientNif.trim(),
      email: null,
      phone: null,
      address: null,
      default_tax_pct: null,
      default_payment_days: null,
      notes: null,
    })
    setSaving(false)
    if (data) onClientSelect?.(data)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cliente</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del cliente"
        placeholderTextColor="#94A3B8"
        value={clientName}
        onChangeText={(t) => { onNameChange(t); setShowSuggestions(true) }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
      />

      {showSuggestions && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionNif}>{item.nif}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="NIF / CIF"
        placeholderTextColor="#94A3B8"
        value={clientNif}
        onChangeText={onNifChange}
        autoCapitalize="characters"
      />

      {clientName.trim().length > 0 && clientNif.trim().length > 0 && suggestions.length === 0 && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAsClient} disabled={saving}>
          <Text style={styles.saveBtnText}>
            {saving ? 'Guardando...' : 'Guardar como cliente'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF', marginBottom: 8,
  },
  suggestions: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#FFFFFF',
    marginBottom: 8, maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  suggestionName: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
  suggestionNif: { fontSize: 13, color: '#64748B', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
})
