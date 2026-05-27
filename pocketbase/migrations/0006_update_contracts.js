migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    col.fields.add(new TextField({ name: 'vendedor_banco' }))
    col.fields.add(new TextField({ name: 'vendedor_agencia' }))
    col.fields.add(new TextField({ name: 'vendedor_conta' }))
    col.fields.add(new TextField({ name: 'vendedor_pix' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    col.fields.removeByName('vendedor_banco')
    col.fields.removeByName('vendedor_agencia')
    col.fields.removeByName('vendedor_conta')
    col.fields.removeByName('vendedor_pix')
    app.save(col)
  },
)
