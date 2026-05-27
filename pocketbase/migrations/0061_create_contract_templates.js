migrate(
  (app) => {
    const collection = new Collection({
      name: 'contract_templates',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      viewRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      updateRule:
        "@request.auth.id != '' && @request.auth.is_admin = true && user = @request.auth.id",
      deleteRule:
        "@request.auth.id != '' && @request.auth.is_admin = true && user = @request.auth.id",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'template_data', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contract_templates')
    app.delete(collection)
  },
)
