import { supabase } from '../lib/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '../types/database'

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data: data as Profile | null, error }
}

export async function upsertProfile(userId: string, profile: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, user_id: userId })
    .select()
    .single()

  return { data: data as Profile | null, error }
}
