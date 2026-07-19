import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import type { Invoice } from '../types/database'

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://facturapp-six.vercel.app'
const SHARE_EXPIRY_DAYS = 7

export function buildShareUrl(token: string): string {
  return `${APP_URL}/v/${token}`
}

export function generateToken(): string {
  return nanoid(11)
}

export async function generateShareToken(invoiceId: string) {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SHARE_EXPIRY_DAYS)

  const { data, error } = await supabase
    .from('invoices')
    .update({
      share_token: token,
      share_expires_at: expiresAt.toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) return { url: null, error }

  const url = buildShareUrl(token)
  return { url, error: null }
}

export async function revokeShareToken(invoiceId: string) {
  const { error } = await supabase
    .from('invoices')
    .update({
      share_token: null,
      share_expires_at: null,
    })
    .eq('id', invoiceId)

  return { error }
}

export async function getSharedInvoice(token: string) {
  const { data, error } = await supabase
    .rpc('get_shared_invoice', { p_token: token })

  return { data, error }
}

export async function incrementViewCount(token: string) {
  const { error } = await supabase
    .rpc('increment_view_count', { p_token: token })

  return { error }
}
