import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Platform, RefreshControl, Alert } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { listInvoices } from '../../services/invoices'
import { exportPDF, exportExcel } from '../../services/export'
import type { Invoice } from '../../types/database'

export default function InvoicesScreen() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPagada, setFilterPagada] = useState<'all' | 'pagada' | 'pendiente'>('all')
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null)

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

  const filtered = invoices
    .filter(inv => {
      if (filterPagada === 'pagada' && !inv.pagada) return false
      if (filterPagada === 'pendiente' && inv.pagada) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        inv.emisor_razon_social.toLowerCase().includes(q) ||
        inv.emisor_nif.toLowerCase().includes(q) ||
        inv.concepto.toLowerCase().includes(q) ||
        inv.factura_numero.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())

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
          placeholder="Buscar por proveedor, NIF, concepto..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterRow}>
          {(['all', 'pendiente', 'pagada'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filterPagada === f && styles.filterBtnActive]}
              onPress={() => setFilterPagada(f)}
            >
              <Text style={[styles.filterText, filterPagada === f && styles.filterTextActive]}>
                {f === 'all' ? 'Todas' : f === 'pagada' ? 'Pagadas' : 'Pendientes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filtered.length > 0 && (
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.exportBtn, exporting === 'pdf' && styles.exportBtnDisabled]}
            onPress={async () => { setExporting('pdf'); await exportPDF(filtered); setExporting(null) }}
            disabled={!!exporting}
          >
            <Text style={styles.exportText}>
              {exporting === 'pdf' ? 'Generando...' : 'PDF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, exporting === 'xlsx' && styles.exportBtnDisabled]}
            onPress={async () => { setExporting('xlsx'); await exportExcel(filtered); setExporting(null) }}
            disabled={!!exporting}
          >
            <Text style={styles.exportText}>
              {exporting === 'xlsx' ? 'Generando...' : 'Excel'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <Text style={styles.emptyText}>Cargando...</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {invoices.length === 0
              ? 'No tienes facturas todavía. Escanea tu primera factura.'
              : 'No hay facturas que coincidan con los filtros.'}
          </Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(tabs)/scan')}>
            <Text style={styles.scanBtnText}>Escanear factura</Text>
          </TouchableOpacity>
        </View>
      ) : isWeb ? (
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colEmisor]}>Proveedor</Text>
            <Text style={[styles.th, styles.colNif]}>NIF</Text>
            <Text style={[styles.th, styles.colNum]}>Factura</Text>
            <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
            <Text style={[styles.th, styles.colEstado]}>Estado</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.td, styles.colEmisor]} numberOfLines={1}>{item.emisor_razon_social}</Text>
                <Text style={[styles.td, styles.colNif]}>{item.emisor_nif}</Text>
                <Text style={[styles.td, styles.colNum]} numberOfLines={1}>{item.factura_numero}</Text>
                <Text style={[styles.td, styles.colFecha]}>{item.fecha_emision}</Text>
                <Text style={[styles.td, styles.colTotal]}>{item.importe_total.toFixed(2)}€</Text>
                <Text style={[styles.td, styles.colEstado, { color: item.pagada ? '#16A34A' : '#DC2626' }]}>
                  {item.pagada ? 'Pagada' : 'Pendiente'}
                </Text>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardEmisor} numberOfLines={1}>{item.emisor_razon_social}</Text>
                <View style={[styles.badge, { backgroundColor: item.pagada ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: item.pagada ? '#16A34A' : '#DC2626' }]}>
                    {item.pagada ? 'Pagada' : 'Pendiente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardNif}>{item.emisor_nif} · {item.factura_numero}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardFecha}>{item.fecha_emision}</Text>
                <Text style={styles.cardTotal}>{item.importe_total.toFixed(2)}€</Text>
              </View>
            </View>
          )}
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
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterBtnActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, color: '#64748B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  scanBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  scanBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  exportRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  exportBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  exportBtnDisabled: { opacity: 0.6 },
  exportText: { fontSize: 14, fontWeight: '600', color: '#475569' },

  // Mobile card list
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardEmisor: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  cardNif: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFecha: { fontSize: 14, color: '#94A3B8' },
  cardTotal: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  // Web table
  tableWrapper: { flex: 1, paddingHorizontal: 24 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  th: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 14, color: '#0F172A' },
  colEmisor: { flex: 3 },
  colNif: { flex: 1.5 },
  colNum: { flex: 2 },
  colFecha: { flex: 1.5 },
  colTotal: { flex: 1, textAlign: 'right' },
  colEstado: { flex: 1, textAlign: 'right' },
})
