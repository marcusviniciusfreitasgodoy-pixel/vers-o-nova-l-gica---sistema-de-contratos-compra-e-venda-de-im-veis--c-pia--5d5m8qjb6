migrate(
  (app) => {
    const gpPessoas = app.findCollectionByNameOrId('gp_pessoas')
    if (!gpPessoas.fields.getByName('case_id')) {
      gpPessoas.fields.add(
        new RelationField({
          name: 'case_id',
          collectionId: app.findCollectionByNameOrId('cases').id,
          maxSelect: 1,
        }),
      )
    }
    if (!gpPessoas.fields.getByName('papel_na_operacao')) {
      gpPessoas.fields.add(
        new SelectField({
          name: 'papel_na_operacao',
          values: ['comprador', 'vendedor', 'representante', 'testemunha', 'outro'],
        }),
      )
    }
    if (!gpPessoas.fields.getByName('possui_representacao')) {
      gpPessoas.fields.add(new BoolField({ name: 'possui_representacao' }))
    }
    if (!gpPessoas.fields.getByName('observacoes')) {
      gpPessoas.fields.add(new TextField({ name: 'observacoes' }))
    }
    app.save(gpPessoas)

    const gpImoveis = app.findCollectionByNameOrId('gp_imoveis')
    if (!gpImoveis.fields.getByName('case_id')) {
      gpImoveis.fields.add(
        new RelationField({
          name: 'case_id',
          collectionId: app.findCollectionByNameOrId('cases').id,
          maxSelect: 1,
        }),
      )
    }
    if (!gpImoveis.fields.getByName('finalidade')) {
      gpImoveis.fields.add(
        new SelectField({
          name: 'finalidade',
          values: ['residencial', 'comercial', 'mista', 'outro'],
        }),
      )
    }
    if (!gpImoveis.fields.getByName('endereco_resumido')) {
      gpImoveis.fields.add(new TextField({ name: 'endereco_resumido' }))
    }
    if (!gpImoveis.fields.getByName('cidade')) {
      gpImoveis.fields.add(new TextField({ name: 'cidade' }))
    }
    if (!gpImoveis.fields.getByName('estado')) {
      gpImoveis.fields.add(new TextField({ name: 'estado' }))
    }
    if (!gpImoveis.fields.getByName('observacoes')) {
      gpImoveis.fields.add(new TextField({ name: 'observacoes' }))
    }
    app.save(gpImoveis)

    const partes = app.findCollectionByNameOrId('partes')
    partes.createRule = null
    partes.updateRule = null
    partes.deleteRule = null
    app.save(partes)

    const imovel = app.findCollectionByNameOrId('imovel')
    imovel.createRule = null
    imovel.updateRule = null
    imovel.deleteRule = null
    app.save(imovel)
  },
  (app) => {
    // Revert if needed
  },
)
