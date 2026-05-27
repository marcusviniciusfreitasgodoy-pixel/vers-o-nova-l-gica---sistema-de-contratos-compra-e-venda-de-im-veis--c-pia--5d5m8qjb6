migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const data = [
      {
        title: 'Código Civil (Lei 10.406/2002) - Contratos em Geral',
        content:
          'Art. 421 a 480. A liberdade contratual será exercida nos limites da função social do contrato. Os princípios de probidade e boa-fé devem ser guardados. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Código Civil (Lei 10.406/2002) - Compra e Venda',
        content:
          'Art. 481 a 504. Pelo contrato de compra e venda, um dos contratantes se obriga a transferir o domínio de certa coisa, e o outro, a pagar-lhe certo preço em dinheiro. O vendedor, salvo convenção em contrário, responde por todos os débitos que gravem a coisa até o momento da tradição. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Lei do Inquilinato (Lei 8.245/1991)',
        content:
          'Capítulos I a IV. A locação de imóveis urbanos regula-se pelo disposto nesta lei. Inclui garantias locatícias, deveres do locador e locatário, e regras sobre despejo. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Lei de Incorporação Imobiliária (Lei 4.591/1964)',
        content:
          'Capítulos I a IV. Dispõe sobre o condomínio em edificações e as incorporações imobiliárias. Regula os deveres do incorporador e proteção dos adquirentes na planta. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Lei de Alienação Fiduciária (Lei 9.514/1997)',
        content:
          'Capítulos I a IV. Dispõe sobre o Sistema de Financiamento Imobiliário, institui a alienação fiduciária de coisa imóvel e prevê a consolidação da propriedade em caso de inadimplência. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Lei de Registros Públicos (Lei 6.015/1973)',
        content:
          'Livros I a IV. Regula o registro de imóveis, essencial para a transferência da propriedade e publicidade dos atos para oponibilidade a terceiros. (Legislação Primária)',
        category: 'legislacao',
      },
      {
        title: 'Súmulas STJ - 3, 5, 6, 7, 83 a 100',
        content:
          'Súmula 5: A simples interpretação de cláusula contratual não enseja recurso especial. Súmula 7: A pretensão de simples reexame de prova não enseja recurso especial. Súmula 84: A ação de embargos de terceiro admite a defesa da posse advinda de compromisso de compra e venda.',
        category: 'jurisprudencia',
      },
      {
        title: 'Súmulas STJ - 326 a 351',
        content:
          'Súmula 326: Na ação de indenização por dano moral, a condenação em montante inferior ao postulado na inicial não implica sucumbência recíproca. Súmula 332: A fiança prestada sem autorização de um dos cônjuges implica a ineficácia total da garantia.',
        category: 'jurisprudencia',
      },
      {
        title: 'Jurisprudência TJRJ - Rescisão, IPTU e Posse',
        content:
          'TJRJ: Em caso de rescisão de promessa de compra e venda, a retenção pelo vendedor deve ser razoável. A responsabilidade pelo pagamento do IPTU é do promitente comprador apenas a partir da efetiva imissão na posse (entrega das chaves).',
        category: 'jurisprudencia',
      },
      {
        title: 'Estrutura Padrão - Compra e Venda À Vista',
        content:
          'Contrato À vista. Cláusulas essenciais: Qualificação das Partes, Objeto (Descrição detalhada), Preço e Pagamento (Sinal e Saldo), Documentação exigida (Certidões), Obrigações, Imissão na Posse imediata ou em data certa, Multas/Penalidades, Foro.',
        category: 'boas_praticas',
      },
      {
        title: 'Estrutura Padrão - Compra e Venda Financiada',
        content:
          'Contrato Financiado. Cláusulas essenciais: Qualificação das Partes, Objeto, Preço (Sinal, Reforço, Complemento com Financiamento Bancário), Cláusula de Alienação Fiduciária, Condições Suspensivas de aprovação de crédito, Prazos específicos.',
        category: 'boas_praticas',
      },
      {
        title: 'Cláusulas de Proteção - Comprador',
        content:
          'Direito a Vistoria prévia do imóvel atestando estado de conservação. Exigência de Documentação Limpa: apresentação de certidões negativas (fiscais, trabalhistas, cíveis) do vendedor e do imóvel antes de repasses de valores altos.',
        category: 'boas_praticas',
      },
      {
        title: 'Cláusulas de Proteção - Vendedor',
        content:
          'Previsão expressa de Arras Confirmatórias ou Penitenciais (perda do sinal em caso de desistência injustificada do comprador). Direito de Retenção do imóvel e das chaves até a liquidação integral do saldo ou assinatura com o banco.',
        category: 'boas_praticas',
      },
    ]

    for (const item of data) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', item.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', item.title)
        record.set('content', item.content)
        record.set('category', item.category)
        app.save(record)
      }
    }
  },
  (app) => {
    // Data only migration, skipping down phase
  },
)
