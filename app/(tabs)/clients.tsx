import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl,
  Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'
import { listClients, createClient, updateClient, deleteClient } from '../../services/clients'
import type { Client, ClientInsert } from '../../types/database'

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

  useFocusEffect(useCallback(() => {
    loadClients()
  }, [session]))

  async function onRefresh() {
    setRefreshing(true)
    await loadClients()
    setRefreshing(false)
  }

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.nif.toLowerCase().includes(q)
  })

  function resetForm() {
    setFormName('')
    setFormNif('')
    setFormEmail('')
    setFormPhone('')
    setEditId(null)
    setShowForm(false)
  }

  function openEdit(client: Client) {
    setEditId(client.id)
    setFormName(client.name)
    setFormNif(client.nif)
    setFormEmail(client.email ?? '')
    setFormPhone(client.phone ?? '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formNif.trim()) return
    if (!session?.user?.id) return

    setSaving(true)

    const data = {
      user_id: session.user.id,
      name: formName.trim(),
      nif: formNif.trim(),
      email: formEmail.trim() || null,
      phone: formPhone.trim() || null,
      address: null,
      default_tax_pct: null,
      default_payment_days: null,
      notes: null,
    }

    if (editId) {
      await updateClient(editId, data)
    } else {
      await createClient(data)
    }

    setSaving(false)
    resetForm()
    loadClients()
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Eliminar cliente', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await deleteClient(id)
          loadClients()
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <Text style={styles.count}>{filtered.length} clientes</Text>
      </View>

      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o NIF..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Nuevo cliente</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nombre *"
            placeholderTextColor="#94A3B8"
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            style={styles.input}
            placeholder="NIF / CIF *"
            placeholderTextColor="#94A3B8"
            value={formNif}
            onChangeText={setFormNif}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={formEmail}
            onChangeText={setFormEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor="#94A3B8"
            value={formPhone}
            onChangeText={setFormPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!formName.trim() || !formNif.trim() || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!formName.trim() || !formNif.trim() || saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <Text style={styles.emptyText}>Cargando...</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {clients.length === 0
              ? 'No tienes clientes guardados.'
              : 'No hay clientes que coincidan.'}
          </Text>
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
                <Text style={styles.cardContact}>
                  {[item.email, item.phone].filter(Boolean).join(' · ')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  count: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  controls: { paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  searchInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, backgroundColor: '#F8FAFC', marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  form: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, backgroundColor: '#F8FAFC', marginBottom: 10,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#2563EB' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 },
  cardNif: { fontSize: 14, color: '#64748B' },
  cardContact: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
})
