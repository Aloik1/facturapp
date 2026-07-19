import { View, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { createInvoice } from '../../services/invoices'
import InvoiceForm from '../../components/InvoiceForm'
import type { InvoiceInsert } from '../../types/database'

export default function NewInvoiceScreen() {
  const { session } = useAuth()

  async function handleSubmit(invoice: InvoiceInsert) {
    if (!session?.user?.id) return { error: { message: 'No autenticado' } }

    const result = await createInvoice({
      ...invoice,
      user_id: session.user.id,
    })

    if (result.data) {
      Alert.alert(
        'Factura creada',
        `Factura ${result.data.invoice_number} creada correctamente.`,
        [
          { text: 'Ver factura', onPress: () => router.replace(`/invoice/${result.data!.id}`) },
          { text: 'Seguir', style: 'cancel' },
        ]
      )
    }

    return { error: result.error }
  }

  return (
    <View style={styles.container}>
      <InvoiceForm onSubmit={handleSubmit} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
})
