import * as Print from 'expo-print'
import { documentDirectory, moveAsync, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import * as XLSX from 'xlsx'
import type { Invoice } from '../types/database'

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function htmlTable(invoices: Invoice[]) {
  const rows = invoices.map(inv => `
    <tr>
      <td>${inv.emisor_razon_social}</td>
      <td>${inv.emisor_nif}</td>
      <td>${inv.factura_numero}</td>
      <td>${formatDate(inv.fecha_emision)}</td>
      <td>${inv.base_imponible.toFixed(2)}</td>
      <td>${inv.tipo_iva}%</td>
      <td>${inv.cuota_iva.toFixed(2)}</td>
      <td>${inv.importe_total.toFixed(2)}</td>
      <td>${inv.pagada ? 'Sí' : 'No'}</td>
    </tr>
  `).join('')

  return `
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; }
          h1 { font-size: 22px; color: #1e293b; margin-bottom: 8px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 8px; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
          .total-row td { font-weight: 700; border-top: 2px solid #0f172a; padding-top: 12px; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <h1>Informe de Facturas Recibidas</h1>
        <div class="meta">Generado el ${new Date().toLocaleDateString('es-ES')} · ${invoices.length} facturas</div>
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>NIF</th>
              <th>Factura</th>
              <th>Fecha</th>
              <th>Base</th>
              <th>IVA</th>
              <th>Cuota</th>
              <th>Total</th>
              <th>Pagada</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="4"></td>
              <td>${invoices.reduce((s, i) => s + i.base_imponible, 0).toFixed(2)}</td>
              <td></td>
              <td>${invoices.reduce((s, i) => s + i.cuota_iva, 0).toFixed(2)}</td>
              <td>${invoices.reduce((s, i) => s + i.importe_total, 0).toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">Facturap — App de facturas para autónomos</div>
      </body>
    </html>
  `
}

export async function exportPDF(invoices: Invoice[]) {
  const html = htmlTable(invoices)
  const { uri } = await Print.printToFileAsync({ html })
  const dest = `${documentDirectory}facturas_${Date.now()}.pdf`
  await moveAsync({ from: uri, to: dest })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, { mimeType: 'application/pdf' })
  }

  return dest
}

export async function exportExcel(invoices: Invoice[]) {
  const data = invoices.map(inv => ({
    Proveedor: inv.emisor_razon_social,
    NIF: inv.emisor_nif,
    'Nº Factura': inv.factura_numero,
    'Fecha Emisión': formatDate(inv.fecha_emision),
    'Base Imponible': inv.base_imponible,
    '% IVA': inv.tipo_iva,
    'Cuota IVA': inv.cuota_iva,
    Total: inv.importe_total,
    Pagada: inv.pagada ? 'Sí' : 'No',
    Concepto: inv.concepto,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

  const dest = `${documentDirectory}facturas_${Date.now()}.xlsx`
  await writeAsStringAsync(dest, wbout, { encoding: EncodingType.Base64 })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  return dest
}
