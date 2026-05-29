migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const createOrSkip = (email, name, role) => {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', email)
        return
      } catch (_) {}

      const record = new Record(users)
      record.setEmail(email)
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', name)
      record.set('role', role)
      if (role === 'admin') record.set('is_admin', true)
      app.save(record)
    }

    createOrSkip('gestor@teste.com', 'Gestor de Teste', 'gestor')
    createOrSkip('operador@teste.com', 'Operador de Teste', 'operador')
  },
  (app) => {
    try {
      const record1 = app.findAuthRecordByEmail('_pb_users_auth_', 'gestor@teste.com')
      app.delete(record1)
    } catch (_) {}
    try {
      const record2 = app.findAuthRecordByEmail('_pb_users_auth_', 'operador@teste.com')
      app.delete(record2)
    } catch (_) {}
  },
)
