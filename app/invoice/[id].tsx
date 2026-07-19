import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { getInvoice, updateInvoice, deleteInvoice } from '../../services/invoices'
import { generateShareToken, revokeShareToken, buildShareUrl } from '../../services/share'
import InvoicePreview from '../../components/InvoicePreview'
import type { Invoice } from '../../types/database'

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    if (!id) return
    const { data } = await getInvoice(id)
    setInvoice(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

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
          <InvoicePreview invoice={invoice} showBusiness />

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
  actionPaid: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  actionPaidText: { color: '#16A34A', fontSize: 14, fontWeight: '600' },
  actionSent: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' },
  actionSentText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  actionDelete: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  actionDeleteText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
})
