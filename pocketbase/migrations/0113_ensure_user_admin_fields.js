migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('is_admin')) {
      users.fields.add(new BoolField({ name: 'is_admin' }))
    }

    if (!users.fields.getByName('company')) {
      users.fields.add(new TextField({ name: 'company' }))
    }

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'gestor', 'operador', 'cliente'],
          maxSelect: 1,
        }),
      )
    }

    app.save(users)

    try {
      const user = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'marcusviniciusfreitasgodoy@gmail.com',
      )
      user.set('role', 'admin')
      user.set('is_admin', true)
      app.saveNoValidate(user)
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) users.fields.removeByName('role')
    if (users.fields.getByName('is_admin')) users.fields.removeByName('is_admin')
    if (users.fields.getByName('company')) users.fields.removeByName('company')
    app.save(users)
  },
)
