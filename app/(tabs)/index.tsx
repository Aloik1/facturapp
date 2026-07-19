import { useState, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Platform, RefreshControl } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { listInvoices } from '../../services/invoices'
import type { Invoice } from '../../types/database'

const STATUS_LABELS: Record<string, string> = {
  all: 'Todas',
  sent: 'Enviadas',
  paid: 'Pagadas',
  draft: 'Borradores',
  cancelled: 'Canceladas',
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

  useFocusEffect(useCallback(() => {
    loadInvoices()
  }, [session]))

  async function onRefresh() {
    setRefreshing(true)
    await loadInvoices()
    setRefreshing(false)
  }

  const filtered = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.client_name.toLowerCase().includes(q) ||
      inv.client_nif.toLowerCase().includes(q) ||
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.notes && inv.notes.toLowerCase().includes(q))
    )
  })

  const isWeb = Platform.OS === 'web'

  function statusColor(status: string) {
    switch (status) {
      case 'paid': return { bg: '#DCFCE7', text: '#16A34A', label: 'Pagada' }
      case 'sent': return { bg: '#DBEAFE', text: '#2563EB', label: 'Enviada' }
      case 'draft': return { bg: '#F1F5F9', text: '#64748B', label: 'Borrador' }
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelada' }
      default: return { bg: '#F1F5F9', text: '#64748B', label: status }
    }
  }

  function renderCard({ item }: { item: Invoice }) {
    const st = statusColor(item.status)
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
          <Text style={styles.cardTotal}>{item.total_amount.toFixed(2)}€</Text>
        </View>
      </TouchableOpacity>
    )
  }

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
          placeholderTextColor="#94A3B8"
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
        <Text style={styles.emptyText}>Cargando...</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {invoices.length === 0
              ? 'No tienes facturas todavía. Crea tu primera factura.'
              : 'No hay facturas que coincidan con los filtros.'}
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(tabs)/new')}>
            <Text style={styles.createBtnText}>Crear factura</Text>
          </TouchableOpacity>
        </View>
      ) : isWeb ? (
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNum]}>Factura</Text>
            <Text style={[styles.th, styles.colClient]}>Cliente</Text>
            <Text style={[styles.th, styles.colNif]}>NIF</Text>
            <Text style={[styles.th, styles.colDate]}>Fecha</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
            <Text style={[styles.th, styles.colStatus]}>Estado</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={({ item }) => {
              const st = statusColor(item.status)
              return (
                <TouchableOpacity style={styles.tableRow} onPress={() => router.push(`/invoice/${item.id}`)}>
                  <Text style={[styles.td, styles.colNum]}>{item.invoice_number}</Text>
                  <Text style={[styles.td, styles.colClient]} numberOfLines={1}>{item.client_name}</Text>
                  <Text style={[styles.td, styles.colNif]}>{item.client_nif}</Text>
                  <Text style={[styles.td, styles.colDate]}>{item.issue_date}</Text>
                  <Text style={[styles.td, styles.colTotal]}>{item.total_amount.toFixed(2)}€</Text>
                  <View style={[styles.colStatus]}>
                    <View style={[styles.badgeSmall, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeSmallText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  count: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  controls: { paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  searchInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, backgroundColor: '#F8FAFC', marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterBtnActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, color: '#64748B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  createBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  createBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Mobile card list
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardClient: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  cardNif: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 14, color: '#94A3B8' },
  cardTotal: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  // Web table
  tableWrapper: { flex: 1, paddingHorizontal: 24 },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  th: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  td: { fontSize: 14, color: '#0F172A' },
  colNum: { flex: 1.5 },
  colClient: { flex: 2.5 },
  colNif: { flex: 1.5 },
  colDate: { flex: 1.5 },
  colTotal: { flex: 1, textAlign: 'right' },
  colStatus: { flex: 1, alignItems: 'flex-end' },
  badgeSmall: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  badgeSmallText: { fontSize: 12, fontWeight: '500' },
})
