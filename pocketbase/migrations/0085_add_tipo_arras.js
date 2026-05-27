migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    if (!col.fields.getByName('tipo_arras')) {
      col.fields.add(
        new SelectField({
          name: 'tipo_arras',
          values: ['confirmatórias', 'penitenciais'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    if (col.fields.getByName('tipo_arras')) {
      col.fields.removeByName('tipo_arras')
    }
    app.save(col)
  },
)
