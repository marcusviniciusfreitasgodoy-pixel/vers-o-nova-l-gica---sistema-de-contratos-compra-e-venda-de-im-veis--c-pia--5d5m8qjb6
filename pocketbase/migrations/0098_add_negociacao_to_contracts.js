migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    if (!col.fields.getByName('negociacao_id')) {
      col.fields.add(
        new RelationField({
          name: 'negociacao_id',
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('arquivo_gerado')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_gerado',
          maxSelect: 1,
          maxSize: 52428800,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    try {
      col.fields.removeByName('negociacao_id')
    } catch (_) {}
    try {
      col.fields.removeByName('arquivo_gerado')
    } catch (_) {}

    app.save(col)
  },
)
