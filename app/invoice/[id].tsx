import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { getInvoice, updateInvoice, deleteInvoice } from '../../services/invoices'
import { generateShareToken, revokeShareToken, buildShareUrl } from '../../services/share'
import { getProfile } from '../../services/profiles'
import InvoicePreview from '../../components/InvoicePreview'
import type { Invoice, InvoiceItem, Profile } from '../../types/database'

function buildInvoiceHtml(inv: Invoice, prof: Profile | null): string {
  const items = inv.items as InvoiceItem[]
  const fmt = (n: number) => `${n.toFixed(2)}€`
  const statusLabel = inv.status === 'paid' ? 'Pagada'
    : inv.status === 'sent' ? 'Enviada'
    : inv.status === 'draft' ? 'Borrador' : 'Cancelada'

  const statusClass = inv.status === 'paid' ? 'paid'
    : inv.status === 'sent' ? 'sent'
    : inv.status === 'draft' ? 'draft' : 'cancelled'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura ${inv.invoice_number}</title>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;padding:40px;color:#1e293b}
  .center{text-align:center}.right{text-align:right}
  .business{text-align:center;margin-bottom:32px}
  .business h1{font-size:22px;margin:0}
  .business p{font-size:13px;color:#64748b;margin:2px 0}
  .header{text-align:center;margin-bottom:32px}
  .header h2{font-size:12px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin:0}
  .header .num{font-size:24px;font-weight:700;margin:4px 0}
  .header .date{font-size:13px;color:#64748b;margin:2px 0}
  .section{margin-bottom:24px}
  .section h3{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .cname{font-size:16px;font-weight:600}
  .cdetail{font-size:14px;color:#64748b}
  table{width:100%;border-collapse:collapse}
  th{font-size:11px;color:#94a3b8;text-transform:uppercase;padding:8px 4px;border-bottom:2px solid #e2e8f0}
  td{font-size:14px;padding:10px 4px;border-bottom:1px solid #f1f5f9}
  .col-desc{text-align:left}.col-qty{text-align:center}.col-unit{text-align:center}.col-price{text-align:right}.col-total{text-align:right}
  .totals{margin-top:16px;border-top:2px solid #e2e8f0;padding-top:12px}
  .tr{display:flex;justify-content:space-between;padding:4px 0}
  .tl{font-size:14px;color:#64748b}.tv{font-size:14px;font-weight:600}
  .gt{border-top:1px solid #e2e8f0;margin-top:4px;padding-top:8px}
  .gt .tl{font-size:16px;font-weight:700;color:#1e293b}
  .gt .tv{font-size:20px;font-weight:700;color:#2563eb}
  .badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;margin-top:8px}
  .badge.paid{background:#dcfce7;color:#16a34a}.badge.sent{background:#dbeafe;color:#2563eb}
  .badge.draft{background:#f1f5f9;color:#64748b}.badge.cancelled{background:#fee2e2;color:#dc2626}
  .footer{text-align:center;font-size:13px;color:#94a3b8;font-style:italic;margin-top:32px}
  @media print{body{padding:20px}}
</style></head><body>
${prof ? `
<div class="business">
  <h1>${prof.business_name}</h1>
  <p>${prof.business_nif}</p>
  ${prof.address ? `<p>${prof.address}</p>` : ''}
</div>` : ''}
<div class="header">
  <h2>Factura</h2>
  <div class="num">${inv.invoice_number}</div>
  <div class="date">Fecha: ${inv.issue_date}</div>
  ${inv.due_date ? `<div class="date">Vencimiento: ${inv.due_date}</div>` : ''}
  <div class="badge ${statusClass}">${statusLabel}</div>
</div>
<div class="section">
  <h3>Cliente</h3>
  <div class="cname">${inv.client_name}</div>
  <div class="cdetail">${inv.client_nif}</div>
  ${inv.client_address ? `<div class="cdetail">${inv.client_address}</div>` : ''}
</div>
<div class="section">
  <h3>Concepto</h3>
  <table>
    <tr><th class="col-desc">Descripción</th><th class="col-qty">Cant</th><th class="col-unit">Ud</th><th class="col-price">Precio</th><th class="col-total">Total</th></tr>
    ${items.map(i => `<tr><td>${i.description}</td><td class="center">${i.quantity}</td><td class="center">${i.unit}</td><td class="right">${fmt(i.unit_price)}</td><td class="right">${fmt(i.quantity * i.unit_price)}</td></tr>`).join('')}
  </table>
</div>
<div class="totals">
  <div class="tr"><span class="tl">Base imponible</span><span class="tv">${fmt(inv.base_amount)}</span></div>
  <div class="tr"><span class="tl">IVA</span><span class="tv">${fmt(inv.tax_amount)}</span></div>
  ${inv.irpf_applies ? `<div class="tr"><span class="tl">IRPF (${inv.irpf_percent}%)</span><span class="tv" style="color:#dc2626">-${fmt(inv.irpf_amount || 0)}</span></div>` : ''}
  <div class="gt tr"><span class="tl">Total</span><span class="tv">${fmt(inv.total_amount)}</span></div>
</div>
${inv.notes ? `<div class="section"><h3>Notas</h3><p style="font-size:14px;color:#64748b">${inv.notes}</p></div>` : ''}
${prof?.default_footer ? `<div class="footer">${prof.default_footer}</div>` : ''}
</body></html>`
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    if (!id) return
    const { data } = await getInvoice(id)
    setInvoice(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (session?.user?.id) {
      getProfile(session.user.id).then(({ data }) => setProfile(data))
    }
  }, [session])

  async function handleShare() {
    if (!invoice || !id) return
    setActionLoading('share')

    let token = invoice.share_token
    let url: string | null = null

    if (token && invoice.share_expires_at && new Date(invoice.share_expires_at) > new Date()) {
      url = buildShareUrl(token)
    } else {
      const result = await generateShareToken(id)
      url = result.url
      if (url) { token = invoice.share_token; load() }
    }

    setActionLoading(null)

    if (!url) {
      Alert.alert('Error', 'No se pudo generar el enlace')
      return
    }

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(url)
        Alert.alert('Enlace copiado', url)
      } catch {
        Alert.alert('Compartir', url)
      }
    } else {
      try {
        const Linking = require('expo-linking')
        const Share = require('react-native').Share
        await Share.share({ message: url, title: `Factura ${invoice.invoice_number}` })
      } catch {
        Alert.alert('Compartir', url)
      }
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id) return
    setActionLoading('status')
    await updateInvoice(id, { status: newStatus as any })
    setActionLoading(null)
    load()
  }

  async function handleDelete() {
    if (!id) return
    Alert.alert('Eliminar factura', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setActionLoading('delete')
          await deleteInvoice(id)
          setActionLoading(null)
          router.back()
        },
      },
    ])
  }

  async function handlePrint() {
    if (!invoice) return
    setActionLoading('print')
    const html = buildInvoiceHtml(invoice, profile)

    try {
      if (Platform.OS === 'web') {
        const w = window.open('')
        if (w) {
          w.document.write(html)
          w.document.close()
          w.focus()
          w.print()
        }
      } else {
        const Print = require('expo-print')
        const { uri } = await Print.printToFileAsync({ html })
        const Sharing = require('expo-sharing')
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Factura ${invoice.invoice_number}`,
          })
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF')
    }

    setActionLoading(null)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    )
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Factura no encontrada</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: `Factura ${invoice.invoice_number}` }} />
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <InvoicePreview invoice={invoice} profile={profile} showBusiness />

          {'share_token' in invoice && invoice.share_token && (
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedText}>
                Enlace compartido: {buildShareUrl(invoice.share_token)}
              </Text>
              <Text style={styles.sharedCount}>
                Visto {invoice.view_count} {invoice.view_count === 1 ? 'vez' : 'veces'}
              </Text>
              <TouchableOpacity
                style={styles.revokeBtn}
                onPress={async () => { await revokeShareToken(invoice.id); load() }}
              >
                <Text style={styles.revokeBtnText}>Revocar enlace</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionShare]}
            onPress={handleShare}
            disabled={actionLoading === 'share'}
          >
            <Text style={styles.actionShareText}>
              {actionLoading === 'share' ? 'Generando...' : 'Compartir'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrint]}
            onPress={handlePrint}
            disabled={actionLoading === 'print'}
          >
            <Text style={styles.actionPrintText}>
              {actionLoading === 'print' ? 'Generando...' : 'Imprimir / PDF'}
            </Text>
          </TouchableOpacity>

          {invoice.status === 'sent' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPaid]}
              onPress={() => handleStatusChange('paid')}
              disabled={actionLoading === 'status'}
            >
              <Text style={styles.actionPaidText}>Marcar pagada</Text>
            </TouchableOpacity>
          )}

          {invoice.status === 'paid' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSent]}
              onPress={() => handleStatusChange('sent')}
              disabled={actionLoading === 'status'}
            >
              <Text style={styles.actionSentText}>Reabrir</Text>
            </TouchableOpacity>
          )}

          {invoice.status === 'draft' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSent]}
              onPress={() => handleStatusChange('sent')}
              disabled={actionLoading === 'status'}
            >
              <Text style={styles.actionSentText}>Marcar enviada</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDelete]}
            onPress={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            <Text style={styles.actionDeleteText}>
              {actionLoading === 'delete' ? 'Eliminando...' : 'Eliminar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { fontSize: 16, color: '#94A3B8' },
  backBtn: { marginTop: 16, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  sharedInfo: {
    marginTop: 16, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sharedText: { fontSize: 12, color: '#64748B' },
  sharedCount: { fontSize: 13, color: '#64748B', marginTop: 4 },
  revokeBtn: { marginTop: 8 },
  revokeBtnText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
  actions: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionShare: { backgroundColor: '#2563EB' },
  actionShareText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  actionPrint: { backgroundColor: '#0F172A' },
  actionPrintText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  actionPaid: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  actionPaidText: { color: '#16A34A', fontSize: 14, fontWeight: '600' },
  actionSent: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' },
  actionSentText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  actionDelete: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  actionDeleteText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
})
