migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('gp_negociacoes')
    const caseField = col.fields.getByName('case_id')
    if (caseField) {
      caseField.required = true
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('gp_negociacoes')
    const caseField = col.fields.getByName('case_id')
    if (caseField) {
      caseField.required = false
    }
    app.save(col)
  },
)
