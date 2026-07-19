import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getSharedInvoice, incrementViewCount } from '../../services/share'
import InvoicePreview from '../../components/InvoicePreview'
import type { SharedInvoiceView } from '../../types/database'

const APP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/facturapp/id000000000',
  android: 'https://play.google.com/store/apps/details?id=com.facturapp',
  default: 'https://facturapp-six.vercel.app',
})

export default function SharedInvoiceScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const [invoice, setInvoice] = useState<SharedInvoiceView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    if (!token) return

    getSharedInvoice(token).then(({ data, error: err }) => {
      if (err) {
        setError('No se pudo cargar la factura')
        setLoading(false)
        return
      }
      if (!data) {
        setError('Esta factura no está disponible o el enlace ha expirado')
        setLoading(false)
        return
      }
      setInvoice(data as unknown as SharedInvoiceView)
      setLoading(false)

      if (!counted) {
        incrementViewCount(token)
        setCounted(true)
      }
    })
  }, [token])

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando factura...</Text>
      </View>
    )
  }

  if (error || !invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorText}>{error || 'Factura no disponible'}</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: `Factura ${invoice.invoice_number}`, headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Facturapp</Text>
        </View>

        <InvoicePreview invoice={invoice} showBusiness />

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>¿Necesitas crear facturas?</Text>
          <Text style={styles.ctaText}>
            Con Facturapp crea facturas profesionales en segundos y compártelas al instante.
            {Platform.OS === 'web' ? ' Descarga la app en tu móvil.' : ''}
          </Text>
          <TouchableOpacity style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Descargar Facturapp</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>5 facturas gratis al mes</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Facturapp para autónomos</Text>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 32 },
  loadingText: { fontSize: 16, color: '#94A3B8' },
  errorIcon: {
    fontSize: 48, fontWeight: '700', color: '#FCA5A5', marginBottom: 16,
    width: 64, height: 64, lineHeight: 64, textAlign: 'center',
    borderRadius: 32, backgroundColor: '#FEE2E2', overflow: 'hidden',
  },
  errorText: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  headerBar: {
    paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#2563EB', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  cta: {
    margin: 16, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  ctaText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 20 },
  ctaBtn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  ctaBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  ctaSub: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: '#CBD5E1' },
})
