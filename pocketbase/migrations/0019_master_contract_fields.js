migrate(
  (app) => {
    const contracts = app.findCollectionByNameOrId('contracts')

    contracts.fields.add(
      new SelectField({ name: 'tipo_vendedor', maxSelect: 1, values: ['pf', 'pj'] }),
    )
    contracts.fields.add(
      new SelectField({ name: 'tipo_comprador', maxSelect: 1, values: ['pf', 'pj'] }),
    )
    contracts.fields.add(new BoolField({ name: 'clausula_arrependimento' }))
    contracts.fields.add(new BoolField({ name: 'possui_financiamento' }))
    contracts.fields.add(new BoolField({ name: 'uso_fgts' }))
    contracts.fields.add(new BoolField({ name: 'imovel_ocupado' }))
    contracts.fields.add(new NumberField({ name: 'possui_torna' }))
    contracts.fields.add(new BoolField({ name: 'vendedor_casado' }))
    contracts.fields.add(new TextField({ name: 'cnpj_vendedor' }))
    contracts.fields.add(new TextField({ name: 'representante_vendedor' }))
    contracts.fields.add(new TextField({ name: 'cnpj_comprador' }))
    contracts.fields.add(new TextField({ name: 'representante_comprador' }))
    contracts.fields.add(new JSONField({ name: 'compliance_checklist' }))

    app.save(contracts)

    const legalKnowledge = app.findCollectionByNameOrId('legal_knowledge')
    const categoryField = legalKnowledge.fields.getByName('category')
    if (categoryField) {
      categoryField.values = [
        'legislacao',
        'jurisprudencia',
        'boas_praticas',
        'clausula_fixa',
        'clausula_condicional',
        'protecao_comercial',
      ]
    }
    app.save(legalKnowledge)

    const seed = [
      {
        title: 'Cláusula de Arras',
        category: 'clausula_fixa',
        content:
          'O valor pago a título de sinal constitui arras (Art. 417 ao 420 do Código Civil), de modo que, em caso de desistência do COMPRADOR, este perderá o valor em favor do VENDEDOR. Caso a desistência seja do VENDEDOR, este deverá restituir o valor em dobro.',
      },
      {
        title: 'Prazo Bancário',
        category: 'clausula_condicional',
        content:
          'O prazo para aprovação e liberação do financiamento bancário será de 60 (sessenta) dias, podendo ser prorrogado mediante acordo.',
      },
      {
        title: 'Negativa de Crédito',
        category: 'clausula_condicional',
        content:
          'Em caso de negativa definitiva de crédito por culpa de restrições em nome do COMPRADOR, o contrato poderá ser rescindido com retenção do sinal.',
      },
      {
        title: 'Proteção LGPD',
        category: 'clausula_fixa',
        content:
          'As partes autorizam o tratamento de dados pessoais exclusivamente para execução deste contrato.',
      },
      {
        title: 'Assinatura Eletrônica',
        category: 'clausula_fixa',
        content: 'As partes reconhecem como válida a assinatura eletrônica deste instrumento.',
      },
      {
        title: 'Condição de Imóvel Ocupado',
        category: 'clausula_condicional',
        content:
          'O COMPRADOR tem ciência de que o imóvel encontra-se ocupado, ficando estabelecido o prazo de 30 dias após a escritura para desocupação voluntária.',
      },
    ]

    seed.forEach((item) => {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', item.title)
      } catch (_) {
        const record = new Record(legalKnowledge)
        record.set('title', item.title)
        record.set('category', item.category)
        record.set('content', item.content)
        app.save(record)
      }
    })
  },
  (app) => {
    const contracts = app.findCollectionByNameOrId('contracts')
    const fieldsToRemove = [
      'tipo_vendedor',
      'tipo_comprador',
      'clausula_arrependimento',
      'possui_financiamento',
      'uso_fgts',
      'imovel_ocupado',
      'possui_torna',
      'vendedor_casado',
      'cnpj_vendedor',
      'representante_vendedor',
      'cnpj_comprador',
      'representante_comprador',
      'compliance_checklist',
    ]

    fieldsToRemove.forEach((f) => {
      try {
        contracts.fields.removeByName(f)
      } catch (_) {}
    })

    app.save(contracts)
  },
)
