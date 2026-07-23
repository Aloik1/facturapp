import { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { createInvoice } from '../../services/invoices'
import { getProfile } from '../../services/profiles'
import InvoiceForm from '../../components/InvoiceForm'
import type { InvoiceInsert } from '../../types/database'

export default function NewInvoiceScreen() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<{ userId: string; sector: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    getProfile(session.user.id).then(({ data }) => {
      if (!data?.sector) {
        Alert.alert(
          'Completa tu perfil',
          'Necesitas indicar tu sector antes de crear facturas.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/onboarding') }]
        )
        return
      }
      setProfile({ userId: session.user.id, sector: data.sector })
      setLoading(false)
    })
  }, [session])

  async function handleSubmit(invoice: InvoiceInsert) {
    if (!session?.user?.id) return { error: { message: 'No autenticado' } }

    const result = await createInvoice({
      ...invoice,
      user_id: session.user.id,
    })

    if (result.data) {
      router.replace(`/invoice/${result.data.id}`)
    }

    return { error: result.error }
  }

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <InvoiceForm userId={profile.userId} sector={profile.sector} onSubmit={handleSubmit} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
})
