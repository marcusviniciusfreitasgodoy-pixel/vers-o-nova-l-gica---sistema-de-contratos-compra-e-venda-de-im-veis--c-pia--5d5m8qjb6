migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      if (!roleField.values.includes('cliente')) {
        roleField.values.push('cliente')
      }
    }
    app.save(usersCol)

    const casesCol = app.findCollectionByNameOrId('cases')
    if (!casesCol.fields.getByName('client_id')) {
      casesCol.fields.add(
        new RelationField({
          name: 'client_id',
          collectionId: usersCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    const caseRule =
      "@request.auth.id != '' && (client_id = @request.auth.id || ((company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || responsible = @request.auth.id)))"
    casesCol.listRule = caseRule
    casesCol.viewRule = caseRule
    app.save(casesCol)

    const contractsCol = app.findCollectionByNameOrId('contracts')
    const contractRule =
      "@request.auth.id != '' && (user = @request.auth.id || negociacao_id.case_id.client_id = @request.auth.id)"
    contractsCol.listRule = contractRule
    contractsCol.viewRule = contractRule
    app.save(contractsCol)

    const analysisCol = app.findCollectionByNameOrId('analysis_reports')
    const analysisRule =
      "@request.auth.id != '' && (user = @request.auth.id || contract.negociacao_id.case_id.client_id = @request.auth.id)"
    analysisCol.listRule = analysisRule
    analysisCol.viewRule = analysisRule
    app.save(analysisCol)
  },
  (app) => {
    const casesCol = app.findCollectionByNameOrId('cases')
    const oldRule =
      "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || responsible = @request.auth.id)"
    casesCol.listRule = oldRule
    casesCol.viewRule = oldRule
    try {
      casesCol.fields.removeByName('client_id')
    } catch (_) {}
    app.save(casesCol)

    const contractsCol = app.findCollectionByNameOrId('contracts')
    const contractRuleOld = "@request.auth.id != '' && user = @request.auth.id"
    contractsCol.listRule = contractRuleOld
    contractsCol.viewRule = contractRuleOld
    app.save(contractsCol)

    const analysisCol = app.findCollectionByNameOrId('analysis_reports')
    const analysisRuleOld = "@request.auth.id != '' && user = @request.auth.id"
    analysisCol.listRule = analysisRuleOld
    analysisCol.viewRule = analysisRuleOld
    app.save(analysisCol)
  },
)
