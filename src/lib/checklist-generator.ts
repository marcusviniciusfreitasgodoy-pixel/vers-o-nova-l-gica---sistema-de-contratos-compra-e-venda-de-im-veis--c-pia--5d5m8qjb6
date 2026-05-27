import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { getLogoBase64 } from './pdf-utils'

export interface ChecklistItem {
  title: string
  desc: string
}

export interface ChecklistCategory {
  title: string
  items: ChecklistItem[]
}

export function getCategories(
  data: any,
  segment: 'completo' | 'vendedor_imovel' | 'comprador' = 'completo',
): ChecklistCategory[] {
  const isVendedorPJ = data?.vendedor_pj || data?.tipo_vendedor === 'pj'
  const isCompradorPJ = data?.tipo_comprador === 'pj'
  const isVendedorCasado =
    data?.estado_civil_vendedor === 'Casado' ||
    data?.estado_civil_vendedor === 'Casada' ||
    data?.vendedor_uniao_estavel
  const isCompradorCasado =
    data?.estado_civil_comprador === 'Casado' ||
    data?.estado_civil_comprador === 'Casada' ||
    data?.comprador_uniao_estavel
  const isComercial =
    data?.tipo_imovel?.toLowerCase() === 'comercial' ||
    data?.tipo_imovel?.toLowerCase() === 'sala_comercial' ||
    data?.tipo_imovel?.toLowerCase() === 'sala comercial'
  const temFinanciamento =
    data?.financiamento_comprador ||
    data?.possui_financiamento ||
    data?.tipo_negociacao === 'financiamento'
  const usaFgts = data?.fgts_comprador || data?.uso_fgts

  const documentosImovel: ChecklistItem[] = [
    {
      title: 'Matrícula Atualizada do Imóvel (emitida nos últimos 30 dias)',
      desc: 'Verificar a propriedade atual e a existência de ônus ou gravames recentes.',
    },
    {
      title: 'Certidão de Ônus Reais e Ações Reipersecutórias',
      desc: 'Verifica a saúde jurídica do imóvel e existência de gravames na matrícula.',
    },
    {
      title: 'Certidão de Quitação Condominial',
      desc: 'Comprova a inexistência de débitos junto ao condomínio. Deve ser acompanhada da Ata de Eleição do Síndico vigente para comprovação de poderes.',
    },
    {
      title: 'Funesbom (Taxa de Incêndio)',
      desc: 'Comprova o pagamento da taxa de incêndio do exercício vigente.',
    },
    {
      title:
        'Certidão de Situação Fiscal e Enfitêutica (ou Espelho de IPTU do ano vigente com comprovante de pagamento)',
      desc: 'Demonstra a regularidade fiscal do imóvel junto ao município.',
    },
  ]

  if (isComercial) {
    documentosImovel.push({
      title: 'Alvará de Funcionamento e Localização',
      desc: 'Comprova a autorização municipal para atividade comercial.',
    })
    documentosImovel.push({
      title: 'Certificado de Aprovação do Corpo de Bombeiros (AVCB)',
      desc: 'Garante a segurança e conformidade contra incêndios.',
    })
    documentosImovel.push({
      title: 'Licença Ambiental',
      desc: 'Se aplicável à atividade, demonstra regularidade ambiental.',
    })
  }

  const documentosVendedor: ChecklistItem[] = [
    {
      title: 'Ficha Cadastral',
      desc: 'Devidamente preenchida e assinada para qualificação completa.',
    },
    {
      title: 'Comprovante de Residência Atualizado',
      desc: 'Documento emitido nos últimos 3 meses.',
    },
  ]

  if (isVendedorPJ) {
    documentosVendedor.push({
      title: 'Contrato Social Atualizado ou Estatuto Social',
      desc: 'Documento constitutivo da empresa registrado no órgão competente.',
    })
    documentosVendedor.push({
      title: 'CNPJ e Certidão Simplificada da Junta Comercial',
      desc: 'Comprova a situação cadastral e societária atual da empresa.',
    })
    documentosVendedor.push({
      title: 'Documento de Identidade e CPF dos Sócios/Representantes',
      desc: 'Identificação civil dos administradores legais.',
    })
  } else {
    documentosVendedor.push({
      title: 'Documento de Identidade (RG/CNH) e CPF',
      desc: 'Identificação civil básica.',
    })
    documentosVendedor.push({
      title: 'Certidão de Nascimento ou Casamento',
      desc: 'Comprova o estado civil atual (atualizada em até 90 dias).',
    })
    if (isVendedorCasado) {
      documentosVendedor.push({
        title: 'Documento de Identidade (RG/CNH) e CPF do Cônjuge/Companheiro(a)',
        desc: 'Identificação civil do cônjuge ou companheiro.',
      })
      documentosVendedor.push({
        title: 'Pacto Antenupcial com Registro',
        desc: 'Se aplicável ao regime de bens adotado.',
      })
    }
  }

  documentosVendedor.push({
    title: 'Certidões de Protesto (1º ao 4º Ofício)',
    desc: 'Verificação da confiabilidade financeira e inadimplência no mercado.',
  })
  documentosVendedor.push({
    title: 'Certidão Conjunta de Débitos Federais (PGFN/RFB)',
    desc: 'Verifica débitos com a União e riscos de penhora fiscal.',
  })
  documentosVendedor.push({
    title: 'Certidões de Distribuidores Estaduais (1º e 2º Ofícios de Distribuição)',
    desc: 'Rastreia processos de litígio, ações de execução e riscos ao patrimônio.',
  })
  documentosVendedor.push({
    title: 'Certidão de Distribuição da Justiça Federal',
    desc: 'Verifica a existência de processos cíveis e criminais na esfera federal.',
  })
  documentosVendedor.push({
    title: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
    desc: 'Verifica a ausência de condenações trabalhistas transitadas em julgado.',
  })
  documentosVendedor.push({
    title: 'Certidões de Débitos Estaduais e Municipais',
    desc: 'Comprova a regularidade fiscal nas esferas estadual e municipal.',
  })
  documentosVendedor.push({
    title: 'Certidão de Indisponibilidade de Bens (CNIB)',
    desc: 'Confirma se não há ordens judiciais bloqueando os bens da parte.',
  })

  const documentosComprador: ChecklistItem[] = [
    {
      title: 'Ficha Cadastral',
      desc: 'Devidamente preenchida e assinada para qualificação completa.',
    },
    {
      title: 'Comprovante de Residência Atualizado',
      desc: 'Documento emitido nos últimos 3 meses.',
    },
  ]

  if (isCompradorPJ) {
    documentosComprador.push({
      title: 'Contrato Social Atualizado ou Estatuto Social',
      desc: 'Documento constitutivo da empresa.',
    })
    documentosComprador.push({
      title: 'CNPJ e Documento de Identidade dos Sócios',
      desc: 'Identificação da pessoa jurídica e seus representantes.',
    })
  } else {
    documentosComprador.push({
      title: 'Documento de Identidade (RG/CNH) e CPF',
      desc: 'Identificação civil básica.',
    })
    documentosComprador.push({
      title: 'Certidão de Nascimento ou Casamento',
      desc: 'Comprova o estado civil atual (atualizada em até 90 dias).',
    })
    if (isCompradorCasado) {
      documentosComprador.push({
        title: 'Documento de Identidade (RG/CNH) e CPF do Cônjuge/Companheiro(a)',
        desc: 'Identificação civil do cônjuge ou companheiro.',
      })
      documentosComprador.push({
        title: 'Pacto Antenupcial com Registro',
        desc: 'Se aplicável ao regime de bens adotado.',
      })
    }
  }

  const infosFinanceiras: ChecklistItem[] = [
    {
      title: 'Dados Bancários Completos',
      desc: 'Banco, Agência, Conta e Titularidade vinculada ao CPF/CNPJ.',
    },
    {
      title: 'Chave PIX',
      desc: 'Para recebimentos ágeis (se aplicável).',
    },
  ]

  const complianceFinanciamento: ChecklistItem[] = [
    {
      title: 'Termo de Consentimento LGPD',
      desc: 'Assinado pelas partes autorizando o tratamento de dados.',
    },
    {
      title: 'Declaração de PEP',
      desc: 'Identificação de Pessoa Politicamente Exposta.',
    },
  ]

  if (temFinanciamento) {
    complianceFinanciamento.push({
      title: 'Aprovação de Crédito Bancário',
      desc: 'Carta ou comprovante de aprovação da instituição financeira.',
    })
    complianceFinanciamento.push({
      title: 'Formulários do Banco Financiador',
      desc: 'Documentos específicos exigidos e assinados.',
    })
  }
  if (usaFgts) {
    complianceFinanciamento.push({
      title: 'Extrato do FGTS e Autorização de Saque',
      desc: 'Comprovação de saldo e permissão para utilização.',
    })
    complianceFinanciamento.push({
      title: 'Declaração de Primeira Aquisição',
      desc: 'Se aplicável para obtenção de descontos.',
    })
  }

  let categories = [
    { title: 'Certidões do Imóvel', items: documentosImovel },
    { title: 'Certidões dos Vendedores', items: documentosVendedor },
    { title: 'Documentos dos Compradores', items: documentosComprador },
    { title: 'Informações Financeiras', items: infosFinanceiras },
    { title: 'Compliance & Financiamento', items: complianceFinanciamento },
  ]

  if (segment === 'vendedor_imovel') {
    categories = categories.filter((c) =>
      ['Certidões do Imóvel', 'Certidões dos Vendedores', 'Informações Financeiras'].includes(
        c.title,
      ),
    )
  } else if (segment === 'comprador') {
    categories = categories.filter((c) =>
      ['Documentos dos Compradores', 'Compliance & Financiamento'].includes(c.title),
    )
  }

  return categories
}

export function migrateChecklistCompliance(
  compliance: Record<string, boolean> | undefined,
): Record<string, boolean> {
  if (!compliance) return {}
  const migrated = { ...compliance }

  const mappings: Record<string, string[]> = {
    'Certidões do Imóvel - Certidão de Situação Fiscal e Enfiteutica (IPTU)': [
      'Certidões do Imóvel - Certidão de Situação Fiscal e Enfitêutica (ou Espelho de IPTU do ano vigente com comprovante de pagamento)',
    ],
    'Certidões dos Vendedores - Certidões de Protesto (10 Cartórios)': [
      'Certidões dos Vendedores - Certidões de Protesto (1º ao 4º Ofício)',
    ],
    'Certidões dos Vendedores - Distribuidores Cíveis (Estadual e Federal)': [
      'Certidões dos Vendedores - Certidões de Distribuidores Estaduais (1º e 2º Ofícios de Distribuição)',
      'Certidões dos Vendedores - Certidão de Distribuição da Justiça Federal',
    ],
    'Certidões dos Vendedores - Certidões de Distribuidores Criminais (Estadual e Federal)': [
      'Certidões dos Vendedores - Certidão de Distribuição da Justiça Federal',
    ],
  }

  for (const [oldKey, newKeys] of Object.entries(mappings)) {
    if (migrated[oldKey] === true) {
      newKeys.forEach((newKey) => {
        if (migrated[newKey] === undefined) {
          migrated[newKey] = true
        }
      })
      delete migrated[oldKey]
    }
  }

  return migrated
}

export function getActiveDocs(data: any): string[] {
  let docs: string[] = []
  getCategories(data).forEach((cat) => {
    cat.items.forEach((item) => {
      docs.push(`${cat.title} - ${item.title}`)
    })
  })
  return docs
}

export function generateChecklistHTML(
  data: any,
  segment: 'completo' | 'vendedor_imovel' | 'comprador' = 'completo',
): string {
  const vendedor = data?.nome_vendedor || '_______________________'
  const comprador = data?.nome_comprador || '_______________________'
  const endereco = data?.endereco_imovel || '_______________________'

  let html = `<!-- CHECKLIST_FORMAT -->\n`
  html += `<div style="font-family: sans-serif; color: #0C2340;">\n`

  const titleSuffix =
    segment === 'vendedor_imovel'
      ? ' - VENDEDOR E IMÓVEL'
      : segment === 'comprador'
        ? ' - COMPRADOR'
        : ''
  html += `<h2 style="color: #0C2340; text-align: center; margin-bottom: 15px; font-weight: bold; font-size: 16pt;">CHECKLIST DOCUMENTAL${titleSuffix}</h2>\n`
  html += `<div style="height: 1px; background-color: #D4AF37; margin: 10px auto 20px auto; width: 100%;"></div>\n`

  html += `<p style="font-size: 12pt; text-align: justify; margin-bottom: 20px; line-height: 1.5;">`
  if (segment === 'vendedor_imovel') {
    html += `O presente checklist relaciona a documentação necessária do imóvel localizado em <strong>${endereco}</strong> e de seu(s) Vendedor(es) <strong>${vendedor}</strong>.`
  } else if (segment === 'comprador') {
    html += `O presente checklist relaciona a documentação necessária do(s) Comprador(es) <strong>${comprador}</strong>.`
  } else {
    html += `O presente checklist tem por finalidade relacionar a documentação necessária para a análise de risco e conformidade jurídica (Due Diligence) na operação de compra e venda do imóvel localizado em <strong>${endereco}</strong>, figurando como Vendedor(a) <strong>${vendedor}</strong> e como Comprador(a) <strong>${comprador}</strong>.`
  }
  html += `</p>\n`

  getCategories(data, segment).forEach((category) => {
    html += `<div class="checklist-block" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">\n`
    html += `<h3 style="color: #0C2340; margin-top: 0; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; font-size: 14pt;">${category.title.toUpperCase()}</h3>\n`
    html += `<ul style="list-style-type: none; padding-left: 0;">\n`

    category.items.forEach((item) => {
      const key = `${category.title} - ${item.title}`
      const safeCompliance = migrateChecklistCompliance(data.checklist_compliance)
      const isChecked = safeCompliance && safeCompliance[key] === true
      const prefix = isChecked ? '✓ COLETADO' : '⚠️ PENDENTE'
      const color = isChecked ? '#D4AF37' : '#ea580c'
      const cleanTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      const cleanDesc = item.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      html += `<li style="margin-bottom: 12px; display: flex; align-items: flex-start;" data-checked="${isChecked ? 'true' : 'false'}" data-title="${encodeURIComponent(item.title)}" data-desc="${encodeURIComponent(item.desc)}">`
      html += `<strong style="color: ${color}; margin-right: 8px; font-size: 11pt; white-space: nowrap; margin-top: 2px;">${prefix}</strong> `
      html += `<div style="display: flex; flex-direction: column;">`
      html += `<span style="font-size: 12pt; font-weight: bold; color: #0f172a;">${cleanTitle}</span>`
      html += `<span style="font-size: 11pt; color: #475569; margin-top: 2px;">${cleanDesc}</span>`
      html += `</div>`
      html += `</li>\n`
    })
    html += `</ul>\n</div>\n`
  })

  html += `</div>`
  return html
}

export async function generateChecklistPDFTemplate(
  minutaText: string,
  fileName: string,
  userDetails: any,
): Promise<void> {
  const logoBase64 = await getLogoBase64(userDetails)

  return new Promise((resolve) => {
    const doc = new jsPDF()
    let y = 40
    const margin = 20
    const pageWidth = 210
    const contentWidth = pageWidth - margin * 2
    const pageHeight = 297

    const parser = new DOMParser()
    const dom = parser.parseFromString(minutaText, 'text/html')
    const h2Title = dom.querySelector('h2')?.textContent || 'CHECKLIST DOCUMENTAL'

    const addHeader = (d: jsPDF) => {
      if (logoBase64) {
        try {
          d.addImage(logoBase64, 'PNG', margin, 8, 40, 18, undefined, 'FAST')
        } catch (err) {
          try {
            d.addImage(logoBase64, 'JPEG', margin, 8, 40, 18, undefined, 'FAST')
          } catch {
            // ignore
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

      d.setFont('helvetica', 'bold')
      d.setFontSize(14)
      d.setTextColor(12, 35, 64)
      d.text(h2Title, pageWidth / 2, 32, { align: 'center' })

      d.setDrawColor(212, 175, 55)
      d.setLineWidth(0.5)
      d.line(margin, 36, pageWidth - margin, 36)

      let currentY = 42

      const headerContentLines = userDetails?.header_content
        ? doc.splitTextToSize(userDetails.header_content, contentWidth)
        : []

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

    const introParagraph = dom.querySelector('p')?.textContent || ''
    if (introParagraph) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(51, 65, 85)
      const lines = doc.splitTextToSize(introParagraph, contentWidth)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 8
    }

    const blocks = dom.querySelectorAll('.checklist-block')

    blocks.forEach((block) => {
      const title = block.querySelector('h3')?.textContent || ''
      const itemsNodes = Array.from(block.querySelectorAll('li'))
      const items = itemsNodes.map((li) => {
        const spans = li.querySelectorAll('span')
        let itemTitle = ''
        let itemDesc = ''
        if (spans.length >= 2) {
          itemTitle = spans[0].textContent || ''
          itemDesc = spans[1].textContent || ''
        } else {
          itemTitle = decodeURIComponent(li.getAttribute('data-title') || '')
          itemDesc = decodeURIComponent(li.getAttribute('data-desc') || '')
        }
        return {
          title: itemTitle,
          desc: itemDesc,
          checked: li.getAttribute('data-checked') === 'true',
        }
      })

      const itemLayouts = items.map((item) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        const titleLines = doc.splitTextToSize(item.title, contentWidth - 35)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const descLines = doc.splitTextToSize(item.desc, contentWidth - 35)

        const h = titleLines.length * 5 + descLines.length * 4 + 4
        return { titleLines, descLines, h, checked: item.checked }
      })

      let chunks = []
      let currentChunk: any[] = []
      let currentChunkHeight = 18 + 6 // header + padding
      const maxPageContentHeight = pageHeight - 70

      itemLayouts.forEach((layout) => {
        if (currentChunk.length > 0 && currentChunkHeight + layout.h > maxPageContentHeight) {
          chunks.push(currentChunk)
          currentChunk = [layout]
          currentChunkHeight = 18 + 6 + layout.h
        } else {
          currentChunk.push(layout)
          currentChunkHeight += layout.h
        }
      })
      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
      }

      chunks.forEach((chunk, index) => {
        const isContinued = index > 0
        const chunkHeight = 18 + chunk.reduce((acc, it) => acc + it.h, 0) + 6

        if (y + chunkHeight > pageHeight - 30 && y > 60) {
          doc.addPage()
          y = addHeader(doc)
        }

        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, y, contentWidth, chunkHeight, 3, 3, 'FD')

        let currentY = y + 8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(12, 35, 64)
        const displayTitle = isContinued ? `${title} (Cont.)` : title
        doc.text(displayTitle, margin + 5, currentY)

        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.5)
        doc.line(
          margin + 5,
          currentY + 2,
          margin + 5 + doc.getTextWidth(displayTitle),
          currentY + 2,
        )

        currentY += 10

        chunk.forEach((layout) => {
          if (layout.checked) {
            doc.setTextColor(212, 175, 55)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.text('COLETADO', margin + 5, currentY)
          } else {
            doc.setTextColor(234, 88, 12)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.text('PENDENTE', margin + 5, currentY)
          }

          doc.setTextColor(15, 23, 42)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.text(layout.titleLines, margin + 30, currentY)

          const titleH = layout.titleLines.length * 5
          doc.setTextColor(71, 85, 105)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.text(layout.descLines, margin + 30, currentY + titleH)

          currentY += layout.h
        })

        y += chunkHeight + 6
      })
    })

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      const footerText =
        userDetails?.footer_content?.replace(/Assessoria Jurídica Imobiliária/gi, '') || ''
      if (footerText) {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        const footerLines = doc.splitTextToSize(footerText, contentWidth)
        doc.text(footerLines, margin, pageHeight - 20)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(12, 35, 64)
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    }

    doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    resolve()
  })
}
