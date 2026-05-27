migrate((app) => {
  const col = app.findCollectionByNameOrId('legal_knowledge')

  const templates = [
    {
      title: 'Gold Standard - Checklist Documental',
      category: 'checklist_documental',
      code: 'CHK_GOLD_01',
      trigger_logic: JSON.stringify({
        path: 'metadata.tipo_contrato',
        operator: '==',
        value: 'checklist_documental',
      }),
      content: `### 1. Documentação das Partes\n#### 1.1 Pessoa Física\n- RG/CPF ou CNH\n- Comprovante de Residência\n#### 1.2 Pessoa Jurídica (PJ)\n- Contrato Social consolidado\n- CNPJ\n- Certidão Simplificada da Junta Comercial\n\n### 2. Documentação do Imóvel\n- Matrícula Atualizada (com ônus e ações)\n- Certidão de Quitação Fiscal (IPTU)\n\n### 3. Vendedor / Proprietário\n- Certidões Negativas Cíveis, Criminais e Trabalhistas\n\n### 4. Due Diligence\n- Análise de riscos apontados nas certidões e na matrícula\n- Verificação de processos em trâmite que possam afetar o patrimônio\n\n### 5. Compliance\n- Verificação de PEP (Pessoa Politicamente Exposta)\n- Adequação à LGPD no tratamento dos dados coletados`,
      version: 1,
      priority: 1,
    },
    {
      title: 'Gold Standard - Recibo de Sinal e Arras',
      category: 'boas_praticas',
      code: 'ARRAS_GOLD_01',
      trigger_logic: JSON.stringify({
        path: 'metadata.tipo_contrato',
        operator: '==',
        value: 'recibo_sinal',
      }),
      content: `Com base nos Artigos 417 a 420 do Código Civil Brasileiro, este recibo formaliza o pagamento do sinal.\n\n**Natureza das Arras:**\n- Arras Confirmatórias (Art. 417 a 419, CC) - tornam o negócio irretratável, não admitindo arrependimento.\n- Arras Penitenciais (Art. 420, CC) - garantem o direito de arrependimento, com a perda do sinal por quem o deu, ou a devolução em dobro por quem o recebeu.\n\nA responsabilidade por eventuais desistências seguirá rigorosamente as estipulações legais referentes à natureza das arras escolhida pelas partes.`,
      version: 1,
      priority: 1,
    },
    {
      title: 'Gold Standard - Termo de Entrega das Chaves',
      category: 'boas_praticas',
      code: 'CHAVES_GOLD_01',
      trigger_logic: JSON.stringify({
        path: 'metadata.tipo_contrato',
        operator: '==',
        value: 'termo_entrega_chaves',
      }),
      content: `Formaliza-se a entrega física das chaves do imóvel objeto da transação.\n\n**Leitura dos Medidores:**\n- Água: {{imovel.caracteristicas.leitura_agua}}\n- Luz: {{imovel.caracteristicas.leitura_luz}}\n- Gás: {{imovel.caracteristicas.leitura_gas}}\n\n**Aviso Legal:** A entrega física das chaves e a imissão na posse não substituem a necessidade de registro do título translativo no Registro de Imóveis competente para a efetiva transferência da propriedade, conforme prevê o Art. 1.245 do Código Civil.`,
      version: 1,
      priority: 1,
    },
    {
      title: 'Gold Standard - Termo de Transmissão da Posse',
      category: 'boas_praticas',
      code: 'POSSE_GOLD_01',
      trigger_logic: JSON.stringify({
        path: 'metadata.tipo_contrato',
        operator: '==',
        value: 'termo_posse',
      }),
      content: `O COMPRADOR é imitido na posse do imóvel a partir de {{posse.data_posse}}, passando a exercer a posse com *animus domini*.\n\n**Propriedade (Art. 1.245, CC):** Reconhece-se que a transferência efetiva da propriedade dar-se-á apenas com o registro da Escritura Pública no respectivo cartório competente.\n\n**Divisão Pro Rata (Art. 130, CTN):** As partes acordam que os impostos (IPTU), taxas e despesas condominiais serão divididos *pro rata* até a presente data, cabendo ao VENDEDOR a responsabilidade pelos débitos anteriores à imissão na posse, e ao COMPRADOR os débitos posteriores.\n\n**Estado de Conservação:**\nO imóvel é entregue nas seguintes condições vistoriadas: {{imovel.caracteristicas.estado_conservacao}}`,
      version: 1,
      priority: 1,
    },
  ]

  templates.forEach((t) => {
    try {
      app.findFirstRecordByData('legal_knowledge', 'code', t.code)
    } catch (_) {
      const id = $security.randomString(15)
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z'

      // Use raw SQL to prevent triggering afterCreate hooks which may fail in migrations
      // because they might expect an HTTP request context (e.g. e.requestInfo())
      app
        .db()
        .newQuery(`
        INSERT INTO legal_knowledge (
          id, title, category, code, trigger_logic, content, version, priority, created, updated
        ) VALUES (
          {:id}, {:title}, {:category}, {:code}, {:trigger_logic}, {:content}, {:version}, {:priority}, {:created}, {:updated}
        )
      `)
        .bind({
          id: id,
          title: t.title,
          category: t.category,
          code: t.code,
          trigger_logic: t.trigger_logic || '',
          content: t.content || '',
          version: t.version || 1,
          priority: t.priority || 1,
          created: now,
          updated: now,
        })
        .execute()
    }
  })
})
