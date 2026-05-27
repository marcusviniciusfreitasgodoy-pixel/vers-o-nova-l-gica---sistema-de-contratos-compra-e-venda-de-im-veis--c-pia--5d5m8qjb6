migrate(
  (app) => {
    try {
      app.findFirstRecordByData(
        'system_error_logs',
        'error_message',
        'Validation failed for field valor_financiamento',
      )
      return // already seeded
    } catch (_) {}

    const col = app.findCollectionByNameOrId('system_error_logs')
    const record = new Record(col)
    record.set('error_message', 'Validation failed for field valor_financiamento')
    record.set('component', 'NewContract')
    record.set('severity', 'error')
    record.set('context_data', {
      tipo_negociacao: 'recursos_proprios',
      utiliza_financiamento: false,
    })

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData(
        'system_error_logs',
        'error_message',
        'Validation failed for field valor_financiamento',
      )
      app.delete(record)
    } catch (_) {}
  },
)
