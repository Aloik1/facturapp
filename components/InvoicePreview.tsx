import { View, Text, StyleSheet } from 'react-native'
import type { Invoice, Profile, SharedInvoiceView } from '../types/database'

interface InvoicePreviewProps {
  invoice: Partial<Invoice> | SharedInvoiceView
  profile?: Profile
  showBusiness?: boolean
}

function formatCurrency(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0)
  return `${num.toFixed(2)}€`
}

function isSharedView(inv: any): inv is SharedInvoiceView {
  return 'business_name' in inv
}

export default function InvoicePreview({ invoice, profile, showBusiness }: InvoicePreviewProps) {
  const items = invoice.items as Array<{ description: string; quantity: number; unit_price: number; tax_pct: number }> | null
  const sharedView = isSharedView(invoice) ? invoice : null

  return (
    <View style={styles.container}>
      {showBusiness && (sharedView || profile) && (
        <View style={styles.businessSection}>
          <Text style={styles.businessName}>{sharedView?.business_name ?? profile!.business_name}</Text>
          <Text style={styles.businessNif}>{sharedView?.business_nif ?? profile!.business_nif}</Text>
          {(sharedView?.business_address ?? profile?.address) ? (
            <Text style={styles.businessDetail}>{sharedView?.business_address ?? profile!.address}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>FACTURA</Text>
        <Text style={styles.number}>{invoice.invoice_number}</Text>
        <Text style={styles.date}>Fecha: {invoice.issue_date}</Text>
        {invoice.due_date && (
          <Text style={styles.date}>Vencimiento: {invoice.due_date}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.clientName}>{invoice.client_name}</Text>
        <Text style={styles.clientNif}>{invoice.client_nif}</Text>
        {(invoice as any).client_address && (
          <Text style={styles.clientDetail}>{(invoice as any).client_address}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Concepto</Text>
        {items && items.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
              <Text style={[styles.th, styles.colQty]}>Cant</Text>
              <Text style={[styles.th, styles.colUnit]}>Ud</Text>
              <Text style={[styles.th, styles.colPrice]}>Precio</Text>
              <Text style={[styles.th, styles.colTotal]}>Total</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.td, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                <Text style={[styles.td, styles.colTotal]}>
                  {formatCurrency(item.quantity * item.unit_price)}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.itemsText}>
            {items?.[0]?.description || 'Sin detalle'}
          </Text>
        )}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Base imponible</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.base_amount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
        </View>
        {(invoice as Invoice).irpf_applies && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IRPF ({(invoice as Invoice).irpf_percent}%)</Text>
            <Text style={[styles.totalValue, { color: '#DC2626' }]}>
              -{formatCurrency((invoice as Invoice).irpf_amount)}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
        </View>
      </View>

      {'status' in invoice && invoice.status && (
        <View style={[styles.statusBadge, {
          backgroundColor: invoice.status === 'paid' ? '#DCFCE7' :
            invoice.status === 'sent' ? '#DBEAFE' :
            invoice.status === 'draft' ? '#F1F5F9' : '#FEE2E2',
        }]}>
          <Text style={[styles.statusText, {
            color: invoice.status === 'paid' ? '#16A34A' :
              invoice.status === 'sent' ? '#2563EB' :
              invoice.status === 'draft' ? '#64748B' : '#DC2626',
          }]}>
            {invoice.status === 'paid' ? 'Pagada' :
             invoice.status === 'sent' ? 'Enviada' :
             invoice.status === 'draft' ? 'Borrador' : 'Cancelada'}
          </Text>
        </View>
      )}

      {'notes' in invoice && invoice.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notas:</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {showBusiness && (sharedView?.default_footer ?? profile?.default_footer) && (
        <Text style={styles.footer}>{sharedView?.default_footer ?? profile!.default_footer}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  businessSection: { marginBottom: 20, alignItems: 'center' },
  businessName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  businessNif: { fontSize: 13, color: '#64748B', marginTop: 2 },
  businessDetail: { fontSize: 13, color: '#64748B', marginTop: 2, textAlign: 'center' },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 2 },
  number: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  date: { fontSize: 13, color: '#64748B', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  clientNif: { fontSize: 14, color: '#64748B', marginTop: 2 },
  clientDetail: { fontSize: 14, color: '#64748B', marginTop: 2 },
  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  th: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 14, color: '#0F172A' },
  colDesc: { flex: 3 },
  colQty: { flex: 0.7, textAlign: 'center' },
  colUnit: { flex: 0.7, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  itemsText: { fontSize: 15, color: '#0F172A' },
  totals: {
    borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginBottom: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  statusBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '600' },
  notes: { marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  footer: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
})
