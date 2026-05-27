migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    if (!col.fields.getByName('vendedor_uniao_estavel')) {
      col.fields.add(new BoolField({ name: 'vendedor_uniao_estavel' }))
    }

    if (!col.fields.getByName('comprador_uniao_estavel')) {
      col.fields.add(new BoolField({ name: 'comprador_uniao_estavel' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    if (col.fields.getByName('vendedor_uniao_estavel')) {
      col.fields.removeByName('vendedor_uniao_estavel')
    }

    if (col.fields.getByName('comprador_uniao_estavel')) {
      col.fields.removeByName('comprador_uniao_estavel')
    }

    app.save(col)
  },
)
