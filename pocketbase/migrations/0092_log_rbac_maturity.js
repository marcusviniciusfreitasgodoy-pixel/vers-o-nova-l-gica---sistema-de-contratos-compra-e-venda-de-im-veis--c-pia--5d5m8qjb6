migrate(
  (app) => {
    const logCollection = app.findCollectionByNameOrId('system_error_logs')
    const record = new Record(logCollection)
    record.set('error_message', 'RBAC Maturity Report: Initial implementation')
    record.set('severity', 'info')
    record.set('component', 'RBAC_Reconciliation')
    record.set('context_data', {
      total_actions_identified: 5,
      actions_covered: 2,
      maturity_percentage: 40,
      note: 'Initial umbilical cord established between cases and gp_negociacoes. Legacy RBAC endpoints implemented and tested.',
    })
    app.save(record)
  },
  (app) => {
    // Logging records generally shouldn't be reverted directly to preserve audit history
  },
)
