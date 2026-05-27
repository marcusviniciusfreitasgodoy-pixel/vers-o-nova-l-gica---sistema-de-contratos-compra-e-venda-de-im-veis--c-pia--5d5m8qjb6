migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('gemini_api_key')) {
      users.fields.add(new TextField({ name: 'gemini_api_key' }))
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('gemini_api_key')) {
      users.fields.removeByName('gemini_api_key')
      app.save(users)
    }
  },
)
