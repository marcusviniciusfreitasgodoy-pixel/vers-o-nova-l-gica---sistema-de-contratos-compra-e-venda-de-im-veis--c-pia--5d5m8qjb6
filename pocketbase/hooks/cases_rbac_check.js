routerAdd(
  'POST',
  '/backend/v1/cases/check-permission',
  (e) => {
    const body = e.requestInfo().body || {}
    const caseId = body.case_id
    const action = body.action

    if (!caseId || !action) {
      return e.badRequestError('case_id and action are required')
    }

    try {
      const caseRecord = $app.findRecordById('cases', caseId)
      const authRecord = e.auth

      if (!authRecord) {
        return e.unauthorizedError('Authentication required')
      }

      const isAdmin = authRecord.getBool('is_admin')
      const isOwner = authRecord.getString('company') === caseRecord.getString('company')
      const isClient = authRecord.id === caseRecord.getString('client_id')

      if (!isAdmin && !isOwner && !isClient) {
        $app
          .logger()
          .warn(
            'RBAC check failed: user not admin and not case company',
            'case_id',
            caseId,
            'user_id',
            authRecord.id,
          )
        return e.json(200, { allowed: false, reason: 'User does not have access to this case' })
      }

      const state = caseRecord.getString('estado_caso')
      let allowed = false
      let reason = 'Action not permitted for current state'

      switch (action) {
        case 'edit_negotiation':
          if (
            [
              'em_validacao',
              'pendente_revisao_juridica',
              'aprovado',
              'aprovado_ressalvas',
              'bloqueado',
              'cancelado',
              'arquivado',
            ].includes(state)
          ) {
            allowed = false
            reason = `Cannot edit negotiation when case is ${state}`
          } else {
            allowed = true
            reason = 'OK'
          }
          break
        case 'sign_contract':
          if (['minuta_gerada', 'aprovado', 'aprovado_ressalvas'].includes(state)) {
            allowed = true
            reason = 'OK'
          } else {
            allowed = false
            reason = `Case must be approved or minuta generated to sign contract. Current state: ${state}`
          }
          break
        default:
          allowed = true
          reason = 'Action recognized and permitted by default'
          break
      }

      $app
        .logger()
        .info(
          'RBAC check executed',
          'case_id',
          caseId,
          'action',
          action,
          'allowed',
          allowed,
          'user_id',
          authRecord.id,
        )

      return e.json(200, { allowed, reason })
    } catch (err) {
      return e.notFoundError('Case not found')
    }
  },
  $apis.requireAuth(),
)
