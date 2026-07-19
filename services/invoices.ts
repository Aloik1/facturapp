import { supabase } from '../lib/supabase'
import { canCreateInvoice } from '../lib/plans'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types/database'

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear().toString()

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return `${year}-001`
  }

  const lastNum = parseInt(data[0].invoice_number.split('-')[1], 10)
  const nextNum = lastNum + 1
  return `${year}-${nextNum.toString().padStart(3, '0')}`
}

export async function listInvoices(filters?: { status?: string }) {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('issue_date', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
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
  const allowed = await canCreateInvoice(invoice.user_id)
  if (!allowed) {
    return {
      data: null,
      error: { message: 'Has alcanzado el límite de 5 facturas gratis este mes. Actualiza tu plan para crear más.', code: 'PLAN_LIMIT' },
    }
  }

  const invoiceNumber = await generateInvoiceNumber(invoice.user_id)

  const { data, error } = await supabase
    .from('invoices')
    .insert({ ...invoice, invoice_number: invoiceNumber })
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
