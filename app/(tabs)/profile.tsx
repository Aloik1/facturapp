import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { signOut, getSession } from '../../services/auth'

export default function ProfileScreen() {
  const { session } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {} },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>ID</Text>
        <Text style={styles.value}>{session?.user?.id}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Eliminar cuenta</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#0F172A' },
  logoutButton: { backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
  deleteButton: { marginTop: 12, alignItems: 'center' },
  deleteText: { color: '#94A3B8', fontSize: 14 },
})
