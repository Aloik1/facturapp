import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { getInvoice, updateInvoice, deleteInvoice } from '../../services/invoices'
import { generateShareToken, revokeShareToken, buildShareUrl } from '../../services/share'
import { getProfile } from '../../services/profiles'
import InvoicePreview from '../../components/InvoicePreview'
import type { Invoice, InvoiceItem, Profile } from '../../types/database'
import { colors, radii, shadows } from '../../lib/theme'

function buildInvoiceHtml(inv: Invoice, prof: Profile | null): string {
  const items = inv.items as InvoiceItem[]
  const fmt = (n: number) => `${n.toFixed(2)}€`
  const statusLabel = inv.status === 'paid' ? 'Pagada' : inv.status === 'sent' ? 'Enviada' : inv.status === 'draft' ? 'Borrador' : 'Cancelada'
  const statusClass = inv.status === 'paid' ? 'paid' : inv.status === 'sent' ? 'sent' : inv.status === 'draft' ? 'draft' : 'cancelled'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura ${inv.invoice_number}</title>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;padding:40px;background:#1A1A1A;color:#F5F0EB}
  .center{text-align:center}.right{text-align:right}
  .business{text-align:center;margin-bottom:32px}
  .business h1{font-size:22px;margin:0;color:#D4A04A}
  .business p{font-size:13px;color:#6B6560;margin:2px 0}
  .header{text-align:center;margin-bottom:32px}
  .header h2{font-size:12px;color:#6B6560;letter-spacing:2px;text-transform:uppercase;margin:0}
  .header .num{font-size:24px;font-weight:700;margin:4px 0;color:#F5F0EB}
  .header .date{font-size:13px;color:#6B6560;margin:2px 0}
  .section{margin-bottom:24px}
  .section h3{font-size:11px;color:#6B6560;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .cname{font-size:16px;font-weight:600;color:#F5F0EB}
  .cdetail{font-size:14px;color:#A09890}
  .client-box{background:#2D2D2D;padding:16px;border-radius:8px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse}
  th{font-size:11px;color:#6B6560;text-transform:uppercase;padding:8px 4px;border-bottom:2px solid #333}
  td{font-size:14px;padding:10px 4px;border-bottom:1px solid #333;color:#A09890}
  .totals{margin-top:16px;border-top:2px solid #333;padding-top:12px}
  .tr{display:flex;justify-content:space-between;padding:4px 0}
  .tl{font-size:14px;color:#6B6560}.tv{font-size:14px;font-weight:600;color:#F5F0EB}
  .gt{border-top:1px solid #333;margin-top:4px;padding-top:8px}
  .gt .tl{font-size:16px;font-weight:700;color:#F5F0EB}
  .gt .tv{font-size:20px;font-weight:700;color:#D4A04A}
  .badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;margin-top:8px}
  .badge.paid{background:rgba(107,191,138,0.12);color:#6BBF8A}
  .badge.sent{background:rgba(212,160,74,0.12);color:#D4A04A}
  .badge.draft{background:#2D2D2D;color:#6B6560}
  .badge.cancelled{background:rgba(217,92,92,0.12);color:#D95C5C}
  .footer{text-align:center;font-size:13px;color:#6B6560;font-style:italic;margin-top:32px}
  @media print{body{padding:20px;background:white;color:#1e293b}.header .num{color:#1e293b}.cname{color:#1e293b}.cdetail{color:#64748b}td{color:#64748b}.tv{color:#1e293b}.gt .tv{color:#2563eb}}
</style></head><body>
${prof ? `<div class="business"><h1>${prof.business_name}</h1><p>${prof.business_nif}</p>${prof.address ? `<p>${prof.address}</p>` : ''}</div>` : ''}
<div class="header"><h2>Factura</h2><div class="num">${inv.invoice_number}</div><div class="date">Fecha: ${inv.issue_date}</div>${inv.due_date ? `<div class="date">Vencimiento: ${inv.due_date}</div>` : ''}<div class="badge ${statusClass}">${statusLabel}</div></div>
<div class="section"><h3>Cliente</h3><div class="client-box"><div class="cname">${inv.client_name}</div><div class="cdetail">${inv.client_nif}</div>${inv.client_address ? `<div class="cdetail">${inv.client_address}</div>` : ''}</div></div>
<div class="section"><h3>Concepto</h3><table><tr><th style="text-align:left">Descripción</th><th style="text-align:center">Cant</th><th style="text-align:center">Ud</th><th style="text-align:right">Precio</th><th style="text-align:right">Total</th></tr>
${items.map(i => `<tr><td>${i.description}</td><td class="center">${i.quantity}</td><td class="center">${i.unit}</td><td class="right">${fmt(i.unit_price)}</td><td class="right">${fmt(i.quantity * i.unit_price)}</td></tr>`).join('')}</table></div>
<div class="totals"><div class="tr"><span class="tl">Base imponible</span><span class="tv">${fmt(inv.base_amount)}</span></div><div class="tr"><span class="tl">IVA</span><span class="tv">${fmt(inv.tax_amount)}</span></div>${inv.irpf_applies ? `<div class="tr"><span class="tl">IRPF (${inv.irpf_percent}%)</span><span class="tv" style="color:#D95C5C">-${fmt(inv.irpf_amount || 0)}</span></div>` : ''}<div class="gt tr"><span class="tl">Total</span><span class="tv">${fmt(inv.total_amount)}</span></div></div>
${inv.notes ? `<div class="section"><h3>Notas</h3><p style="font-size:14px;color:#6B6560">${inv.notes}</p></div>` : ''}
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

  async function load() { if (!id) return; const { data } = await getInvoice(id); setInvoice(data); setLoading(false) }
  useEffect(() => { load() }, [id])
  useEffect(() => { if (session?.user?.id) getProfile(session.user.id).then(({ data }) => setProfile(data)) }, [session])

  async function handleShare() {
    if (!invoice || !id) return
    setActionLoading('share')
    let token = invoice.share_token
    let url: string | null = null
    if (token && invoice.share_expires_at && new Date(invoice.share_expires_at) > new Date()) { url = buildShareUrl(token) }
    else { const result = await generateShareToken(id); url = result.url; if (url) load() }
    setActionLoading(null)
    if (!url) { Alert.alert('Error', 'No se pudo generar el enlace'); return }
    if (Platform.OS === 'web') { try { await navigator.clipboard.writeText(url); Alert.alert('Enlace copiado', url) } catch { Alert.alert('Compartir', url) } }
    else { try { const Share = require('react-native').Share; await Share.share({ message: url, title: `Factura ${invoice.invoice_number}` }) } catch { Alert.alert('Compartir', url) } }
  }

  async function handleStatusChange(newStatus: string) { if (!id) return; setActionLoading('status'); await updateInvoice(id, { status: newStatus as any }); setActionLoading(null); load() }
  async function handleDelete() { if (!id) return; Alert.alert('Eliminar factura', '¿Estás seguro? Esta acción no se puede deshacer.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => { setActionLoading('delete'); await deleteInvoice(id); setActionLoading(null); router.back() } }]) }

  async function handlePrint() {
    if (!invoice) return; setActionLoading('print')
    const html = buildInvoiceHtml(invoice, profile)
    try {
      if (Platform.OS === 'web') { const w = window.open(''); if (w) { w.document.write(html); w.document.close(); w.focus(); w.print() } }
      else { const Print = require('expo-print'); const { uri } = await Print.printToFileAsync({ html }); const Sharing = require('expo-sharing'); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Factura ${invoice.invoice_number}` }) }
    } catch { Alert.alert('Error', 'No se pudo generar el PDF') }
    setActionLoading(null)
  }

  if (loading) return <View style={styles.center}><Text style={{ color: colors.textTertiary, fontSize: 16 }}>Cargando...</Text></View>
  if (!invoice) return <View style={styles.center}><Text style={{ color: colors.textTertiary, fontSize: 16 }}>Factura no encontrada</Text><TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>Volver</Text></TouchableOpacity></View>

  return (
    <>
      <Stack.Screen options={{ title: `Factura ${invoice.invoice_number}`, headerStyle: { backgroundColor: colors.bgCard }, headerTintColor: colors.text }} />
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <InvoicePreview invoice={invoice} profile={profile} showBusiness />

          {'share_token' in invoice && invoice.share_token && (
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedText}>Enlace compartido: {buildShareUrl(invoice.share_token)}</Text>
              <Text style={styles.sharedCount}>Visto {invoice.view_count} {invoice.view_count === 1 ? 'vez' : 'veces'}</Text>
              <TouchableOpacity onPress={async () => { await revokeShareToken(invoice.id); load() }}>
                <Text style={{ fontSize: 13, color: colors.danger, fontWeight: '500' }}>Revocar enlace</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={handleShare} disabled={actionLoading === 'share'}>
            <Text style={[styles.actionText, { color: colors.textInverse }]}>{actionLoading === 'share' ? 'Generando...' : 'Compartir'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.text }]} onPress={handlePrint} disabled={actionLoading === 'print'}>
            <Text style={[styles.actionText, { color: colors.bg }]}>{actionLoading === 'print' ? 'Generando...' : 'Imprimir / PDF'}</Text>
          </TouchableOpacity>
          {invoice.status === 'sent' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.successBg, borderWidth: 1, borderColor: 'rgba(107,191,138,0.3)' }]} onPress={() => handleStatusChange('paid')} disabled={actionLoading === 'status'}>
              <Text style={[styles.actionText, { color: colors.success }]}>Marcar pagada</Text>
            </TouchableOpacity>
          )}
          {invoice.status === 'paid' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: 'rgba(212,160,74,0.2)' }]} onPress={() => handleStatusChange('sent')} disabled={actionLoading === 'status'}>
              <Text style={[styles.actionText, { color: colors.accent }]}>Reabrir</Text>
            </TouchableOpacity>
          )}
          {invoice.status === 'draft' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: 'rgba(212,160,74,0.2)' }]} onPress={() => handleStatusChange('sent')} disabled={actionLoading === 'status'}>
              <Text style={[styles.actionText, { color: colors.accent }]}>Marcar enviada</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: 'rgba(217,92,92,0.2)' }]} onPress={handleDelete} disabled={actionLoading === 'delete'}>
            <Text style={[styles.actionText, { color: colors.danger }]}>{actionLoading === 'delete' ? 'Eliminando...' : 'Eliminar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  backBtn: { marginTop: 16, backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  sharedInfo: {
    marginTop: 16, backgroundColor: colors.bgTertiary, borderRadius: radii.md, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  sharedText: { fontSize: 12, color: colors.textTertiary },
  sharedCount: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
  actions: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: colors.bgCard,
    borderTopWidth: 1, borderTopColor: colors.border, flexWrap: 'wrap',
  },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.sm, alignItems: 'center', minWidth: 80 },
  actionText: { fontSize: 13, fontWeight: '600' },
})
