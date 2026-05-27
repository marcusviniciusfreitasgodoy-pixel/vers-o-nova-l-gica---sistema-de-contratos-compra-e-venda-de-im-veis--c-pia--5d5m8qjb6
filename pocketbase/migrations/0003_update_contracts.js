migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.removeByName('seller_data')
    col.fields.removeByName('buyer_data')
    col.fields.removeByName('property_data')
    col.fields.removeByName('financial_data')
    col.fields.removeByName('financing_details')
    col.fields.removeByName('type')

    col.fields.add(new TextField({ name: 'tipo' }))
    col.fields.add(new TextField({ name: 'status' }))

    const vFields = [
      'nome',
      'cpf',
      'rg',
      'orgao_emissor',
      'nacionalidade',
      'estado_civil',
      'profissao',
      'endereco',
      'email',
      'telefone',
    ]
    vFields.forEach((f) => {
      col.fields.add(new TextField({ name: f + '_vendedor' }))
      col.fields.add(new TextField({ name: f + '_comprador' }))
    })

    col.fields.add(new TextField({ name: 'endereco_imovel' }))
    col.fields.add(new TextField({ name: 'matricula_imovel' }))
    col.fields.add(new TextField({ name: 'rgi_imovel' }))
    col.fields.add(new TextField({ name: 'inscricao_municipal' }))
    col.fields.add(new NumberField({ name: 'area_total' }))
    col.fields.add(new NumberField({ name: 'vagas_garagem' }))

    col.fields.add(new NumberField({ name: 'valor_total' }))
    col.fields.add(new NumberField({ name: 'valor_sinal' }))
    col.fields.add(new NumberField({ name: 'valor_reforco' }))
    col.fields.add(new NumberField({ name: 'valor_complemento' }))
    col.fields.add(new NumberField({ name: 'valor_saldo' }))
    col.fields.add(new NumberField({ name: 'valor_financiado' }))
    col.fields.add(new NumberField({ name: 'comissao' }))

    col.fields.add(new TextField({ name: 'instituicao_financeira' }))
    col.fields.add(new NumberField({ name: 'taxa_juros' }))
    col.fields.add(new NumberField({ name: 'prazo_meses' }))
    col.fields.add(new DateField({ name: 'data_liberacao_credito' }))
    col.fields.add(new DateField({ name: 'data_pagamento_saldo' }))

    col.listRule = "@request.auth.id != '' && user = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != '' && user = @request.auth.id"
    col.deleteRule = "@request.auth.id != '' && user = @request.auth.id"

    app.save(col)
  },
  (app) => {
    // Empty down migration
  },
)
