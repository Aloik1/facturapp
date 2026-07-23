import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { getSuggestions } from '../services/items'
import type { CommonItem, UserItem } from '../types/database'

type SuggestionItem = (UserItem | CommonItem) & { _type: 'user' | 'common' }

interface ItemPickerProps {
  userId: string
  sector: string
  onSelect: (item: { description: string; unit: string; unit_price: number; tax_pct: number }) => void
  onAddBlank: () => void
}

function formatPrice(n: number) {
  return n.toFixed(2) + '€'
}

export default function ItemPicker({ userId, sector, onSelect, onAddBlank }: ItemPickerProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const blurRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!focused) {
      setShowSuggestions(false)
      return
    }

    clearTimeout(debounceRef.current)

    if (query.length === 0) {
      debounceRef.current = setTimeout(async () => {
        const items = await getSuggestions(userId, sector)
        setSuggestions(items.map((i) => ({ ...i, _type: 'user' in i ? 'user' as const : 'common' as const })))
        setShowSuggestions(items.length > 0)
      }, 200)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const items = await getSuggestions(userId, sector, query)
      setSuggestions(items.map((i) => ({ ...i, _type: 'user' in i ? 'user' as const : 'common' as const })))
      setShowSuggestions(items.length > 0)
    }, 300)
  }, [query, userId, sector, focused])

  function handleFocus() {
    setFocused(true)
  }

  function handleBlur() {
    blurRef.current = setTimeout(() => {
      setFocused(false)
    }, 200)
  }

  function handleSelect(item: SuggestionItem) {
    onSelect({
      description: item.description,
      unit: item.unit,
      unit_price: item.unit_price,
      tax_pct: item.tax_pct,
    })
    setQuery('')
    setFocused(false)
    clearTimeout(blurRef.current)
  }

  function handleAddBlank() {
    onAddBlank()
    setQuery('')
    setFocused(false)
    clearTimeout(blurRef.current)
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Buscar partida..."
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={(t) => { setQuery(t) }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {showSuggestions && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => ('user_id' in item ? 'u-' + item.id : 'c-' + item.id)}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={() => query.length === 0 ? (
              <TouchableOpacity style={styles.blankBtn} onPress={handleAddBlank}>
                <Text style={styles.blankBtnText}>+ Partida vacía</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => {
              const total = item.unit_price
              return (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                  <View style={styles.suggestionLeft}>
                    <Text style={styles.suggestionDesc}>{item.description}</Text>
                    <Text style={styles.suggestionMeta}>
                      {item.unit_price > 0 ? `${formatPrice(item.unit_price)} / ${item.unit}` : 'Sin precio'}
                    </Text>
                  </View>
                  <Text style={styles.suggestionBadge}>
                    {'user_id' in item ? 'Tuyo' : item.sector.slice(0, 4)}
                  </Text>
                </TouchableOpacity>
              )
            }}
            ListFooterComponent={() => (
              <TouchableOpacity style={styles.blankBtn} onPress={handleAddBlank}>
                <Text style={styles.blankBtnText}>+ Partida vacía</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {query.length > 0 && !showSuggestions && (
        <TouchableOpacity style={styles.blankBtn} onPress={handleAddBlank}>
          <Text style={styles.blankBtnText}>+ Crear "{query}"</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12, zIndex: 10 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF',
  },
  suggestions: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#FFFFFF',
    marginTop: 4, maxHeight: 260,
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  suggestionLeft: { flex: 1 },
  suggestionDesc: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
  suggestionMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  suggestionBadge: { fontSize: 11, color: '#94A3B8', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  blankBtn: {
    paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  blankBtnText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
})
