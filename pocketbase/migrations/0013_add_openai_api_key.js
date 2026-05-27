migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('openai_api_key')) {
      users.fields.add(new TextField({ name: 'openai_api_key' }))
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('openai_api_key')) {
      users.fields.removeByName('openai_api_key')
    }
    app.save(users)
  },
)
