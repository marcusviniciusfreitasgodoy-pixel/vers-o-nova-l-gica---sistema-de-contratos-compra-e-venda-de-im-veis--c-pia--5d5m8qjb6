migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    if (!col.fields.getByName('code')) {
      col.fields.add(new TextField({ name: 'code' }))
    }

    if (!col.fields.getByName('trigger_logic')) {
      col.fields.add(new TextField({ name: 'trigger_logic' }))
    }

    if (!col.fields.getByName('priority')) {
      col.fields.add(new NumberField({ name: 'priority' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    col.fields.removeByName('code')
    col.fields.removeByName('trigger_logic')
    col.fields.removeByName('priority')
    app.save(col)
  },
)
