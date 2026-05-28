migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.add(new TextField({ name: 'parecer' }))
    col.fields.add(new TextField({ name: 'motivo_cancelamento' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.removeByName('parecer')
    col.fields.removeByName('motivo_cancelamento')
    app.save(col)
  },
)
