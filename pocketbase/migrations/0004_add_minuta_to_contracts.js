migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    col.fields.add(new EditorField({ name: 'minuta_texto' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    col.fields.removeByName('minuta_texto')
    app.save(col)
  },
)
