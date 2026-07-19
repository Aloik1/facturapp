import { supabase } from './supabase'

const FREE_MONTHLY_LIMIT = 5

export async function getMonthlyCount(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('Error getting monthly count:', error)
    return 0
  }

  return count ?? 0
}

export async function canCreateInvoice(userId: string): Promise<boolean> {
  const count = await getMonthlyCount(userId)
  return count < FREE_MONTHLY_LIMIT
}
