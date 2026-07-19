import { supabase } from '../lib/supabase'
import type { Client, ClientInsert, ClientUpdate } from '../types/database'

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  return { data: data as Client[] | null, error }
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Client | null, error }
}

export async function searchClients(query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${query}%,nif.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20)

  return { data: data as Client[] | null, error }
}

export async function createClient(client: ClientInsert) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  return { data: data as Client | null, error }
}

export async function updateClient(id: string, client: ClientUpdate) {
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Client | null, error }
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  return { error }
}
