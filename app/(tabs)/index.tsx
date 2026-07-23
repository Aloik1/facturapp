import { useState, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Platform, RefreshControl } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { listInvoices } from '../../services/invoices'
import type { Invoice } from '../../types/database'
import { colors, radii, shadows } from '../../lib/theme'

const STATUS_LABELS: Record<string, string> = {
  all: 'Todas', sent: 'Enviadas', paid: 'Pagadas', draft: 'Borradores', cancelled: 'Canceladas',
}

function statusStyle(status: string) {
  switch (status) {
    case 'paid': return { bg: colors.successBg, text: colors.success, label: 'Pagada' }
    case 'sent': return { bg: colors.accentDim, text: colors.accent, label: 'Enviada' }
    case 'draft': return { bg: colors.bgTertiary, text: colors.textTertiary, label: 'Borrador' }
    case 'cancelled': return { bg: colors.dangerBg, text: colors.danger, label: 'Cancelada' }
    default: return { bg: colors.bgTertiary, text: colors.textTertiary, label: status }
  }
}

export default function InvoicesScreen() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  async function loadInvoices() {
    if (!session?.user?.id) return
    const { data } = await listInvoices()
    if (data) setInvoices(data)
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { loadInvoices() }, [session]))

  async function onRefresh() { setRefreshing(true); await loadInvoices(); setRefreshing(false) }

  const filtered = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false
    if (!search) return true
    const q = search.toLowerCase()
    return inv.client_name.toLowerCase().includes(q) || inv.client_nif.toLowerCase().includes(q) ||
      inv.invoice_number.toLowerCase().includes(q) || (inv.notes && inv.notes.toLowerCase().includes(q))
  })

  const isWeb = Platform.OS === 'web'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Facturas</Text>
        <Text style={styles.count}>{filtered.length} facturas</Text>
      </View>

      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente, NIF, nº factura..."
          placeholderTextColor={colors.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterRow}>
          {(['all', 'sent', 'paid', 'draft', 'cancelled'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filterStatus === f && styles.filterBtnActive]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[styles.filterText, filterStatus === f && styles.filterTextActive]}>
                {STATUS_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <Text style={[styles.emptyText, { marginTop: 60 }]}>Cargando...</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {invoices.length === 0 ? 'No tienes facturas todavía. Crea tu primera factura.' : 'No hay facturas que coincidan con los filtros.'}
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(tabs)/new')}>
            <Text style={styles.createBtnText}>Crear factura</Text>
          </TouchableOpacity>
        </View>
      ) : isWeb ? (
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>Factura</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>Cliente</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>NIF</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Fecha</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Estado</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={({ item }) => {
              const st = statusStyle(item.status)
              return (
                <TouchableOpacity style={styles.tableRow} onPress={() => router.push(`/invoice/${item.id}`)}>
                  <Text style={[styles.td, { flex: 1.5 }]}>{item.invoice_number}</Text>
                  <Text style={[styles.td, { flex: 2.5 }]} numberOfLines={1}>{item.client_name}</Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>{item.client_nif}</Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>{item.issue_date}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>{item.total_amount.toFixed(2)}€</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={[styles.badgeSmall, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeSmallText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const st = statusStyle(item.status)
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/invoice/${item.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardClient} numberOfLines={1}>{item.client_name}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardNif}>{item.client_nif} · {item.invoice_number}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>{item.issue_date}</Text>
                  <Text style={[styles.cardTotal, { color: st.text }]}>{item.total_amount.toFixed(2)}€</Text>
                </View>
              </TouchableOpacity>
            )
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 24, fontWeight: '600', color: colors.text, letterSpacing: -0.02 },
  count: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
  controls: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12, backgroundColor: colors.bgCard },
  searchInput: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.text, marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  filterText: { fontSize: 13, color: colors.textTertiary },
  filterTextActive: { color: colors.accent, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: colors.textTertiary, textAlign: 'center', lineHeight: 24 },
  createBtn: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  createBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border, ...shadows.soft,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardClient: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  cardNif: { fontSize: 13, color: colors.textTertiary, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 14, color: colors.textTertiary },
  cardTotal: { fontSize: 18, fontWeight: '700' },
  tableWrapper: { flex: 1, paddingHorizontal: 24 },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  th: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.08 },
  tableRow: {
    flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    alignItems: 'center',
  },
  td: { fontSize: 14, color: colors.textSecondary },
  badgeSmall: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  badgeSmallText: { fontSize: 12, fontWeight: '500' },
})
