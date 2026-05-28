migrate(
  (app) => {
    const emails = ['marcusviniciusfreitasgodoy@gmail.com', 'admin@goskip.app', 'admin@example.com']

    for (const email of emails) {
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        user.set('role', 'admin')
        user.set('is_admin', true)
        app.saveNoValidate(user)
      } catch (_) {
        // User doesn't exist, ignore
      }
    }
  },
  (app) => {
    // Migration is generally one-way since we don't track original state, safe to ignore down
  },
)
