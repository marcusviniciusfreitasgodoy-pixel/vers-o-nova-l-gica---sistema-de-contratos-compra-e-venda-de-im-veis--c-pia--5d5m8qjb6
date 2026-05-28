import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export async function generateCaseSummaryPDF(
  caseData: any,
  partes: any[],
  imovel: any,
  negociacao: any,
  transitions: any[],
  contracts: any[],
): Promise<void> {
  const doc = new jsPDF()
  let y = 20
  const margin = 20
  const pageWidth = 210
  const pageHeight = 297

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage()
      y = 20
    }
  }

  const addText = (text: string, size = 10, isBold = false) => {
    if (!text) return
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2)
    checkPageBreak(lines.length * (size * 0.4) + 2)
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.4) + 2
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('RESUMO GERAL DO CASO', pageWidth / 2, y, { align: 'center' })
  y += 10

  addText(`Data da Exportação: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 10)
  y += 5

  // Case Data
  addText('1. DADOS DO CASO', 12, true)
  y += 2
  addText(`Título: ${caseData.title}`)
  addText(`Status Atual: ${caseData.estado_caso}`)
  addText(`Prioridade: ${caseData.priority}`)
  addText(`Descrição: ${caseData.description || 'Nenhuma'}`)
  y += 5

  // Negociacao
  if (negociacao) {
    addText('2. DETALHES DA NEGOCIAÇÃO', 12, true)
    y += 2
    addText(`Estágio: ${negociacao.estagio}`)
    addText(`Valor Total: R$ ${Number(negociacao.valor_total || 0).toLocaleString('pt-BR')}`)
    addText(`Forma de Pagamento: ${negociacao.forma_pagamento?.replace(/_/g, ' ') || 'N/A'}`)
    y += 5
  }

  // Property
  if (imovel) {
    addText('3. IMÓVEL', 12, true)
    y += 2
    addText(`Tipo: ${imovel.tipo_imovel?.replace(/_/g, ' ') || 'N/A'}`)
    const addr = imovel.endereco_resumido ? imovel.endereco_resumido : ''
    const city = imovel.cidade && imovel.estado ? `- ${imovel.cidade}/${imovel.estado}` : ''
    addText(`Endereço: ${addr} ${city}`)
    addText(`Matrícula: ${imovel.matricula || imovel.matricula_numero || 'N/A'}`)
    y += 5
  }

  // Parties
  if (partes && partes.length > 0) {
    addText('4. PARTES ENVOLVIDAS', 12, true)
    y += 2
    partes.forEach((p) => {
      addText(`Nome: ${p.nome}`)
      addText(`Papel: ${p.papel_na_operacao?.replace(/_/g, ' ') || 'N/A'}`)
      addText(`Documento: ${p.documento || 'N/A'}`)
      addText(`Contato: ${p.telefone || p.e_mail || 'N/A'}`)
      y += 2
    })
    y += 3
  }

  // Contracts / Minutes
  if (contracts && contracts.length > 0) {
    addText('5. CONTRATOS / MINUTAS', 12, true)
    y += 2
    contracts.forEach((c) => {
      addText(`Tipo: ${c.tipo_documento?.replace(/_/g, ' ') || c.tipo || 'Contrato'}`)
      addText(`Status: ${c.status || 'N/A'}`)
      if (c.arquivo_gerado) {
        addText(`Arquivo Anexo: Sim (Gerado no Sistema)`)
      }
      y += 2
    })
    y += 3
  }

  // Timeline
  if (transitions && transitions.length > 0) {
    addText('6. LINHA DO TEMPO (Histórico)', 12, true)
    y += 2
    transitions.forEach((t) => {
      try {
        const date = format(new Date(t.created), 'dd/MM/yyyy HH:mm')
        const user = t.expand?.user?.name || t.expand?.user?.email || 'Sistema'
        const prev = String(t.previous_state).replace(/_/g, ' ')
        const next = String(t.new_state).replace(/_/g, ' ')
        addText(`[${date}] ${user}: ${prev} -> ${next}`)
      } catch (e) {
        // Fallback for invalid dates
        addText(`[-] Registro: ${t.previous_state} -> ${t.new_state}`)
      }
    })
  }

  doc.save(`Resumo_Caso_${caseData.id}.pdf`)
}
