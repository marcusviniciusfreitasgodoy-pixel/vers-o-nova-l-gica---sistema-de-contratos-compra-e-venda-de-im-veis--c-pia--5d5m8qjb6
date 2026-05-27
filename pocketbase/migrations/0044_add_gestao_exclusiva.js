migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    if (!col.fields.getByName('gestao_exclusiva')) {
      col.fields.add(
        new SelectField({
          name: 'gestao_exclusiva',
          values: ['com_exclusiva', 'sem_exclusiva'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    col.fields.removeByName('gestao_exclusiva')
    app.save(col)
  },
)
