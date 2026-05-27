import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { generateChecklistPDFTemplate } from './checklist-generator'
import pb from '@/lib/pocketbase/client'
import { getLogoBase64 } from './pdf-utils'

export async function buildPdfDoc(minutaText: string, userDetails?: any): Promise<jsPDF> {
  const doc = new jsPDF()
  let y = 40
  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - margin * 2
  const pageHeight = 297

  const logoBase64 = await getLogoBase64(userDetails)

  const headerContentLines = userDetails?.header_content
    ? doc.splitTextToSize(userDetails.header_content, contentWidth)
    : []

  const getDocumentTitle = (tipo?: string) => {
    if (!tipo) return 'MINUTA DE CONTRATO'
    const titles: Record<string, string> = {
      ficha_cadastral: 'FICHA CADASTRAL',
      checklist_documental: 'CHECKLIST DOCUMENTAL',
      recibo_sinal: 'RECIBO DE SINAL',
      termo_entrega_chaves: 'TERMO DE ENTREGA DE CHAVES',
      termo_posse: 'TERMO DE POSSE',
      declaracoes_complementares: 'DECLARAÇÕES COMPLEMENTARES',
      autorizacao_intermediacao: 'AUTORIZAÇÃO DE INTERMEDIAÇÃO',
      promessa_compra_venda: 'MINUTA DE CONTRATO',
      contrato_particular: 'MINUTA DE CONTRATO',
      distrato: 'MINUTA DE CONTRATO',
    }
    return titles[tipo] || 'MINUTA DE CONTRATO'
  }

  const addHeader = (d: jsPDF) => {
    if (logoBase64) {
      try {
        d.addImage(logoBase64, 'PNG', margin, 8, 40, 18, undefined, 'FAST')
      } catch (err) {
        try {
          d.addImage(logoBase64, 'JPEG', margin, 8, 40, 18, undefined, 'FAST')
        } catch {
          /* intentionally ignored */
        }
      }
    } else {
      const nome = userDetails?.imobiliaria_nome || 'GODOY PRIME REALTY'
      if (nome.toUpperCase().includes('GODOY PRIME REALTY') && !nome.includes('■')) {
        d.setFont('helvetica', 'normal')
        d.setFontSize(16)
        d.setTextColor(12, 35, 64)
        d.text('G O D O Y', margin, 15)
        d.setFontSize(8)
        d.text('P R I M E  R E A L T Y', margin, 20)
      } else {
        d.setFont('helvetica', 'bold')
        d.setFontSize(12)
        d.setTextColor(12, 35, 64)
        d.text(nome, margin, 18)
      }
    }

    const title = getDocumentTitle(userDetails?.tipo_documento)

    d.setFont('helvetica', 'bold')
    d.setFontSize(16)
    d.setTextColor(12, 35, 64)
    d.text(title, pageWidth / 2, 32, {
      align: 'center',
    })

    d.setDrawColor(212, 175, 55) // Ouro
    d.setLineWidth(0.5)
    d.line(margin, 36, pageWidth - margin, 36)

    let currentY = 42
    if (headerContentLines.length > 0) {
      d.setFont('helvetica', 'bold')
      d.setFontSize(10)
      d.setTextColor(80, 80, 80)
      d.text(headerContentLines, margin, currentY)
      currentY += headerContentLines.length * 5 + 5
    }
    return currentY
  }

  y = addHeader(doc)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(51, 65, 85)

  let preClean = minutaText
    .replace(/<p[^>]*>\s*Assessoria Jurídica Imobiliária\s*<\/p>/gi, '')
    .replace(/Assessoria Jurídica Imobiliária/gi, '')

  const title = getDocumentTitle(userDetails?.tipo_documento)
  if (title !== 'MINUTA DE CONTRATO') {
    preClean = preClean.replace(/<p[^>]*>\s*MINUTA DE CONTRATO(?: - [^<]+)?\s*<\/p>/gi, '')
    preClean = preClean.replace(/MINUTA DE CONTRATO(?: - [^\n]+)?/gi, '')
  }

  let cleanText = preClean
    .replace(/<br\s*[/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, (_, inner) => inner.toUpperCase())
    .replace(/<b[^>]*>(.*?)<\/b>/gi, (_, inner) => inner.toUpperCase())
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (_, inner) => '\n\n' + inner.toUpperCase() + '\n\n')
    .replace(/\*\*(.*?)\*\*/g, (_, inner) => inner.toUpperCase())
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?(.*?)(?:\n|$)/g, (_, inner) => '\n\n' + inner.toUpperCase() + '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&amp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  const lines = doc.splitTextToSize(cleanText, contentWidth)

  for (let i = 0; i < lines.length; i++) {
    if (y > pageHeight - 35) {
      doc.addPage()
      y = addHeader(doc)
    }
    const line = lines[i]
    if (line.trim() === line.trim().toUpperCase() && line.trim().length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(12, 35, 64)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(51, 65, 85)
    }
    doc.text(line, margin, y)
    y += 6
  }

  const footerContentLines = userDetails?.footer_content
    ? doc.splitTextToSize(userDetails.footer_content, contentWidth)
    : []

  // Add pagination and footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    if (footerContentLines.length > 0) {
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.2)
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(footerContentLines, margin, pageHeight - 20)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(12, 35, 64)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  }

  return doc
}

export async function getMinutaPDFBlobUrl(minutaText: string, userDetails?: any): Promise<string> {
  const doc = await buildPdfDoc(minutaText, userDetails)
  // @ts-expect-error
  return doc.output('bloburl')
}

export async function generateMinutaPDF(
  minutaText: string,
  fileName: string,
  userDetails?: any,
): Promise<void> {
  if (minutaText.includes('<!-- CHECKLIST_FORMAT -->')) {
    return generateChecklistPDFTemplate(minutaText, fileName, userDetails)
  }

  const doc = await buildPdfDoc(minutaText, userDetails)
  doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export async function generateAnalysisPDF(report: any, contract: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      let y = 40
      const margin = 20
      const pageWidth = 210
      const contentWidth = pageWidth - margin * 2
      const pageHeight = 297

      const addHeader = (d: jsPDF) => {
        d.setFont('helvetica', 'bold')
        d.setFontSize(10)
        d.setTextColor(12, 35, 64)
        d.text('ANÁLISE DE COMPLIANCE JURÍDICO', pageWidth / 2, 23, {
          align: 'center',
        })

        d.setDrawColor(212, 175, 55) // Ouro
        d.setLineWidth(0.5)
        d.line(margin, 28, pageWidth - margin, 28)
      }

      const addFooter = () => {
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          if (i === 1) continue // Skip cover page footer if there is one

          doc.setDrawColor(212, 175, 55)
          doc.setLineWidth(0.5)
          doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

          doc.setFontSize(7)
          doc.setTextColor(12, 35, 64)
          const footerText =
            'AVISO JURÍDICO: Esta análise é suporte informativo. Não substitui assessoria jurídica profissional.'
          doc.text(footerText, margin, pageHeight - 15)

          doc.setFontSize(8)
          doc.text(`Página ${i - 1} de ${pageCount - 1}`, pageWidth / 2, pageHeight - 15, {
            align: 'center',
          })

          const dateText = format(new Date(), 'dd/MM/yyyy')
          doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), pageHeight - 15)
        }
      }

      const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 35) {
          doc.addPage()
          addHeader(doc)
          y = 40
        }
      }

      const addText = (
        text: string,
        size: number,
        isBold: boolean,
        color: number[],
        indent = 0,
      ) => {
        const safeText = String(text || '')
          .replace(/•/g, '-')
          .replace(/✅/g, '[V]')
          .replace(/⚠️/g, '[!]')
          .replace(/🔴/g, '[X]')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#{1,6}\s+/g, '')
        if (!safeText.trim()) return
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.setFontSize(size)
        doc.setTextColor(color[0], color[1], color[2])
        const lines = doc.splitTextToSize(safeText, contentWidth - indent)
        checkPageBreak(lines.length * (size * 0.4) + 2)
        doc.text(lines, margin + indent, y)
        y += lines.length * (size * 0.4) + 2
      }

      const addSectionTitle = (title: string, forceBreak = true) => {
        if (forceBreak && y > 60) {
          doc.addPage()
          addHeader(doc)
          y = 40
        } else {
          checkPageBreak(25)
        }
        y += 5
        addText(title, 14, true, [12, 35, 64])
        y += 2
      }

      // Cover Page for Analysis
      doc.setFillColor(12, 35, 64) // Marinho
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      doc.setDrawColor(212, 175, 55)
      doc.setLineWidth(1)
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATÓRIO DE ANÁLISE DE COMPLIANCE JURÍDICO', pageWidth / 2, pageHeight / 3, {
        align: 'center',
      })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(212, 175, 55)
      doc.text(
        `GERADO EM: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pageWidth / 2,
        pageHeight - 60,
        { align: 'center' },
      )

      doc.addPage()
      addHeader(doc)
      y = 40

      // Content Header
      addText('ANÁLISE JURÍDICA DE CONTRATO', 16, true, [12, 35, 64])
      y += 5

      addText(`Data da Análise: ${format(new Date(), 'dd/MM/yyyy')}`, 11, true, [12, 35, 64])
      addText(`Tipo de Contrato: ${contract?.tipo || 'Não especificado'}`, 11, false, [50, 50, 50])
      addText(`Vendedor: ${contract?.nome_vendedor || 'Não especificado'}`, 11, false, [50, 50, 50])
      addText(
        `Comprador: ${contract?.nome_comprador || 'Não especificado'}`,
        11,
        false,
        [50, 50, 50],
      )
      y += 5

      // Section 1
      addSectionTitle('1. CONFORMIDADE ESTRUTURAL', false)
      const status = report?.conformidade?.status?.toUpperCase() || 'DESCONHECIDO'
      let statusColor = [100, 100, 100]
      let statusLabel = status
      if (status === 'CONFORME' || status === 'BAIXO') {
        statusColor = [34, 197, 94]
        statusLabel = '[V] ' + status
      } else if (status === 'RISCO' || status === 'MEDIO' || status === 'MÉDIO') {
        statusColor = [245, 158, 11]
        statusLabel = '[!] ' + status
      } else if (status === 'CRITICO' || status === 'CRÍTICO' || status === 'ALTO') {
        statusColor = [239, 68, 68]
        statusLabel = '[X] ' + status
      }

      addText(`Status Geral: ${statusLabel}`, 12, true, statusColor)
      y += 2

      addText('Cláusulas Encontradas:', 11, true, [0, 0, 0])
      if (!report?.conformidade?.clausulasEncontradas?.length) {
        addText('Nenhuma', 11, false, [100, 100, 100], 5)
      } else {
        report.conformidade.clausulasEncontradas.forEach((c: string) => {
          addText(`[V] ${c}`, 11, false, [34, 197, 94], 5)
        })
      }
      y += 2

      addText('Cláusulas Faltando:', 11, true, [0, 0, 0])
      if (!report?.conformidade?.clausulasFaltando?.length) {
        addText('Nenhuma', 11, false, [100, 100, 100], 5)
      } else {
        report.conformidade.clausulasFaltando.forEach((c: string) => {
          addText(`[X] ${c}`, 11, false, [239, 68, 68], 5)
        })
      }

      // Section 2
      addSectionTitle('2. RISCOS IDENTIFICADOS', true)
      if (!report?.riscos || report.riscos.length === 0) {
        addText('Nenhum risco significativo identificado.', 11, false, [34, 197, 94])
      } else {
        report.riscos.forEach((r: any) => {
          let rColor = [50, 50, 50]
          const sev = r.severidade?.toUpperCase()
          if (sev === 'ALTO') rColor = [239, 68, 68]
          else if (sev === 'MEDIO' || sev === 'MÉDIO') rColor = [245, 158, 11]
          else if (sev === 'BAIXO') rColor = [34, 197, 94]

          addText(`${r.titulo} (${r.severidade})`, 11, true, rColor)
          addText(r.descricao, 11, false, [50, 50, 50])
          if (r.embasamento) {
            addText(`Embasamento: ${r.embasamento}`, 10, false, [100, 100, 100], 5)
          }
          y += 3
        })
      }

      // Section 3
      addSectionTitle('3. CLÁUSULAS ABUSIVAS', true)
      if (!report?.clausulasAbusivas || report.clausulasAbusivas.length === 0) {
        addText('Nenhuma cláusula abusiva identificada.', 11, false, [34, 197, 94])
      } else {
        report.clausulasAbusivas.forEach((a: any) => {
          addText(`Texto: "${a.texto}"`, 11, false, [239, 68, 68])
          addText(`Motivo: ${a.motivo}`, 11, false, [50, 50, 50])
          addText(`Recomendação: ${a.recomendacao}`, 11, false, [245, 158, 11])
          y += 3
        })
      }

      // Section 4
      addSectionTitle('4. OMISSÕES', true)
      if (!report?.omissoes || report.omissoes.length === 0) {
        addText('Nenhuma omissão crítica identificada.', 11, false, [34, 197, 94])
      } else {
        report.omissoes.forEach((o: any) => {
          addText(`${o.clausula} (${o.importancia})`, 11, true, [245, 158, 11])
          addText(`Sugestão: ${o.redacaoPadrao}`, 11, false, [50, 50, 50], 5)
          y += 3
        })
      }

      // Section 5
      addSectionTitle('5. RECOMENDAÇÕES', true)
      addText('Imediatas:', 11, true, [239, 68, 68])
      if (!report?.recomendacoes?.imediatas?.length) {
        addText('- Nenhuma', 11, false, [50, 50, 50], 5)
      } else {
        report.recomendacoes.imediatas.forEach((r: string) => {
          addText(`- ${r}`, 11, false, [50, 50, 50], 5)
        })
      }
      y += 3
      addText('Recomendadas:', 11, true, [34, 197, 94])
      if (!report?.recomendacoes?.recomendadas?.length) {
        addText('- Nenhuma', 11, false, [50, 50, 50], 5)
      } else {
        report.recomendacoes.recomendadas.forEach((r: string) => {
          addText(`- ${r}`, 11, false, [50, 50, 50], 5)
        })
      }

      addFooter()

      const typeStr = (contract?.tipo || 'Contrato').replace(/\s+/g, '_')
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      doc.save(`Analise_Juridica_${typeStr}_${dateStr}.pdf`)

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
