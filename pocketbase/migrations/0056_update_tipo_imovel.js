migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_imovel')
    if (field) {
      field.values = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Cobertura', 'Sala Comercial']
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_imovel')
    if (field) {
      field.values = ['Apartamento', 'Casa', 'Terreno', 'Comercial']
    }
    app.save(col)
  },
)
