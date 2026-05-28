migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contract_audit_logs')
    col.addIndex('idx_contract_audit_logs_contract', false, 'contract', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contract_audit_logs')
    col.removeIndex('idx_contract_audit_logs_contract')
    app.save(col)
  },
)
