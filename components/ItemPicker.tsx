import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { getSuggestions } from '../services/items'
import type { CommonItem, UserItem } from '../types/database'
import { colors, radii } from '../lib/theme'

type SuggestionItem = (UserItem | CommonItem) & { _type: 'user' | 'common' }

interface ItemPickerProps {
  userId: string; sector: string
  onSelect: (item: { description: string; unit: string; unit_price: number; tax_pct: number }) => void
  onAddBlank: () => void
}

function formatPrice(n: number) { return n.toFixed(2) + '€' }

export default function ItemPicker({ userId, sector, onSelect, onAddBlank }: ItemPickerProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const blurRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!focused) { setShowSuggestions(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const items = await getSuggestions(userId, sector, query || undefined)
      setSuggestions(items.map((i) => ({ ...i, _type: 'user_id' in i ? 'user' as const : 'common' as const })))
      setShowSuggestions(true)
    }, query ? 300 : 200)
  }, [query, userId, sector, focused])

  function handleFocus() { setFocused(true) }
  function handleBlur() { blurRef.current = setTimeout(() => setFocused(false), 200) }

  function handleSelect(item: SuggestionItem) {
    onSelect({ description: item.description, unit: item.unit, unit_price: item.unit_price, tax_pct: item.tax_pct })
    setQuery(''); setFocused(false); clearTimeout(blurRef.current)
  }

  function handleAddBlank() { onAddBlank(); setQuery(''); setFocused(false); clearTimeout(blurRef.current) }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Buscar partida..." placeholderTextColor={colors.inputPlaceholder}
        value={query} onChangeText={(t) => setQuery(t)} onFocus={handleFocus} onBlur={handleBlur} />

      {showSuggestions && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => ('user_id' in item ? 'u-' + item.id : 'c-' + item.id)}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            ListHeaderComponent={() => query.length === 0 ? (
              <TouchableOpacity style={styles.blankBtn} onPress={handleAddBlank}>
                <Text style={styles.blankBtnText}>+ Partida vacía</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => (
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
            )}
            ListFooterComponent={() => query.length > 0 && suggestions.length === 0 ? (
              <TouchableOpacity style={styles.blankBtn} onPress={handleAddBlank}>
                <Text style={styles.blankBtnText}>+ Crear "{query}"</Text>
              </TouchableOpacity>
            ) : null}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12, zIndex: 10 },
  input: {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radii.sm, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: colors.inputBg,
  },
  suggestions: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm,
    backgroundColor: colors.bgCard, marginTop: 4, maxHeight: 260,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } : {}),
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  suggestionLeft: { flex: 1 },
  suggestionDesc: { fontSize: 15, fontWeight: '500', color: colors.text },
  suggestionMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  suggestionBadge: {
    fontSize: 11, color: colors.textTertiary, backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  blankBtn: {
    paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  blankBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
})
