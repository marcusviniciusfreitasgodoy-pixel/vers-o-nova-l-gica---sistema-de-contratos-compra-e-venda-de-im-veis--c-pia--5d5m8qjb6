migrate(
  (app) => {
    const casesCollection = app.findCollectionByNameOrId('cases')

    const collection = new Collection({
      name: 'case_state_transitions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && case.company = @request.auth.company || @request.auth.is_admin = true",
      viewRule:
        "@request.auth.id != '' && case.company = @request.auth.company || @request.auth.is_admin = true",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'case',
          type: 'relation',
          required: true,
          collectionId: casesCollection.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'previous_state', type: 'text', required: true },
        { name: 'new_state', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_case_transitions_case ON case_state_transitions (`case`)'],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('case_state_transitions')
      app.delete(collection)
    } catch (_) {}
  },
)
