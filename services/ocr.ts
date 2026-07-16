import { createWorker } from 'tesseract.js'

export interface OcrResult {
  emisor_nif: string
  emisor_razon_social: string
  factura_numero: string
  fecha_emision: string
  base_imponible: number
  tipo_iva: number
  cuota_iva: number
  importe_total: number
  concepto: string
}

function extractField(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function extractNif(text: string): string {
  const patterns = [
    /([A-Z]\d{7,8}[A-Z0-9])/,
    /(\d{8}[A-Z])/,
    /NIF\s*:?\s*([A-Z0-9]{9})/i,
    /CIF\s*:?\s*([A-Z0-9]{9})/i,
    /DNI\s*:?\s*(\d{8}[A-Z])/i,
  ]
  return extractField(text, patterns)
}

function extractImporte(text: string): number {
  const patterns = [
    /TOTAL\s*:?\s*([\d.,]+)/i,
    /Total\s*:?\s*([\d.,]+)/i,
    /IMPORTE\s*:?\s*([\d.,]+)/i,
    /EUROS?\s*([\d.,]+)/i,
    /([\d.,]+)\s*€/,
  ]
  const val = extractField(text, patterns)
  return val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0
}

function extractFecha(text: string): string {
  const patterns = [
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}-\d{2}-\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /FECHA\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
  ]
  const val = extractField(text, patterns)
  if (val.includes('/')) {
    const [d, m, y] = val.split('/')
    return `${y}-${m}-${d}`
  }
  return val
}

function extractNumeroFactura(text: string): string {
  const patterns = [
    /FACTURA\s*(?:N[uo]?[m.]?\s*)?:?\s*([\w/-]+)/i,
    /N[uo]?[m.]?\s*:?\s*([\w/-]+)/i,
    /(\d{4,}[\w/-]*)/,
  ]
  return extractField(text, patterns)
}

function extractIva(text: string): number {
  const patterns = [
    /IVA\s*:?\s*([\d.,]+)\s*%/i,
    /([\d.,]+)\s*%\s*IVA/i,
    /I\.?V\.?A\.?\s*([\d.,]+)/i,
  ]
  const val = extractField(text, patterns)
  return val ? parseFloat(val.replace(',', '.')) : 21
}

function extractBaseImponible(text: string): number {
  const patterns = [
    /BASE\s*:?\s*([\d.,]+)/i,
    /BASE\s*IMPONIBLE\s*:?\s*([\d.,]+)/i,
    /SUBTOTAL\s*:?\s*([\d.,]+)/i,
  ]
  const val = extractField(text, patterns)
  return val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0
}

export async function processInvoiceImage(imageUri: string): Promise<OcrResult> {
  const worker = await createWorker('spa')
  const { data: { text } } = await worker.recognize(imageUri)
  await worker.terminate()

  const nif = extractNif(text)
  const importeTotal = extractImporte(text)
  const baseImponible = extractBaseImponible(text) || importeTotal / 1.21
  const tipoIva = extractIva(text)
  const cuotaIva = parseFloat((baseImponible * tipoIva / 100).toFixed(2))
  const razonSocial = text.split('\n')[0]?.trim() || ''

  return {
    emisor_nif: nif,
    emisor_razon_social: razonSocial,
    factura_numero: extractNumeroFactura(text),
    fecha_emision: extractFecha(text),
    base_imponible: parseFloat(baseImponible.toFixed(2)),
    tipo_iva: tipoIva,
    cuota_iva: cuotaIva,
    importe_total: importeTotal,
    concepto: text.slice(0, 100).trim() || 'Factura recibida',
  }
}
