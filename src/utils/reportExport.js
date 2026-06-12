// Utilitas export laporan: Excel (.xlsx) & PDF (berlogo ArahInn).
//
// Pemakaian:
//   await exportExcel({ filename, title, period, meta, summary, columns, rows })
//   await exportPdf({   filename, title, subtitle, period, meta, summary, columns, rows })
//
// columns : [{ key, header, width?, align?, money? }]
// rows    : array objek (nilai mentah; kolom money sebaiknya number)
// summary : [{ label, value }]  → blok ringkasan
// meta    : [string] → baris info (Periode/Filter/dll) di header

import { formatRupiah } from '@/utils'

const LOGO_URL = '/logo-arahin.png'

/* ── Excel ─────────────────────────────────────────────────────────────── */
export async function exportExcel({ filename = 'laporan', title, period, meta = [], summary = [], columns, rows }) {
  const XLSX = await import('xlsx')
  const aoa = []

  if (title)  aoa.push([title])
  if (period) aoa.push([period])
  meta.forEach(m => aoa.push([m]))
  if (title || period || meta.length) aoa.push([])

  summary.forEach(s => aoa.push([s.label, s.value]))
  if (summary.length) aoa.push([])

  aoa.push(columns.map(c => c.header))
  rows.forEach(r => aoa.push(columns.map(c => r[c.key] ?? '')))

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = columns.map(c => ({ wch: c.width || 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/* ── PDF ───────────────────────────────────────────────────────────────── */
async function loadDataUrl(url) {
  const res  = await fetch(url)
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload  = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

export async function exportPdf({
  filename = 'laporan', title, subtitle, period, meta = [],
  summary = [], columns, rows,
}) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const landscape = columns.length > 6
  const doc    = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 36
  let y = margin

  // Logo (kiri atas) — rasio logo ArahInn ~ 4:1
  try {
    const logo = await loadDataUrl(LOGO_URL)
    doc.addImage(logo, 'PNG', margin, y, 128, 32)
  } catch { /* logo gagal dimuat → lanjut tanpa logo */ }

  // Info perusahaan (kanan atas)
  doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal')
  doc.text('ArahInn.com', pageW - margin, y + 10, { align: 'right' })
  doc.text('Accommodation · Transportation · Activities', pageW - margin, y + 22, { align: 'right' })
  y += 50

  // Judul
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
  doc.text(title || 'Laporan', margin, y); y += 16
  if (subtitle) { doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139); doc.text(subtitle, margin, y); y += 13 }
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
  if (period) { doc.text(period, margin, y); y += 13 }
  meta.forEach(m => { doc.text(m, margin, y); y += 13 })
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, y); y += 16

  // Blok ringkasan (kartu)
  if (summary.length) {
    const boxH = 64
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, pageW - margin * 2, boxH, 6, 6, 'FD')
    const cellW = (pageW - margin * 2) / summary.length
    summary.forEach((s, i) => {
      const cx = margin + cellW * i + cellW / 2
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139)
      doc.text(String(s.label), cx, y + 22, { align: 'center', maxWidth: cellW - 10 })
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42)
      doc.text(String(s.value), cx, y + 44, { align: 'center', maxWidth: cellW - 10 })
    })
    y += boxH + 18
  }

  // Tabel utama
  const colStyles = {}
  columns.forEach((c, i) => {
    colStyles[i] = {}
    if (c.align) colStyles[i].halign = c.align
    if (c.money) { colStyles[i].halign = 'right'; colStyles[i].fontStyle = 'bold' }
  })

  autoTable(doc, {
    startY: y,
    head : [columns.map(c => c.header)],
    body : rows.map(r => columns.map(c => (c.money ? formatRupiah(Number(r[c.key]) || 0) : (r[c.key] ?? '–')))),
    styles     : { fontSize: 8, cellPadding: 5, textColor: [15, 23, 42], overflow: 'linebreak' },
    headStyles : { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      doc.setFontSize(8); doc.setTextColor(150, 160, 175); doc.setFont('helvetica', 'normal')
      doc.text('ArahInn — Laporan Platform', margin, pageH - 18)
      doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, pageW - margin, pageH - 18, { align: 'right' })
    },
  })

  doc.save(`${filename}.pdf`)
}
