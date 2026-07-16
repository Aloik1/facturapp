export interface Invoice {
  id: string
  user_id: string
  scanned_at: string

  emisor_nif: string
  emisor_razon_social: string
  emisor_domicilio: string | null

  factura_numero: string
  fecha_emision: string
  fecha_operacion: string | null

  base_imponible: number
  tipo_iva: number
  cuota_iva: number
  porcentaje_retencion_irpf: number | null
  importe_retencion_irpf: number | null
  importe_total: number

  concepto: string
  categoria: string | null
  pagada: boolean
  fecha_pago: string | null

  imagen_url: string | null
  notas: string | null

  created_at: string
  updated_at: string
}

export type InvoiceInsert = {
  user_id: string
  scanned_at?: string
  emisor_nif: string
  emisor_razon_social: string
  emisor_domicilio?: string | null
  factura_numero?: string
  fecha_emision?: string
  fecha_operacion?: string | null
  base_imponible?: number
  tipo_iva?: number
  cuota_iva?: number
  porcentaje_retencion_irpf?: number | null
  importe_retencion_irpf?: number | null
  importe_total: number
  concepto?: string
  categoria?: string | null
  pagada?: boolean
  fecha_pago?: string | null
  imagen_url?: string | null
  notas?: string | null
}

export type InvoiceUpdate = Partial<InvoiceInsert>

export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
    }
  }
}
