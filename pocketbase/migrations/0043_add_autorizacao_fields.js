migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    if (!col.fields.getByName('valor_condominio')) {
      col.fields.add(new NumberField({ name: 'valor_condominio' }))
    }
    if (!col.fields.getByName('valor_iptu_anual')) {
      col.fields.add(new NumberField({ name: 'valor_iptu_anual' }))
    }
    if (!col.fields.getByName('valor_avaliacao')) {
      col.fields.add(new NumberField({ name: 'valor_avaliacao' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.removeByName('valor_condominio')
    col.fields.removeByName('valor_iptu_anual')
    col.fields.removeByName('valor_avaliacao')

    app.save(col)
  },
)
