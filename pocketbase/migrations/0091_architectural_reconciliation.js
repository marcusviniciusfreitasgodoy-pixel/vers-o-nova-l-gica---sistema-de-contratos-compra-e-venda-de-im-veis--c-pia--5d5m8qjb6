migrate(
  (app) => {
    const gpNegociacoes = app.findCollectionByNameOrId('gp_negociacoes')
    gpNegociacoes.fields.add(
      new RelationField({
        name: 'case_id',
        collectionId: app.findCollectionByNameOrId('cases').id,
        maxSelect: 1,
      }),
    )
    app.save(gpNegociacoes)

    const partes = app.findCollectionByNameOrId('partes')
    partes.fields.add(
      new RelationField({
        name: 'gp_pessoa_id',
        collectionId: app.findCollectionByNameOrId('gp_pessoas').id,
        maxSelect: 1,
      }),
    )
    app.save(partes)

    const imovel = app.findCollectionByNameOrId('imovel')
    imovel.fields.add(
      new RelationField({
        name: 'gp_imovel_id',
        collectionId: app.findCollectionByNameOrId('gp_imoveis').id,
        maxSelect: 1,
      }),
    )
    app.save(imovel)
  },
  (app) => {
    const gpNegociacoes = app.findCollectionByNameOrId('gp_negociacoes')
    gpNegociacoes.fields.removeByName('case_id')
    app.save(gpNegociacoes)

    const partes = app.findCollectionByNameOrId('partes')
    partes.fields.removeByName('gp_pessoa_id')
    app.save(partes)

    const imovel = app.findCollectionByNameOrId('imovel')
    imovel.fields.removeByName('gp_imovel_id')
    app.save(imovel)
  },
)
