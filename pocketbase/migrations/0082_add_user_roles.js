migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'gestor', 'operador'],
          maxSelect: 1,
        }),
      )
    }

    users.listRule =
      'id = @request.auth.id || company = @request.auth.company || @request.auth.is_admin = true'
    users.viewRule = users.listRule
    users.updateRule =
      "id = @request.auth.id || (@request.auth.role = 'admin' && company = @request.auth.company) || @request.auth.is_admin = true"
    app.save(users)

    // Update cases rules
    const cases = app.findCollectionByNameOrId('cases')
    cases.listRule =
      "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || responsible = @request.auth.id)"
    cases.viewRule = cases.listRule
    cases.updateRule = cases.listRule
    cases.deleteRule =
      "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true) && @request.auth.role != 'operador'"
    app.save(cases)

    // Update partes rules
    const partes = app.findCollectionByNameOrId('partes')
    partes.listRule =
      "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
    partes.viewRule = partes.listRule
    partes.updateRule = partes.listRule
    partes.deleteRule = partes.listRule
    app.save(partes)

    // Update imovel rules
    const imovel = app.findCollectionByNameOrId('imovel')
    imovel.listRule =
      "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true) && (@request.auth.role != 'operador' || case_id.responsible = @request.auth.id)"
    imovel.viewRule = imovel.listRule
    imovel.updateRule = imovel.listRule
    imovel.deleteRule = imovel.listRule
    app.save(imovel)

    // Update case_state_transitions
    const transitionsCol = app.findCollectionByNameOrId('case_state_transitions')
    if (!transitionsCol.fields.getByName('user_role')) {
      transitionsCol.fields.add(
        new TextField({
          name: 'user_role',
        }),
      )
      app.save(transitionsCol)
    }

    // Assign existing users a role
    const allUsers = app.findRecordsByFilter('users', '1=1', '', 1000, 0)
    for (const u of allUsers) {
      if (u.getBool('is_admin')) {
        u.set('role', 'admin')
      } else {
        u.set('role', 'gestor')
      }
      app.saveNoValidate(u)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    app.save(users)

    const cases = app.findCollectionByNameOrId('cases')
    cases.listRule =
      "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)"
    cases.viewRule = cases.listRule
    cases.updateRule = cases.listRule
    cases.deleteRule = cases.listRule
    app.save(cases)

    const partes = app.findCollectionByNameOrId('partes')
    partes.listRule =
      "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)"
    partes.viewRule = partes.listRule
    partes.updateRule = partes.listRule
    partes.deleteRule = partes.listRule
    app.save(partes)

    const imovel = app.findCollectionByNameOrId('imovel')
    imovel.listRule =
      "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)"
    imovel.viewRule = imovel.listRule
    imovel.updateRule = imovel.listRule
    imovel.deleteRule = imovel.listRule
    app.save(imovel)

    const transitionsCol = app.findCollectionByNameOrId('case_state_transitions')
    if (transitionsCol.fields.getByName('user_role')) {
      transitionsCol.fields.removeByName('user_role')
      app.save(transitionsCol)
    }
  },
)
