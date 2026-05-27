migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.add(
      new FileField({
        name: 'matricula_file',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    col.fields.add(
      new FileField({
        name: 'iptu_file',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      }),
    )

    col.fields.add(new TextField({ name: 'numero_processo_inventario' }))
    col.fields.add(new TextField({ name: 'inventariante' }))
    col.fields.add(new TextField({ name: 'alvara_inventario' }))
    col.fields.add(new TextField({ name: 'detalhes_locacao' }))
    col.fields.add(new TextField({ name: 'prazo_locacao' }))

    col.fields.add(new BoolField({ name: 'preferencia_locatario' }))
    col.fields.add(new BoolField({ name: 'havera_parcelas' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.removeByName('matricula_file')
    col.fields.removeByName('iptu_file')
    col.fields.removeByName('numero_processo_inventario')
    col.fields.removeByName('inventariante')
    col.fields.removeByName('alvara_inventario')
    col.fields.removeByName('detalhes_locacao')
    col.fields.removeByName('prazo_locacao')
    col.fields.removeByName('preferencia_locatario')
    col.fields.removeByName('havera_parcelas')

    app.save(col)
  },
)
