migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    let changed = false

    if (users.fields.getByName('openai_api_key')) {
      users.fields.removeByName('openai_api_key')
      changed = true
    }
    if (users.fields.getByName('anthropic_api_key')) {
      users.fields.removeByName('anthropic_api_key')
      changed = true
    }
    if (users.fields.getByName('gemini_api_key')) {
      users.fields.removeByName('gemini_api_key')
      changed = true
    }

    if (changed) {
      app.save(users)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    let changed = false

    if (!users.fields.getByName('openai_api_key')) {
      users.fields.add(new TextField({ name: 'openai_api_key' }))
      changed = true
    }
    if (!users.fields.getByName('anthropic_api_key')) {
      users.fields.add(new TextField({ name: 'anthropic_api_key' }))
      changed = true
    }
    if (!users.fields.getByName('gemini_api_key')) {
      users.fields.add(new TextField({ name: 'gemini_api_key' }))
      changed = true
    }

    if (changed) {
      app.save(users)
    }
  },
)
