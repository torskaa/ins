export function downloadCSV(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadXLSX(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, filename)
  })
}

export function downloadPDF(title: string, tables: { headers: string[]; rows: (string | number | null | undefined)[][]; title?: string }[]) {
  import("jspdf").then(({ default: jsPDF }) => {
    import("jspdf-autotable").then(() => {
      const doc = new jsPDF("landscape")
      doc.setFontSize(18)
      doc.text(title, 14, 22)
      doc.setFontSize(10)
      doc.text(`Generated from Ins — ${new Date().toLocaleDateString()}`, 14, 30)

      let yOffset = 40
      tables.forEach((table) => {
        if (table.title) {
          doc.setFontSize(13)
          doc.text(table.title, 14, yOffset)
          yOffset += 8
        }
        ;(doc as any).autoTable({
          head: [table.headers],
          body: table.rows,
          startY: yOffset,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
          margin: { top: 10 },
        })
        yOffset = (doc as any).lastAutoTable.finalY + 15
      })

      doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`)
    })
  })
}

export function printReport(title: string) {
  const w = window.open()
  if (!w) return
  w.document.write(`<html><head><title>${title}</title>`)
  w.document.write("<style>body{font-family:sans-serif;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f0f4ff;font-weight:600}h1{font-size:24px;margin-bottom:4px}.meta{color:#888;font-size:13px;margin-bottom:24px}</style>")
  w.document.write("</head><body>")
  w.document.write(`<h1>${title}</h1>`)
  w.document.write(`<p class="meta">Generated from Ins — ${new Date().toLocaleDateString()}</p>`)
  w.document.write("<script>window.print()</script>")
  w.document.write("</body></html>")
  w.document.close()
}
