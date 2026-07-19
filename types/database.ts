export interface Profile {
  id: string
  user_id: string
  business_name: string
  business_nif: string
  address: string | null
  logo_url: string | null
  phone: string | null
  default_footer: string | null
  plan: 'free' | 'premium' | 'pro'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  nif: string
  email: string | null
  phone: string | null
  address: string | null
  default_tax_pct: number | null
  default_payment_days: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  tax_pct: number
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  client_id: string | null
  client_name: string
  client_nif: string
  client_address: string | null
  issue_date: string
  due_date: string | null
  items: InvoiceItem[]
  base_amount: number
  tax_amount: number
  irpf_applies: boolean
  irpf_percent: number | null
  irpf_amount: number | null
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes: string | null
  payment_method: string | null
  paid_at: string | null
  share_token: string | null
  share_expires_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<ProfileInsert>

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>
export type ClientUpdate = Partial<ClientInsert>

export type InvoiceInsert = {
  user_id: string
  client_id?: string | null
  client_name: string
  client_nif: string
  client_address?: string | null
  issue_date?: string
  due_date?: string | null
  items: InvoiceItem[]
  base_amount: number
  tax_amount: number
  irpf_applies?: boolean
  irpf_percent?: number | null
  irpf_amount?: number | null
  total_amount: number
  status?: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes?: string | null
  payment_method?: string | null
}

export type InvoiceUpdate = Partial<InvoiceInsert> & {
  paid_at?: string | null
  share_token?: string | null
  share_expires_at?: string | null
}

export interface SharedInvoiceView {
  client_name: string
  client_nif: string
  client_address: string | null
  items: InvoiceItem[]
  base_amount: number
  tax_amount: number
  irpf_applies: boolean
  irpf_percent: number | null
  irpf_amount: number | null
  total_amount: number
  issue_date: string
  due_date: string | null
  invoice_number: string
  status: string
  notes: string | null
  business_name: string
  business_nif: string
  business_address: string | null
  logo_url: string | null
  default_footer: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
    }
    Functions: {
      get_shared_invoice: {
        Args: { p_token: string }
        Returns: SharedInvoiceView
      }
      increment_view_count: {
        Args: { p_token: string }
        Returns: void
      }
    }
  }
}
