migrate(
  (app) => {
    const collection = new Collection({
      name: 'companies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'document', type: 'text' },
        {
          name: 'segment',
          type: 'select',
          maxSelect: 1,
          values: [
            'corretor_autonomo',
            'imobiliaria_pequena_media',
            'imobiliaria_estruturada_premium',
            'construtora_incorporadora',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('companies')
    app.delete(collection)
  },
)
