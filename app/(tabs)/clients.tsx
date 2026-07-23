import { useState, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { listClients, createClient, updateClient, deleteClient } from '../../services/clients'
import type { Client } from '../../types/database'
import { colors, radii, shadows } from '../../lib/theme'

export default function ClientsScreen() {
  const { session } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formNif, setFormNif] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadClients() {
    if (!session?.user?.id) return
    const { data } = await listClients()
    if (data) setClients(data)
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { loadClients() }, [session]))
  async function onRefresh() { setRefreshing(true); await loadClients(); setRefreshing(false) }

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.nif.toLowerCase().includes(q)
  })

  function resetForm() { setFormName(''); setFormNif(''); setFormEmail(''); setFormPhone(''); setEditId(null); setShowForm(false) }
  function openEdit(client: Client) { setEditId(client.id); setFormName(client.name); setFormNif(client.nif); setFormEmail(client.email ?? ''); setFormPhone(client.phone ?? ''); setShowForm(true) }

  async function handleSave() {
    if (!formName.trim() || !formNif.trim() || !session?.user?.id) return
    setSaving(true)
    const data = { user_id: session.user.id, name: formName.trim(), nif: formNif.trim(), email: formEmail.trim() || null, phone: formPhone.trim() || null, address: null, default_tax_pct: null, default_payment_days: null, notes: null }
    if (editId) { await updateClient(editId, data) } else { await createClient(data) }
    setSaving(false); resetForm(); loadClients()
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Eliminar cliente', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteClient(id); loadClients() } },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <Text style={styles.count}>{filtered.length} clientes</Text>
      </View>

      <View style={styles.controls}>
        <TextInput style={styles.searchInput} placeholder="Buscar por nombre o NIF..." placeholderTextColor={colors.inputPlaceholder} value={search} onChangeText={setSearch} />
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Nuevo cliente</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Nombre *" placeholderTextColor={colors.inputPlaceholder} value={formName} onChangeText={setFormName} />
          <TextInput style={styles.input} placeholder="NIF / CIF *" placeholderTextColor={colors.inputPlaceholder} value={formNif} onChangeText={setFormNif} autoCapitalize="characters" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.inputPlaceholder} value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor={colors.inputPlaceholder} value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, (!formName.trim() || !formNif.trim() || saving) && { opacity: 0.5 }]} onPress={handleSave} disabled={!formName.trim() || !formNif.trim() || saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <Text style={styles.emptyText}>Cargando...</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{clients.length === 0 ? 'No tienes clientes guardados.' : 'No hay clientes que coincidan.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id, item.name)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardNif}>{item.nif}</Text>
              </View>
              {(item.email || item.phone) && (
                <Text style={styles.cardContact}>{[item.email, item.phone].filter(Boolean).join(' · ')}</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 24, fontWeight: '600', color: colors.text, letterSpacing: -0.02 },
  count: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
  controls: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12, backgroundColor: colors.bgCard },
  searchInput: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.text, marginBottom: 12,
  },
  addBtn: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  form: {
    backgroundColor: colors.bgCard, marginHorizontal: 16, borderRadius: radii.md, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border, ...shadows.soft,
  },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: colors.text, marginBottom: 10,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderRadius: radii.sm, paddingVertical: 12, alignItems: 'center',
    backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, borderRadius: radii.sm, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.accent },
  saveBtnText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: colors.textTertiary, textAlign: 'center', lineHeight: 24 },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, ...shadows.soft,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  cardNif: { fontSize: 14, color: colors.textTertiary },
  cardContact: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
})
