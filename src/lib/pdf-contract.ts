import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export function generateContractPDF(text: string, fileName: string) {
  try {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = 210
    const contentWidth = pageWidth - margin * 2
    const pageHeight = 297

    const addHeader = (d: jsPDF) => {
      d.setFont('helvetica', 'normal')
      d.setFontSize(16)
      d.setTextColor(12, 35, 64)
      d.text('G O D O Y', margin, 15)
      d.setFontSize(8)
      d.text('P R I M E  R E A L T Y', margin, 20)

      d.setFont('helvetica', 'bold')
      d.setFontSize(16)
      d.setTextColor(12, 35, 64)
      d.text('CONTRATO DE COMPRA E VENDA DE IMÓVEL', pageWidth / 2, 23, {
        align: 'center',
      })

      d.setDrawColor(212, 175, 55) // Ouro
      d.setLineWidth(0.5)
      d.line(margin, 28, pageWidth - margin, 28)
    }

    const addFooter = (d: jsPDF, pageNum: number, total: number) => {
      d.setDrawColor(212, 175, 55)
      d.setLineWidth(0.5)
      d.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

      d.setFont('helvetica', 'normal')
      d.setFontSize(8)
      d.setTextColor(12, 35, 64)

      // Left: QR Code Placeholder
      d.setDrawColor(12, 35, 64)
      d.rect(margin, pageHeight - 22, 10, 10)
      d.setFontSize(6)
      d.text('QR CODE', margin + 1, pageHeight - 16)
      d.setFontSize(8)

      // Center: Pagination
      d.text(`Página ${pageNum} de ${total}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

      // Right: Timestamp
      d.text(
        `Autenticado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pageWidth - margin,
        pageHeight - 15,
        { align: 'right' },
      )
    }

    // Cover Page
    doc.setFillColor(12, 35, 64) // Marinho
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Inner gold border
    doc.setDrawColor(212, 175, 55)
    doc.setLineWidth(1)
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATO PARTICULAR DE COMPRA E VENDA DE IMÓVEL', pageWidth / 2, pageHeight / 3, {
      align: 'center',
    })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(212, 175, 55)
    doc.text(
      `CÓDIGO INTERNO DO DOCUMENTO: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      pageWidth / 2,
      pageHeight - 60,
      { align: 'center' },
    )

    // Cover QR Code Placeholder
    doc.setDrawColor(212, 175, 55)
    doc.rect(pageWidth / 2 - 15, pageHeight - 50, 30, 30)
    doc.text(`QR CODE`, pageWidth / 2, pageHeight - 34, { align: 'center' })

    // Content Pages
    doc.addPage()

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(12, 35, 64) // Navy for text base
    const lineHeight = 6

    const cleanText = String(text || '')
      .replace(/<p[^>]*>\s*Assessoria Jurídica Imobiliária\s*<\/p>/gi, '')
      .replace(/Assessoria Jurídica Imobiliária/gi, '')
      .replace(/<br\s*[/]?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, (_, inner) => inner.toUpperCase())
      .replace(/<b[^>]*>(.*?)<\/b>/gi, (_, inner) => inner.toUpperCase())
      .replace(
        /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
        (_, inner) => '\n\n' + inner.toUpperCase() + '\n\n',
      )
      .replace(/\*\*(.*?)\*\*/g, (_, inner) => inner.toUpperCase())
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?(.*?)(?:\n|$)/g, (_, inner) => '\n\n' + inner.toUpperCase() + '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/•/g, '-')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')

    const lines = doc.splitTextToSize(cleanText, contentWidth)

    let y = 40
    addHeader(doc)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Lookahead for page breaks to avoid orphans (don't break if next 2 lines don't fit)
      if (y > pageHeight - 45) {
        doc.addPage()
        addHeader(doc)
        y = 40
      }

      if (line.trim().length > 0 && line === line.toUpperCase() && !line.includes('___')) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(12, 35, 64)
      } else if (line.trim().startsWith('##')) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(12, 35, 64)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85)
      }

      doc.text(line.replace(/#/g, ''), margin, y)
      y += lineHeight
    }

    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      // Skip cover page footer
      doc.setPage(i)
      addFooter(doc, i - 1, totalPages - 1)
    }

    doc.save(fileName)
  } catch (err) {
    console.error('Error generating PDF', err)
  }
}
