import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getSharedInvoice, incrementViewCount } from '../../services/share'
import InvoicePreview from '../../components/InvoicePreview'
import type { SharedInvoiceView } from '../../types/database'
import { colors, radii, shadows } from '../../lib/theme'

const APP_STORE_URL = Platform.select({ ios: 'https://apps.apple.com/app/facturapp/id000000000', android: 'https://play.google.com/store/apps/details?id=com.facturapp', default: 'https://facturapp-six.vercel.app' })

export default function SharedInvoiceScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const [invoice, setInvoice] = useState<SharedInvoiceView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    if (!token) return
    getSharedInvoice(token).then(({ data, error: err }) => {
      if (err) { setError('No se pudo cargar la factura'); setLoading(false); return }
      if (!data) { setError('Esta factura no está disponible o el enlace ha expirado'); setLoading(false); return }
      setInvoice(data as unknown as SharedInvoiceView); setLoading(false)
      if (!counted) { incrementViewCount(token); setCounted(true) }
    })
  }, [token])

  if (loading) return <View style={styles.center}><Text style={{ color: colors.textTertiary, fontSize: 16 }}>Cargando factura...</Text></View>
  if (error || !invoice) return <View style={styles.center}><Text style={[styles.errorText, { color: colors.danger }]}>{error || 'Factura no disponible'}</Text></View>

  return (
    <>
      <Stack.Screen options={{ title: `Factura ${invoice.invoice_number}`, headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Facturapp</Text>
        </View>

        <View style={styles.previewWrapper}>
          <InvoicePreview invoice={invoice} showBusiness />
        </View>

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

        <View style={styles.footer}><Text style={styles.footerText}>Facturapp para autónomos</Text></View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 32 },
  errorText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  headerBar: { paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: colors.accent, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textInverse },
  previewWrapper: { padding: 16 },
  cta: {
    margin: 16, padding: 24, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  ctaText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 20 },
  ctaBtn: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  ctaBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
  ctaSub: { fontSize: 13, color: colors.textTertiary, marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: colors.textTertiary },
})
