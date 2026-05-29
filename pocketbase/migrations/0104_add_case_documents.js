migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.add(new FileField({ name: 'documento_base', maxSelect: 1, maxSize: 52428800 }))
    col.fields.add(new FileField({ name: 'contrato_assinado', maxSelect: 1, maxSize: 52428800 }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.removeByName('documento_base')
    col.fields.removeByName('contrato_assinado')
    app.save(col)
  },
)
