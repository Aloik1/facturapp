import { View, Text, StyleSheet } from 'react-native'
import type { Invoice, Profile, SharedInvoiceView } from '../types/database'
import { colors, radii, shadows } from '../lib/theme'

interface InvoicePreviewProps {
  invoice: Partial<Invoice> | SharedInvoiceView
  profile?: Profile
  showBusiness?: boolean
}

function formatCurrency(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0)
  return `${num.toFixed(2)}€`
}

function isSharedView(inv: any): inv is SharedInvoiceView { return 'business_name' in inv }

export default function InvoicePreview({ invoice, profile, showBusiness }: InvoicePreviewProps) {
  const items = invoice.items as Array<{ description: string; quantity: number; unit_price: number; tax_pct: number }> | null
  const sharedView = isSharedView(invoice) ? invoice : null

  return (
    <View style={styles.container}>
      {showBusiness && (sharedView || profile) && (
        <View style={styles.businessSection}>
          <Text style={styles.businessName}>{sharedView?.business_name ?? profile!.business_name}</Text>
          <View style={styles.businessUnderline} />
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
        {invoice.due_date && <Text style={styles.date}>Vencimiento: {invoice.due_date}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.clientName}>{invoice.client_name}</Text>
        <Text style={styles.clientNif}>{invoice.client_nif}</Text>
        {(invoice as any).client_address && <Text style={styles.clientDetail}>{(invoice as any).client_address}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Concepto</Text>
        {items && items.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 3 }]}>Descripción</Text>
              <Text style={[styles.th, { flex: 0.7, textAlign: 'center' }]}>Cant</Text>
              <Text style={[styles.th, { flex: 0.7, textAlign: 'center' }]}>Ud</Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Precio</Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 3 }]}>{item.description}</Text>
                <Text style={[styles.td, { flex: 0.7, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.td, { flex: 0.7, textAlign: 'center' }]}>{item.unit}</Text>
                <Text style={[styles.td, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(item.unit_price)}</Text>
                <Text style={[styles.td, { flex: 1.2, textAlign: 'right', fontWeight: '600' }]}>
                  {formatCurrency(item.quantity * item.unit_price)}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.itemsText}>{items?.[0]?.description || 'Sin detalle'}</Text>
        )}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Base imponible</Text><Text style={styles.totalValue}>{formatCurrency(invoice.base_amount)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>IVA</Text><Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text></View>
        {(invoice as Invoice).irpf_applies && (
          <View style={styles.totalRow}><Text style={styles.totalLabel}>IRPF ({(invoice as Invoice).irpf_percent}%)</Text><Text style={[styles.totalValue, { color: colors.danger }]}>-{formatCurrency((invoice as Invoice).irpf_amount)}</Text></View>
        )}
        <View style={[styles.totalRow, styles.grandTotalRow]}><Text style={styles.grandTotalLabel}>Total</Text><Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_amount)}</Text></View>
      </View>

      {'status' in invoice && invoice.status && (
        <View style={[styles.statusBadge, {
          backgroundColor: invoice.status === 'paid' ? colors.successBg : invoice.status === 'sent' ? colors.accentDim : invoice.status === 'draft' ? colors.bgTertiary : colors.dangerBg,
        }]}>
          <Text style={[styles.statusText, {
            color: invoice.status === 'paid' ? colors.success : invoice.status === 'sent' ? colors.accent : invoice.status === 'draft' ? colors.textTertiary : colors.danger,
          }]}>
            {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'sent' ? 'Enviada' : invoice.status === 'draft' ? 'Borrador' : 'Cancelada'}
          </Text>
        </View>
      )}

      {'notes' in invoice && invoice.notes && (
        <View style={styles.notes}><Text style={styles.notesLabel}>Notas:</Text><Text style={styles.notesText}>{invoice.notes}</Text></View>
      )}

      {showBusiness && (sharedView?.default_footer ?? profile?.default_footer) && (
        <Text style={styles.footer}>{sharedView?.default_footer ?? profile!.default_footer}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2725', borderRadius: radii.lg, padding: 24,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  businessSection: { marginBottom: 20, alignItems: 'center' },
  businessName: { fontSize: 20, fontWeight: '700', color: colors.accent },
  businessUnderline: { width: 32, height: 2, backgroundColor: colors.accent, opacity: 0.4, marginTop: 8, marginBottom: 8 },
  businessNif: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  businessDetail: { fontSize: 13, color: colors.textTertiary, marginTop: 2, textAlign: 'center' },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, letterSpacing: 2 },
  number: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  date: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 8 },
  clientName: { fontSize: 16, fontWeight: '600', color: colors.text },
  clientNif: { fontSize: 14, color: colors.textTertiary, marginTop: 2 },
  clientDetail: { fontSize: 14, color: colors.textTertiary, marginTop: 2 },
  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.08 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { fontSize: 14, color: colors.text },
  itemsText: { fontSize: 15, color: colors.text },
  totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: colors.textTertiary },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: colors.accent },
  statusBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '600' },
  notes: { marginBottom: 12 },
  notesLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.08, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footer: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
})
