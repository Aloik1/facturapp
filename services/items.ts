import { supabase } from '../lib/supabase'
import type { CommonItem, UserItem, InvoiceItem } from '../types/database'

export async function getCommonItems(sector: string, search?: string) {
  let query = supabase
    .from('common_items')
    .select('*')
    .eq('sector', sector)
    .order('frequency', { ascending: false })

  if (search?.trim()) {
    query = query.ilike('description', `%${search.trim()}%`)
  }

  const { data, error } = await query.limit(20)
  return { data: data as CommonItem[] | null, error }
}

export async function getUserItems(userId: string, search?: string) {
  let query = supabase
    .from('user_items')
    .select('*')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })

  if (search?.trim()) {
    query = query.ilike('description', `%${search.trim()}%`)
  }

  const { data, error } = await query.limit(20)
  return { data: data as UserItem[] | null, error }
}

export async function getSuggestions(userId: string, sector: string, search?: string) {
  const [userRes, commonRes] = await Promise.all([
    getUserItems(userId, search),
    getCommonItems(sector, search),
  ])

  const userItems = userRes.data ?? []
  const commonItems = commonRes.data ?? []

  const usedDescriptions = new Set(userItems.map((i) => i.description.toLowerCase()))
  const combined: (UserItem | CommonItem)[] = [...userItems]

  for (const item of commonItems) {
    if (!usedDescriptions.has(item.description.toLowerCase())) {
      combined.push(item)
    }
  }

  return combined
}

export async function saveUserItems(userId: string, items: InvoiceItem[]) {
  for (const item of items) {
    const { error } = await supabase.rpc('upsert_user_item', {
      p_user_id: userId,
      p_description: item.description.trim(),
      p_unit: item.unit,
      p_unit_price: item.unit_price,
      p_tax_pct: item.tax_pct,
    })
    if (error) console.error('Error saving user item:', error)
  }
}
