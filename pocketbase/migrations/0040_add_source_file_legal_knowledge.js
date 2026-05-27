migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    if (!col.fields.getByName('source_file')) {
      col.fields.add(
        new FileField({
          name: 'source_file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    if (col.fields.getByName('source_file')) {
      col.fields.removeByName('source_file')
      app.save(col)
    }
  },
)
