migrate(
  (app) => {
    const partes = app.findCollectionByNameOrId('partes')
    const imovel = app.findCollectionByNameOrId('imovel')

    const rule =
      "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"

    partes.createRule = rule
    partes.updateRule = rule
    partes.deleteRule = rule

    imovel.createRule = rule
    imovel.updateRule = rule
    imovel.deleteRule = rule

    app.save(partes)
    app.save(imovel)
  },
  (app) => {
    const partes = app.findCollectionByNameOrId('partes')
    const imovel = app.findCollectionByNameOrId('imovel')

    partes.createRule = null
    partes.updateRule = null
    partes.deleteRule = null

    imovel.createRule = null
    imovel.updateRule = null
    imovel.deleteRule = null

    app.save(partes)
    app.save(imovel)
  },
)
