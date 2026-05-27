migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_documento')

    if (field && field.type === 'select') {
      const newValues = []
      for (const v of field.values) {
        if (v !== 'declaracoes_complementares') {
          newValues.push(v)
        }
      }
      field.values = newValues
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_documento')

    if (field && field.type === 'select') {
      let exists = false
      for (const v of field.values) {
        if (v === 'declaracoes_complementares') exists = true
      }

      if (!exists) {
        const newValues = []
        for (const v of field.values) {
          newValues.push(v)
        }
        newValues.push('declaracoes_complementares')
        field.values = newValues
        app.save(col)
      }
    }
  },
)
