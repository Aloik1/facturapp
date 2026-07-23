import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { searchClients, createClient } from '../services/clients'
import type { Client } from '../types/database'
import { colors, radii } from '../lib/theme'

interface ClientPickerProps {
  clientName: string
  clientNif: string
  onNameChange: (name: string) => void
  onNifChange: (nif: string) => void
}

export default function ClientPicker({ clientName, clientNif, onNameChange, onNifChange }: ClientPickerProps) {
  const [suggestions, setSuggestions] = useState<Client[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState(clientName)
  const [formNif, setFormNif] = useState(clientNif)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const blurRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setFormName(clientName)
    setFormNif(clientNif)
  }, [clientName, clientNif])

  useEffect(() => {
    if (formName.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { data } = await searchClients(formName)
      if (data) {
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      }
    }, 300)
  }, [formName])

  function handleSelect(client: Client) {
    onNameChange(client.name)
    onNifChange(client.nif)
    setShowSuggestions(false)
  }

  function handleFocus() {
    if (formName.length >= 2) setShowSuggestions(suggestions.length > 0)
  }

  function handleBlur() {
    blurRef.current = setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  async function handleCreate() {
    if (!formName.trim() || !formNif.trim()) return
    setCreating(true)
    await createClient({
      user_id: '',
      name: formName.trim(),
      nif: formNif.trim(),
      email: null,
      phone: null,
      address: null,
      default_tax_pct: null,
      default_payment_days: null,
      notes: null,
    })
    setCreating(false)
    setShowSuggestions(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cliente</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del cliente"
        placeholderTextColor={colors.inputPlaceholder}
        value={formName}
        onChangeText={(t) => { onNameChange(t); setShowSuggestions(t.length >= 2) }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <TextInput
        style={styles.input}
        placeholder="NIF / CIF"
        placeholderTextColor={colors.inputPlaceholder}
        value={formNif}
        onChangeText={onNifChange}
        autoCapitalize="characters"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {showSuggestions && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionNif}>{item.nif}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={() => (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreate}
                disabled={!formName.trim() || !formNif.trim() || creating}
              >
                <Text style={styles.createBtnText}>
                  {creating ? 'Guardando...' : `+ Guardar "${formName}" como cliente`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, zIndex: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.bgCard,
    marginBottom: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionName: { fontSize: 15, fontWeight: '500', color: colors.text },
  suggestionNif: { fontSize: 13, color: colors.textTertiary },
  createBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
})
