migrate(
  (app) => {
    const collections = ['contracts', 'analysis_reports', 'contract_templates']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.createRule = '@request.auth.is_admin = true'
        col.updateRule = '@request.auth.is_admin = true'
        col.deleteRule = '@request.auth.is_admin = true'
        app.save(col)
      } catch (e) {}
    }
  },
  (app) => {
    try {
      const contracts = app.findCollectionByNameOrId('contracts')
      contracts.createRule = "@request.auth.id != ''"
      contracts.updateRule = "@request.auth.id != '' && user = @request.auth.id"
      contracts.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
      app.save(contracts)
    } catch (e) {}

    try {
      const reports = app.findCollectionByNameOrId('analysis_reports')
      reports.createRule = "@request.auth.id != ''"
      reports.updateRule = "@request.auth.id != '' && user = @request.auth.id"
      reports.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
      app.save(reports)
    } catch (e) {}

    try {
      const templates = app.findCollectionByNameOrId('contract_templates')
      templates.createRule = "@request.auth.id != '' && @request.auth.is_admin = true"
      templates.updateRule =
        "@request.auth.id != '' && @request.auth.is_admin = true && user = @request.auth.id"
      templates.deleteRule =
        "@request.auth.id != '' && @request.auth.is_admin = true && user = @request.auth.id"
      app.save(templates)
    } catch (e) {}
  },
)
