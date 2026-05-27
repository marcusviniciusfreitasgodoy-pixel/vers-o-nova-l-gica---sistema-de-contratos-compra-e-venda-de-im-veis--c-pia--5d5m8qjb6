migrate(
  (app) => {
    const contractsCol = app.findCollectionByNameOrId('contracts')

    contractsCol.fields.add(
      new SelectField({ name: 'tipo_vendedor', maxSelect: 1, values: ['pf', 'pj'] }),
    )
    contractsCol.fields.add(
      new SelectField({ name: 'tipo_comprador', maxSelect: 1, values: ['pf', 'pj'] }),
    )
    contractsCol.fields.add(new TextField({ name: 'cnpj_vendedor' }))
    contractsCol.fields.add(new TextField({ name: 'cnpj_comprador' }))
    contractsCol.fields.add(new TextField({ name: 'representante_vendedor' }))
    contractsCol.fields.add(new TextField({ name: 'representante_comprador' }))
    contractsCol.fields.add(new BoolField({ name: 'clausula_arrependimento' }))
    contractsCol.fields.add(new BoolField({ name: 'possui_financiamento' }))
    contractsCol.fields.add(new BoolField({ name: 'uso_fgts' }))
    contractsCol.fields.add(new BoolField({ name: 'imovel_ocupado' }))
    contractsCol.fields.add(new NumberField({ name: 'possui_torna' }))
    contractsCol.fields.add(new BoolField({ name: 'vendedor_casado' }))
    contractsCol.fields.add(new JSONField({ name: 'checklist_compliance' }))

    app.save(contractsCol)

    const legalCol = app.findCollectionByNameOrId('legal_knowledge')
    const catField = legalCol.fields.getByName('category')
    if (catField) {
      catField.values = [
        'legislacao',
        'jurisprudencia',
        'boas_praticas',
        'clausula_fixa',
        'clausula_condicional',
        'protecao_comercial',
      ]
      app.save(legalCol)
    }

    const seedClauses = [
      {
        title: 'Cláusula de Arras',
        content:
          'As partes ajustam que o valor pago a título de sinal constitui Arras, nos termos dos artigos 417 a 420 do Código Civil. Em caso de desistência do COMPRADOR, este perderá o valor dado como sinal. Caso a desistência ocorra por parte do VENDEDOR, deverá restituí-lo em dobro.',
        category: 'clausula_fixa',
      },
      {
        title: 'Cláusula de Financiamento - Prazo Bancário',
        content:
          'O COMPRADOR terá o prazo de 60 (sessenta) dias contados da assinatura deste instrumento para a obtenção do crédito imobiliário, responsabilizando-se por todas as providências junto à instituição financeira escolhida.',
        category: 'clausula_condicional',
      },
      {
        title: 'Cláusula de Financiamento - Negativa de Crédito',
        content:
          'Em caso de negativa de crédito por culpa de restrições no CPF ou incapacidade financeira do COMPRADOR, o contrato poderá ser rescindido de pleno direito pelo VENDEDOR, com retenção das Arras pagas a título de indenização.',
        category: 'clausula_condicional',
      },
      {
        title: 'Proteção LGPD',
        content:
          'As partes autorizam o tratamento de dados pessoais fornecidos neste instrumento exclusivamente para fins de execução deste contrato, registros públicos e cumprimento de obrigações legais, em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
        category: 'protecao_comercial',
      },
      {
        title: 'Assinatura Eletrônica',
        content:
          'As partes reconhecem como válida, plenamente eficaz e com força de título executivo extrajudicial a assinatura eletrônica do presente instrumento, independentemente de certificação digital no padrão ICP-Brasil.',
        category: 'protecao_comercial',
      },
      {
        title: 'Declaração de Certidões',
        content:
          'O VENDEDOR declara, sob as penas da lei civil e criminal, que apresentou todas as certidões negativas de feitos ajuizados, débitos fiscais e trabalhistas, bem como certidão de ônus reais atualizada do imóvel, as quais foram devidamente analisadas e aceitas pelo COMPRADOR.',
        category: 'protecao_comercial',
      },
    ]

    for (const clause of seedClauses) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', clause.title)
      } catch (_) {
        const record = new Record(legalCol)
        record.set('title', clause.title)
        record.set('content', clause.content)
        record.set('category', clause.category)
        app.save(record)
      }
    }
  },
  (app) => {
    const contractsCol = app.findCollectionByNameOrId('contracts')

    const fieldsToRemove = [
      'tipo_vendedor',
      'tipo_comprador',
      'cnpj_vendedor',
      'cnpj_comprador',
      'representante_vendedor',
      'representante_comprador',
      'clausula_arrependimento',
      'possui_financiamento',
      'uso_fgts',
      'imovel_ocupado',
      'possui_torna',
      'vendedor_casado',
      'checklist_compliance',
    ]

    for (const f of fieldsToRemove) {
      try {
        contractsCol.fields.removeByName(f)
      } catch (_) {}
    }

    app.save(contractsCol)
  },
)
