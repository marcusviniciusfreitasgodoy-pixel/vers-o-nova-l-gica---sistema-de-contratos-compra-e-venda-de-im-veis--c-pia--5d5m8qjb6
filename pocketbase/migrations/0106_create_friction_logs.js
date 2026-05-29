migrate(
  (app) => {
    const collection = new Collection({
      name: 'friction_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'case',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('cases').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['invalid_attempt', 'correction_link_click', 'block_view', 'success_resolution'],
        },
        { name: 'context_data', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('friction_logs')
    app.delete(collection)
  },
)
