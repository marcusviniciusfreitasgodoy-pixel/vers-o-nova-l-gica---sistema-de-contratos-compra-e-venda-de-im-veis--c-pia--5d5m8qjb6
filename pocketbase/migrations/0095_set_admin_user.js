migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'marcus@godoyprime.com.br')
      record.set('is_admin', true)
      record.set('role', 'admin')
      app.save(record)
    } catch (_) {
      // User does not exist, gracefully skip
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'marcus@godoyprime.com.br')
      record.set('is_admin', false)
      record.set('role', '')
      app.save(record)
    } catch (_) {
      // User does not exist, gracefully skip
    }
  },
)
