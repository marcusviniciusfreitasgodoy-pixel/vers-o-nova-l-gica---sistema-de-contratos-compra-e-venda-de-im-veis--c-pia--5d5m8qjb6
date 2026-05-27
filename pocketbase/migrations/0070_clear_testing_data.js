migrate(
  (app) => {
    const collectionsToClear = [
      'contract_audit_logs',
      'analysis_reports',
      'contracts',
      'system_error_logs',
    ]

    for (const name of collectionsToClear) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.truncateCollection(col)
      } catch (err) {
        console.log('Could not clear ' + name + ': ' + err)
      }
    }
  },
  (app) => {
    // Down migration is intentionally left empty as data deletion is irreversible.
  },
)
