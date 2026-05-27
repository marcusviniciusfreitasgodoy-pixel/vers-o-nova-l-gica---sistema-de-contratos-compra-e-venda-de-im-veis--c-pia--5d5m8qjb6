migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('gp_doc_checklist')
    if (!col.fields.getByName('arquivos')) {
      col.fields.add(new FileField({ name: 'arquivos', maxSelect: 10, maxSize: 52428800 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('gp_doc_checklist')
    if (col.fields.getByName('arquivos')) {
      col.fields.removeByName('arquivos')
      app.save(col)
    }
  },
)
