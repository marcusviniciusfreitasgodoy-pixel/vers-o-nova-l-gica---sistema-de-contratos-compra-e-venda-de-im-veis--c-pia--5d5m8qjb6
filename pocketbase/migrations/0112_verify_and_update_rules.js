migrate((app) => {
  const cases = app.findCollectionByNameOrId('cases')
  cases.createRule = "@request.auth.id != ''"
  cases.updateRule =
    "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || responsible = @request.auth.id)"
  app.save(cases)

  const partes = app.findCollectionByNameOrId('partes')
  partes.createRule =
    "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
  partes.updateRule =
    "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
  app.save(partes)

  const imovel = app.findCollectionByNameOrId('imovel')
  imovel.createRule =
    "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
  imovel.updateRule =
    "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
  app.save(imovel)
})
