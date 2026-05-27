routerAdd(
  'POST',
  '/backend/v1/assemble-contract',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const tipoDocumento = body.tipo_documento || 'promessa_compra_venda'

      const normalizeDigits = (str) => (str ? String(str).replace(/\D/g, '') : '')

      const formatCurrency = (val) => {
        if (!val) return 'R$ 0,00'
        const num = Number(val)
        if (isNaN(num)) return 'R$ 0,00'
        const parts = num.toFixed(2).split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        return 'R$ ' + parts.join(',')
      }

      let imobiliaria_nome = 'Godoy Prime Realty'
      let imobiliaria_documento = ''
      let creci = ''
      let banco_nome = ''
      let agencia = ''
      let conta = ''
      let chave_pix = ''

      if (e.auth?.id) {
        try {
          const userRecord = $app.findRecordById('users', e.auth.id)
          imobiliaria_nome = userRecord.getString('imobiliaria_nome') || imobiliaria_nome
          imobiliaria_documento = userRecord.getString('imobiliaria_documento') || ''
          creci = userRecord.getString('creci') || ''
          banco_nome = userRecord.getString('banco_nome') || ''
          agencia = userRecord.getString('agencia') || ''
          conta = userRecord.getString('conta') || ''
          chave_pix = userRecord.getString('chave_pix') || ''
        } catch (_) {}
      }

      // Master JSON Schema mapping
      const master_data = {
        metadata: {
          versao_sistema: '1.0',
          tipo_contrato: tipoDocumento,
          tipo_negociacao: body.tipo_negociacao || '',
        },
        tipo_arras: body.tipo_arras || '',
        comprador: {
          nome: body.nome_comprador || '',
          cpf: normalizeDigits(body.cpf_comprador),
          rg: body.rg_comprador || '',
          orgao_emissor: body.orgao_emissor_comprador || '',
          data_nascimento: body.data_nascimento_comprador || '',
          nacionalidade: body.nacionalidade_comprador || 'brasileiro',
          profissao: body.profissao_comprador || '',
          estado_civil: body.estado_civil_comprador || '',
          regime_bens: body.regime_bens_comprador || '',
          email: body.email_comprador || '',
          telefone: normalizeDigits(body.telefone_comprador),
          endereco: body.endereco_comprador || '',
          cep: normalizeDigits(body.cep_comprador),
          conjuge: {
            nome: body.nome_conjuge_comprador || '',
            cpf: normalizeDigits(body.cpf_conjuge_comprador),
            rg: body.rg_conjuge_comprador || '',
          },
          procurador: {
            possui: !!body.possui_procurador_comprador,
            nome: body.nome_procurador_comprador || '',
            cpf: normalizeDigits(body.cpf_procurador_comprador),
            instrumento: body.instrumento_procurador_comprador || '',
          },
          financeiro: {
            financiamento: !!body.financiamento_comprador,
            fgts: !!body.fgts_comprador,
            banco: body.instituicao_financeira || '',
            prazo_aprovacao: Number(body.prazo_aprovacao) || Number(body.prazo_financiamento) || 45,
            renda_declarada: Number(body.renda_declarada_comprador) || 0,
          },
        },
        vendedor: {
          nome: body.nome_vendedor || '',
          cpf: normalizeDigits(body.cpf_vendedor),
          rg: body.rg_vendedor || '',
          estado_civil: body.estado_civil_vendedor || '',
          regime_bens: body.regime_bens_vendedor || '',
          email: body.email_vendedor || '',
          telefone: normalizeDigits(body.telefone_vendedor),
          endereco: body.endereco_vendedor || '',
          cep: normalizeDigits(body.cep_vendedor),
          conjuge: {
            nome: body.conjuge_vendedor || '',
            cpf: normalizeDigits(body.cpf_conjuge_vendedor),
            rg: body.rg_conjuge_vendedor || '',
          },
          procurador: {
            possui: !!body.procurador_vendedor,
            nome: body.nome_procurador_vendedor || '',
            cpf: normalizeDigits(body.cpf_procurador_vendedor),
            instrumento: body.instrumento_procurador_vendedor || '',
          },
        },
        imovel: {
          tipo: body.tipo_imovel || 'apartamento',
          endereco: body.endereco_imovel || '',
          numero: body.numero_imovel || '',
          complemento: body.complemento_imovel || '',
          bairro: body.bairro_imovel || '',
          cidade: body.cidade_imovel || '',
          estado: body.estado_imovel || '',
          cep: normalizeDigits(body.cep_imovel),
          registro: {
            matricula: body.matricula_imovel || '',
            cartorio: body.cartorio_imovel || '',
            inscricao_iptu: body.inscricao_iptu || '',
          },
          caracteristicas: {
            area_privativa: body.area_privativa || '',
            area_total: body.area_total || '',
            vagas: Number(body.vagas_garagem) || 0,
            suite: Number(body.suites) || 0,
            quartos: Number(body.quartos) || 0,
            estado_conservacao: body.estado_conservacao || '',
            leitura_agua: body.leitura_agua || '',
            leitura_luz: body.leitura_luz || '',
            leitura_gas: body.leitura_gas || '',
          },
          situacao_juridica: {
            ocupado: !!body.imovel_ocupado,
            locado: !!body.imovel_locado,
            financiado: !!body.imovel_financiado,
            inventario: !!body.imovel_inventario,
            usufruto: !!body.possui_usufruto,
            onus: !!body.possui_onus,
            acoes_judiciais: !!body.acoes_judiciais,
          },
        },
        financeiro: {
          valor_total: Number(body.valor_total) || 0,
          valor_sinal: Number(body.valor_sinal) || 0,
          valor_sinal_formatado: body.valor_sinal ? formatCurrency(body.valor_sinal) : 'R$ 0,00',
          valor_total_formatado: body.valor_total ? formatCurrency(body.valor_total) : 'R$ 0,00',
          valor_torna: Number(body.possui_torna) || 0,
          valor_fgts: Number(body.valor_fgts) || 0,
          valor_financiamento: Number(body.valor_financiamento) || 0,
          valor_recursos_proprios: Number(body.valor_recursos_proprios) || 0,
          parcelamento: {
            possui: (Number(body.quantidade_parcelas) || 0) > 0,
            quantidade_parcelas: Number(body.quantidade_parcelas) || 0,
            valor_parcela: Number(body.valor_parcela) || 0,
          },
          datas: {
            pagamento_sinal: body.data_pagamento_sinal || '',
            assinatura: body.data_assinatura || '',
            escritura: body.prazo_escritura || '',
            quitacao: body.data_quitacao || '',
          },
          multas: {
            inadimplencia_percentual: Number(body.multa_inadimplencia) || 10,
            multa_desocupacao: Number(body.multa_desocupacao) || 0,
          },
          permuta_dacao: {
            is_permuta_dacao: ['permuta', 'dacao'].includes(body.tipo_negociacao),
            endereco: body.permuta_imovel_endereco || '',
            matricula: body.permuta_imovel_matricula || '',
            valor: Number(body.permuta_imovel_valor) || 0,
            detalhes: body.permuta_imovel_detalhes || '',
          },
        },
        posse: {
          imediata: !!body.posse_imediata,
          data_posse: body.data_posse || '',
          prazo_desocupacao: Number(body.prazo_desocupacao) || 0,
          vistoria_obrigatoria: !!body.vistoria_obrigatoria,
        },
        comissao: {
          percentual: Number(body.percentual_comissao) || 5,
          valor: Number(body.valor_comissao) || 0,
          responsavel_pagamento: body.responsavel_comissao || 'vendedor',
          garantida: !!body.comissao_garantida,
          imobiliaria: imobiliaria_nome,
          creci: creci,
          documento: imobiliaria_documento,
          dados_bancarios: {
            banco: banco_nome,
            agencia: agencia,
            conta: conta,
            chave_pix: chave_pix,
          },
        },
        compliance: {
          pep: !!body.pep,
          lgpd: !!body.clausula_lgpd,
          assinatura_eletronica: !!body.assinatura_eletronica,
          plataforma_assinatura: body.plataforma_assinatura || 'Clicksign',
          foro: body.foro_comarca || 'Rio de Janeiro/RJ',
          mediacao: !!body.mediacao,
          arbitragem: !!body.arbitragem,
        },
      }

      const isContractType = [
        'promessa_compra_venda',
        'contrato_particular',
        'recibo_sinal',
        'distrato',
      ].includes(tipoDocumento)

      if (tipoDocumento === 'autorizacao_intermediacao') {
        const formatCurrency = (val) => {
          if (!val) return 'R$ 0,00'
          const num = Number(val)
          if (isNaN(num)) return 'R$ 0,00'
          const parts = num.toFixed(2).split('.')
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          return 'R$ ' + parts.join(',')
        }

        const isExclusiva = body.gestao_exclusiva === 'com_exclusiva'
        const gestaoStr = isExclusiva
          ? ' _X_ COM GESTÃO EXCLUSIVA _____ SEM GESTÃO EXCLUSIVA'
          : ' ___ COM GESTÃO EXCLUSIVA __X__ SEM GESTÃO EXCLUSIVA'

        const t_condominio = formatCurrency(body.valor_condominio)
        const t_iptu = formatCurrency(body.valor_iptu_anual)
        const t_avaliacao = formatCurrency(body.valor_avaliacao)
        const t_venda = formatCurrency(body.valor_total)

        const hoje = new Date()
        const meses = [
          'janeiro',
          'fevereiro',
          'março',
          'abril',
          'maio',
          'junho',
          'julho',
          'agosto',
          'setembro',
          'outubro',
          'novembro',
          'dezembro',
        ]
        const dataFormatada = `${hoje.getUTCDate()} de ${meses[hoje.getUTCMonth()]} de ${hoje.getUTCFullYear()}`

        const text = `<h2>AUTORIZAÇÃO PARA DIVULGAÇÃO E VENDA DE IMÓVEL</h2>

<p><strong>CONTRATANTES</strong></p>
<p>NOME: ${body.nome_vendedor || ''}</p>
<p>IDENTIDADE: ${body.rg_vendedor || ''} ORGÃO EMISSOR: ${body.orgao_emissor_vendedor || ''} CPF: ${body.cpf_vendedor || ''}</p>
<p>TELEFONES: ${body.telefone_vendedor || ''} E-MAIL: ${body.email_vendedor || ''}</p>
<p>CONTRATADO: ${imobiliaria_nome.toUpperCase()} CPF/CNPJ: ${imobiliaria_documento}</p>

<p><strong>DESCRIÇÃO DO IMÓVEL</strong></p>
<p>ENDEREÇO: ${body.endereco_imovel || ''}${body.numero_imovel ? ', ' + body.numero_imovel : ''}${body.complemento_imovel ? ' - ' + body.complemento_imovel : ''}</p>
<p>BAIRRO: ${body.bairro_imovel || ''} CIDADE: ${body.cidade_imovel || ''} CEP: ${body.cep_imovel || ''}</p>
<p>R$ CONDOMINIO: ${t_condominio} R$ IPTU: ${t_iptu} VAGAS: ${body.vagas_garagem || '0'} QUARTOS: ${body.quartos || '0'}</p>
<p>VALOR DE AVALIAÇÃO: ${t_avaliacao}</p>
<p>VALOR DE VENDA: ${t_venda}</p>

<p><strong>CONDIÇÕES</strong></p>
<p>1. A presente Autorização de Venda, ${gestaoStr}, tem o seu amparo na Lei 6.530, Art. 20, item III, de 12/05/1978 e pela Resolução do COFECI no. 458/95 de 17/11/1995. Entenda-se por GESTÃO EXCLUSIVA, a escolha do CONTRATADO, como responsável exclusivo pela Representação Comercial do imóvel perante o mercado. A ele caberá centralizar os contatos de possíveis interessados Clientes Diretos ou Corretores, acompanhar todas as visitas realizadas, atender outros Corretores interessados em estabelecer parceria comercial para venda do Imóvel e investir na divulgação do imóvel de forma ampla.</p>
<p>2. É concedida esta autorização pelo prazo de 90 dias, a contar desta data, nela também está incluída a veiculação de anúncios e fotos do imóvel em todos os meios de publicidade utilizados pelo CONTRATADO, prorrogada automatically pelo mesmo período, caso, após o término do citado prazo, não ocorra manifestação expressa dos CONTRATANTES.</p>
<p>3. Os CONTRATANTES se comprometem a pagar ao CONTRATADO o percentual de 5% sobre o preço de venda efetivamente transacionado, a título de honorários de corretagem, que serão pagos no ato da assinatura da escritura de compra e venda.</p>
<p>4. A mesma remuneração será devida pelos CONTRATANTES se, durante a vigência desta autorização o proprietário realizar a venda do imóvel sem a ciência e acompanhamento do CONTRATADO ou se após o término do prazo estabelecido neste instrumento, eles venham a realizar, por conta própria ou através de terceiros, a venda do imóvel objeto da presente autorização, com pretendentes apresentados ou indicados pelo CONTRATADO, conforme relação nominal que lhes será ou tenha sido entregue, relação essa obtida por meio de registro nas respectivas fichas de visita ao imóvel.</p>
<p>5. O CONTRATADO se compromete a não medir esforços no sentido de intermediar a venda do imóvel com base nas condições acima descritas, agindo de forma legal, obedecendo fielmente à legislação vigente e o Código de Ética da Profissão, estabelecido pelo CONSELHO FEDERAL DE CORRETORES DE IMÓVEIS – COFECI.</p>
<p>6. Os CONTRATANTES se responsabilizam por todas as informações pessoais e de propriedade aqui prestadas acerca do imóvel objeto da presente Autorização.</p>
<p>7. Para dirimir eventuais dúvidas ou questões oriundas da presente Autorização, que não possam ser resolvidas de comum acordo entre as partes, fica eleito o foro da Comarca do Rio de Janeiro, RJ, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

<p>Rio de Janeiro, ${dataFormatada}</p>

<p>NOME:________________________________________________________________________.<br>CONTRATANTE(S)<br>CPF: ${body.cpf_vendedor || '_________________________'}</p>

<p>CORRETOR:____________________________________________________________________.<br>CONTRATADO<br>CRECI: ${creci}</p>`

        return e.json(200, { minuta_texto: text, used_clauses: [] })
      }

      // General Compliance Validations
      if (
        !master_data.comprador.cpf &&
        body.tipo_comprador !== 'pj' &&
        tipoDocumento !== 'autorizacao_intermediacao'
      ) {
        return e.badRequestError('Compliance Alert: CPF do comprador é obrigatório.')
      }
      if (!master_data.vendedor.cpf && !body.vendedor_pj) {
        return e.badRequestError('Compliance Alert: CPF do vendedor é obrigatório.')
      }

      // Contract-specific Compliance Validations
      if (isContractType) {
        if (
          (master_data.vendedor.estado_civil.toLowerCase() === 'casado' ||
            master_data.vendedor.estado_civil.toLowerCase() === 'casada') &&
          !master_data.vendedor.conjuge.nome
        ) {
          return e.badRequestError(
            'Compliance Alert: Dados do cônjuge do vendedor são obrigatórios para casados (Sellers married under Communion of Assets require Spouse identification).',
          )
        }
        if (
          master_data.comprador.financeiro.financiamento &&
          !master_data.comprador.financeiro.banco
        ) {
          return e.badRequestError(
            'Compliance Alert: Instituição Financeira é obrigatória para financiamentos.',
          )
        }
        if (
          master_data.comprador.financeiro.financiamento &&
          master_data.financeiro.valor_financiamento === 0
        ) {
          return e.badRequestError(
            'Compliance Alert: Valor do financiamento é obrigatório quando há financiamento.',
          )
        }
        if (master_data.comissao.garantida && !master_data.comissao.responsavel_pagamento) {
          return e.badRequestError(
            'Compliance Alert: Responsável pelo pagamento da comissão é obrigatório para comissões garantidas.',
          )
        }
      }

      const clauses = $app.findRecordsByFilter(
        'legal_knowledge',
        "category = 'clausula_fixa' || category = 'clausula_condicional' || category = 'protecao_comercial' || category = 'distrato' || category = 'permuta' || category = 'checklist_documental' || category = 'boas_praticas'",
        'priority',
        1000,
        0,
      )

      const triggerLogicEval = (logicStr, data) => {
        if (!logicStr) return true
        try {
          const rule = JSON.parse(logicStr)
          const keys = rule.path.split('.')
          let val = data
          for (let k of keys) {
            if (val === undefined) break
            val = val[k]
          }

          if (rule.operator === '>') return val > rule.value
          if (rule.operator === '<') return val < rule.value
          if (rule.operator === '!=') return val != rule.value
          if (rule.operator === 'in') return Array.isArray(rule.value) && rule.value.includes(val)

          return val == rule.value
        } catch (err) {
          return false
        }
      }

      const replaceVariables = (text, data) => {
        return text.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
          const keys = path.split('.')
          let val = data
          for (let k of keys) {
            if (val === undefined || val === null) break
            val = val[k]
          }

          if (val === undefined || val === null || val === '') {
            if (
              path.includes('leitura') ||
              path.includes('medicao') ||
              path.includes('hidrometro') ||
              path.includes('relogio')
            )
              return 'Leitura a realizar'
            if (path.includes('data') || path.includes('prazo') || path.includes('entrega'))
              return 'Data não informada'
            if (path.includes('valor_sinal_formatado')) return 'R$ 0,00'
            return 'Não informado'
          }
          return val
        })
      }

      let availableClauses = []

      // Automated filtering of the legal knowledge base
      const isSimpleDocument = ['declaracoes_complementares', 'autorizacao_intermediacao'].includes(
        tipoDocumento,
      )

      if (!isSimpleDocument) {
        clauses.forEach((m) => {
          const cat = m.getString('category')
          const trigger = m.getString('trigger_logic') || ''

          let include = true

          if (trigger) {
            include = triggerLogicEval(trigger, master_data)
          } else {
            if (cat === 'distrato' && master_data.metadata.tipo_contrato !== 'distrato')
              include = false
            if (cat === 'permuta' && master_data.metadata.tipo_negociacao !== 'permuta')
              include = false
            if (
              cat === 'checklist_documental' &&
              master_data.metadata.tipo_contrato !== 'checklist_documental'
            )
              include = false

            // Do not include certidões/due diligence for recibo_sinal
            if (master_data.metadata.tipo_contrato === 'recibo_sinal') {
              const titleLower = m.getString('title').toLowerCase()
              if (
                cat === 'checklist_documental' ||
                titleLower.includes('certid') ||
                titleLower.includes('due diligence') ||
                titleLower.includes('documenta')
              ) {
                include = false
              }
            }

            // PEP integration: Auto-include compliance/PEP clauses if pep is true
            if (cat === 'boas_praticas' || cat === 'protecao_comercial') {
              const titleLower = m.getString('title').toLowerCase()
              if (
                titleLower.includes('pep') ||
                titleLower.includes('politicamente exposta') ||
                titleLower.includes('compliance') ||
                titleLower.includes('lavagem de dinheiro')
              ) {
                include = master_data.compliance.pep
              }
            }
          }

          if (include) {
            const rawContent = m.getString('content')
            const interpolatedContent = replaceVariables(rawContent, master_data)

            availableClauses.push({
              id: m.id,
              code:
                m.getString('code') || m.getString('title').split(' - ')[0] || m.getString('title'),
              title: m.getString('title'),
              type: cat,
              trigger: trigger || 'Always include',
              content: interpolatedContent,
              version: m.getInt('version') || 1,
              priority: m.getInt('priority') || 999,
            })
          }
        })

        availableClauses.sort((a, b) => a.priority - b.priority)
      }

      const documentTypeMap = {
        ficha_cadastral: 'Ficha Cadastral',
        checklist_documental: 'Checklist Documental',
        recibo_sinal: 'Recibo de Sinal',
        promessa_compra_venda: 'Promessa de Compra e Venda',
        contrato_particular: 'Contrato Particular de Compra e Venda',
        termo_entrega_chaves: 'Termo de Entrega de Chaves',
        termo_posse: 'Termo de Posse',
        declaracoes_complementares: 'Declarações Complementares',
        autorizacao_intermediacao: 'Autorização de Intermediação Imobiliária',
        distrato: 'Distrato de Compra e Venda',
      }

      const documentTitle = documentTypeMap[tipoDocumento] || 'Documento Imobiliário'
      let systemPrompt = `Você é um Advogado Sênior Especialista em Direito Imobiliário brasileiro.`

      if (tipoDocumento === 'ficha_cadastral') {
        systemPrompt += `
Sua função é gerar uma FICHA CADASTRAL estruturada contendo os dados do comprador, vendedor e do imóvel.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>FICHA CADASTRAL</h2>

Use os dados do Master JSON para preencher a ficha, organizando de forma clara (dados pessoais, contatos, dados do imóvel). Não inclua cláusulas contratuais.
`
      } else if (tipoDocumento === 'checklist_documental') {
        systemPrompt += `
Sua função é gerar um CHECKLIST DOCUMENTAL relacionando todos os documentos necessários para a transação imobiliária com base no perfil das partes e do imóvel.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>CHECKLIST DOCUMENTAL</h2>

Regras Específicas:
1. Utilize AS INFORMAÇÕES FORNECIDAS na "Available Clauses Library" (ex: Lei 7.433/85) para complementar a lista.
2. Liste os documentos exigidos do Vendedor (ex: certidões negativas, matrícula), Comprador e Imóvel com base na situação informada. 
3. Organize em tópicos numéricos para facilitar a conferência.
`
      } else if (tipoDocumento === 'termo_entrega_chaves' || tipoDocumento === 'termo_posse') {
        systemPrompt += `
Sua função é gerar um ${documentTitle.toUpperCase()} formalizando a entrega das chaves e a imissão na posse do imóvel.
Utilize as cláusulas fornecidas na "Available Clauses Library" (especialmente as de Gold Standard) para enriquecer o termo.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>${documentTitle.toUpperCase()}</h2>

Inclua a qualificação das partes, a descrição do imóvel, a data da posse e a declaração de que o comprador vistoriou o imóvel. Inclua espaço para assinaturas ao final.
`
      } else if (tipoDocumento === 'recibo_sinal') {
        const arrasText =
          body.tipo_arras === 'penitenciais'
            ? 'Arras Penitenciais (Art. 420, CC - com direito a arrependimento e multa equivalente).'
            : 'Arras Confirmatórias (Art. 417 a 419, CC - irretratável e irrevogável).'

        systemPrompt += `
Sua função é gerar um RECIBO DE SINAL formalizando o pagamento do princípio de pagamento (arras).
Utilize as cláusulas fornecidas na "Available Clauses Library" para aplicar o rigor legal correto sobre arras.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>RECIBO DE SINAL E PRINCÍPIO DE PAGAMENTO</h2>

Regras Específicas:
1. O valor do sinal ("valor_sinal_formatado") deve ser explicitado claramente no recibo.
2. O tipo de arras selecionado para este recibo é: ${arrasText}. Crie uma cláusula específica e detalhada aplicando esta regra legal do Código Civil.
3. NÃO inclua nenhuma cláusula ou menção sobre "apresentação de certidões", "checklist documental", "due diligence", ou obrigações de entrega de documentos futuros neste recibo. Restrinja-se a confirmar o recebimento do sinal e estabelecer as regras das arras escolhidas.
4. Inclua a qualificação das partes e a referência ao imóvel. Inclua espaço para assinatura de quem recebe.
`
      } else if (tipoDocumento === 'autorizacao_intermediacao') {
        systemPrompt += `
Sua função é gerar uma AUTORIZAÇÃO DE INTERMEDIAÇÃO IMOBILIÁRIA.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>AUTORIZAÇÃO DE INTERMEDIAÇÃO IMOBILIÁRIA</h2>

Regras Específicas:
1. Foque exclusivamente nos termos da corretagem, regras de comissionamento (valor/percentual e responsabilidade), exclusividade (se for o caso) e as obrigações da imobiliária e do Vendedor (proprietário).
2. Omita totalmente cláusulas relativas à transferência da propriedade (compra e venda), posse, multas de desocupação e financiamento.
3. Utilize numeração formal de cláusulas (CLÁUSULA PRIMEIRA - DO OBJETO, etc).
4. O Objeto é a autorização para a intermediação da venda do imóvel descrito.
`
      } else if (tipoDocumento === 'distrato') {
        systemPrompt += `
Sua função é gerar um DISTRATO DE COMPRA E VENDA.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>DISTRATO DE COMPRA E VENDA</h2>

Regras Específicas:
1. Utilize AS CLÁUSULAS FORNECIDAS na "Available Clauses Library" (especialmente as relativas à Lei do Distrato) para compor o documento.
2. Foque na rescisão do contrato original, devolução de valores (se houver, com base nos dados de multa/inadimplência informados), e na quitação mútua e irrevogável de obrigações.
3. Mencione as partes, o imóvel objeto do distrato e as condições do desfazimento do negócio.
4. NÃO é necessário montar a estrutura descritiva completa de um contrato de venda (como detalhamento exaustivo de financiamento futuro, posse futura etc).
5. Estruture as cláusulas sequencialmente utilizando numeração ordinal em caixa alta.
`
      } else if (tipoDocumento === 'declaracoes_complementares') {
        systemPrompt += `
Sua função é gerar DECLARAÇÕES COMPLEMENTARES para a transação imobiliária.
Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para organizar o documento. NÃO use Markdown.
Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>DECLARAÇÕES COMPLEMENTARES</h2>

Regras Específicas:
1. O documento deve seguir o formato formal de uma declaração/atestado.
2. Seja conciso e não utilize a numeração de cláusulas (como "CLÁUSULA PRIMEIRA"), utilize tópicos simples ou texto corrido.
3. A declaração deve atestar fatos específicos com base nos dados preenchidos (como situação do imóvel, ocupação, anuência etc).
`
      } else {
        systemPrompt += `
Sua função é montar contratos juridicamente consistentes utilizando EXCLUSIVAMENTE as cláusulas fornecidas na "Available Clauses Library".

Regras Obrigatórias (Hard Rules):
1. NEVER invent clauses. Only use the ones provided in the library. As variáveis interpoladas já foram preenchidas nos textos das cláusulas.
2. NEVER alter the legal meaning of the provided clauses. You may adjust grammar to connect them smoothly.
3. Replace any remaining placeholders like {{variable_name}} with the corresponding values from the Master JSON data. Inclua de forma explícita os dados da permuta ou dação caso aplicável no contrato.
4. Utilize a formatação em HTML (tags <b>, <strong>, <ul>, <li>, <p>, <table>, <h1>, <h2>) para estruturar o documento (negritos em termos importantes, listas, seções). NÃO use Markdown.
5. Cabeçalho Obrigatório: O documento DEVE iniciar com:
<h1>${imobiliaria_nome.toUpperCase()}</h1>
<h2>${documentTitle.toUpperCase()}</h2>

6. Numeração Formal de Cláusulas: Estruture as cláusulas sequencialmente utilizando numeração ordinal em caixa alta (ex: CLÁUSULA PRIMEIRA - [TÍTULO], CLÁUSULA SEGUNDA - [TÍTULO]). As seções "Objeto do Contrato" e "Descrição do Imóvel" devem seguir esta mesma sequência numérica formal.
7. Qualificação das Partes: Os rótulos VENDEDOR e COMPRADOR devem estar em caixa alta como texto puro, seguidos dos respectivos dados, sem símbolos de negrito.
8. The final generated contract MUST strictly follow the logical sequence:
   -> Cabeçalho
   -> Qualifications
   -> Object & Description
   -> Price/Payment
   -> Financing (se aplicável)
   -> Possession
   -> Taxes
   -> Obligations
   -> Special Clauses
   -> Commission
   -> Default
   -> Rescission
   -> LGPD
   -> Electronic Signature
   -> Forum
   -> Signatures

Process:
1. Analyze the matched "Available Clauses Library".
2. Assemble the contract following the exact Structure sequence above.
3. Do not output anything other than the final contract.
`
      }

      const userPrompt = `Master JSON Data (Variables & Triggers):
${JSON.stringify(master_data, null, 2)}

${!isSimpleDocument && availableClauses.length > 0 ? `Available Clauses Library:\n${JSON.stringify(availableClauses, null, 2)}` : ''}

Por favor, gere o documento solicitado.`

      let anthropicKey = $secrets.get('ANTHROPIC_API_KEY') || ''
      let openaiKey = $secrets.get('OPENAI_API_KEY') || ''
      let geminiKey = $secrets.get('GEMINI_API_KEY') || ''

      anthropicKey = anthropicKey.replace(/[^\x21-\x7E]/g, '')
      openaiKey = openaiKey.replace(/[^\x21-\x7E]/g, '')
      geminiKey = geminiKey.replace(/[^\x21-\x7E]/g, '')

      if (!anthropicKey && !openaiKey && !geminiKey) {
        $app.logger().error('Missing global AI API keys in Secrets.')
        return e.badRequestError(
          'Configuração do sistema incompleta: Nenhuma chave de API configurada para habilitar a geração por IA.',
        )
      }

      let generatedText = 'Minuta não gerada. Erro no provedor de IA.'
      let usedClauses = availableClauses.map((c) => ({
        code: c.code,
        title: c.title,
        version: c.version,
      }))

      let success = false
      let lastErrorMsg = ''

      if (anthropicKey && !success) {
        const aiBody = {
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }
        try {
          const chatRes = $http.send({
            url: 'https://api.anthropic.com/v1/messages',
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify(aiBody),
            timeout: 120,
          })
          if (chatRes.statusCode === 200) {
            generatedText = chatRes.json.content[0].text
            success = true
          } else {
            lastErrorMsg = chatRes.json?.error?.message || `Anthropic: ${chatRes.statusCode}`
          }
        } catch (err) {
          lastErrorMsg = err.message
        }
      }

      if (openaiKey && !success) {
        const aiBody = {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }
        try {
          const chatRes = $http.send({
            url: 'https://api.openai.com/v1/chat/completions',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + openaiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiBody),
            timeout: 120,
          })
          if (chatRes.statusCode === 200) {
            generatedText = chatRes.json.choices[0].message.content
            success = true
          } else {
            lastErrorMsg = chatRes.json?.error?.message || `OpenAI: ${chatRes.statusCode}`
          }
        } catch (err) {
          lastErrorMsg = err.message
        }
      }

      if (!success) {
        $app.logger().error('AI Generation failed', 'error', lastErrorMsg)
        generatedText = 'Minuta não gerada. Erro no provedor de IA.'
      } else {
        generatedText = generatedText
          .replace(/```markdown/gi, '')
          .replace(/```html/gi, '')
          .replace(/```/g, '')

        // Simple markdown to HTML fallback (just in case AI outputs markdown anyway)
        let html = generatedText
        html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

        // Split by double newline to wrap in <p> if not already an HTML tag
        html = html
          .split('\n\n')
          .map((p) => {
            if (!p.trim()) return ''
            if (p.trim().startsWith('<')) return p
            return `<p>${p.replace(/\n/g, '<br>')}</p>`
          })
          .join('\n')

        generatedText = html
      }

      return e.json(200, { minuta_texto: generatedText, used_clauses: usedClauses })
    } catch (err) {
      if (err.name === 'Error' && err.message.includes('ApiError')) throw err
      try {
        const errorLog = new Record($app.findCollectionByNameOrId('system_error_logs'))
        errorLog.set('error_message', err.message || 'Unknown error')
        errorLog.set('stack_trace', err.stack || '')
        errorLog.set('component', 'assemble_contract')
        errorLog.set('route', '/backend/v1/assemble-contract')
        errorLog.set('severity', 'critical')
        errorLog.set('context_data', e.requestInfo().body || {})
        if (e.auth && e.auth.id) {
          errorLog.set('user', e.auth.id)
        }
        $app.save(errorLog)
      } catch (logErr) {
        $app.logger().error('Failed to log system error', 'error', logErr.message)
      }
      return e.internalServerError('Erro interno: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
