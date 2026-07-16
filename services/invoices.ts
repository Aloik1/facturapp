import { supabase } from '../lib/supabase'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types/database'

export async function listInvoices(filters?: { pagada?: boolean }) {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('fecha_emision', { ascending: false })

  if (filters?.pagada !== undefined) {
    query = query.eq('pagada', filters.pagada)
  }

  const { data, error } = await query
  return { data: data as Invoice[] | null, error }
}

export async function getInvoice(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Invoice | null, error }
}

export async function createInvoice(invoice: InvoiceInsert) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()

  return { data: data as Invoice | null, error }
}

export async function updateInvoice(id: string, invoice: InvoiceUpdate) {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Invoice | null, error }
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  return { error }
}
