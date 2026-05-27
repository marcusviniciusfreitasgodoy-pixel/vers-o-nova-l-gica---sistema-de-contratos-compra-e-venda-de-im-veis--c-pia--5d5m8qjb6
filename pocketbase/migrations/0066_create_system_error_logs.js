migrate(
  (app) => {
    const collection = new Collection({
      name: 'system_error_logs',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      viewRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'error_message', type: 'text', required: true },
        { name: 'stack_trace', type: 'text', required: false },
        { name: 'component', type: 'text', required: false },
        { name: 'route', type: 'text', required: false },
        {
          name: 'severity',
          type: 'select',
          required: true,
          values: ['info', 'warning', 'error', 'critical'],
          maxSelect: 1,
        },
        { name: 'context_data', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('system_error_logs')
    app.delete(collection)
  },
)
