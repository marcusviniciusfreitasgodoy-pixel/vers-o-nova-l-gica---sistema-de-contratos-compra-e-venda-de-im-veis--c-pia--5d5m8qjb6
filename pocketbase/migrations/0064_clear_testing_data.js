migrate(
  (app) => {
    const tables = ['contract_audit_logs', 'analysis_reports', 'contracts']

    for (const table of tables) {
      if (app.hasTable(table)) {
        app.db().newQuery(`DELETE FROM ${table}`).execute()
      }
    }
  },
  (app) => {
    // Irreversible migration - deleted testing data cannot be restored automatically
  },
)
