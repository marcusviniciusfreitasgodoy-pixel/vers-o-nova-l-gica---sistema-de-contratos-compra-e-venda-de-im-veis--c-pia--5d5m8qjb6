migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const contentField = col.fields.getByName('content')
    if (contentField) {
      contentField.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const contentField = col.fields.getByName('content')
    if (contentField) {
      contentField.required = true
      app.save(col)
    }
  },
)
