// Validates RBAC rules for the 'cases' module against 'gp_negociacoes' operations
// It implements the RBAC Coverage Quality Gate and enforces structural constraints.

onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  const caseId = body.case_id || e.record?.getString('case_id')

  if (!caseId) {
    throw new BadRequestError("O vínculo com um 'case' é obrigatório para iniciar uma negociação.")
  }

  const user = e.auth
  if (!user) throw new UnauthorizedError('Autenticação necessária.')

  try {
    const caseRecord = $app.findRecordById('cases', caseId)
    const isAdmin = user.getBool('is_admin')

    if (!isAdmin && user.getString('company') !== caseRecord.getString('company')) {
      $app
        .logger()
        .warn(
          'rbac_coverage',
          'action',
          'gp_negociacoes_create',
          'allowed',
          'false',
          'reason',
          'company_mismatch',
          'user',
          user.id,
        )
      throw new ForbiddenError('Acesso negado: a empresa deste caso difere da sua.')
    }

    const role = user.getString('role')
    if (!isAdmin && role === 'operador' && caseRecord.getString('responsible') !== user.id) {
      $app
        .logger()
        .warn(
          'rbac_coverage',
          'action',
          'gp_negociacoes_create',
          'allowed',
          'false',
          'reason',
          'operador_not_responsible',
          'user',
          user.id,
        )
      throw new ForbiddenError(
        'Operadores só podem criar negociações para os casos em que são responsáveis.',
      )
    }

    // Log the successful RBAC validation quality gate
    $app
      .logger()
      .info(
        'rbac_coverage',
        'action',
        'gp_negociacoes_create',
        'allowed',
        'true',
        'case_id',
        caseId,
        'user',
        user.id,
      )
    e.next()
  } catch (err) {
    if (err.status) throw err
    throw new NotFoundError('Caso referenciado não foi encontrado.')
  }
}, 'gp_negociacoes')

onRecordUpdateRequest((e) => {
  const caseId = e.record.getString('case_id')
  if (!caseId) return e.next()

  const user = e.auth
  if (!user) throw new UnauthorizedError('Autenticação necessária.')

  try {
    const caseRecord = $app.findRecordById('cases', caseId)
    const isAdmin = user.getBool('is_admin')

    if (!isAdmin && user.getString('company') !== caseRecord.getString('company')) {
      $app
        .logger()
        .warn(
          'rbac_coverage',
          'action',
          'gp_negociacoes_update',
          'allowed',
          'false',
          'reason',
          'company_mismatch',
          'user',
          user.id,
        )
      throw new ForbiddenError('Acesso negado.')
    }

    const role = user.getString('role')
    if (!isAdmin && role === 'operador' && caseRecord.getString('responsible') !== user.id) {
      $app
        .logger()
        .warn(
          'rbac_coverage',
          'action',
          'gp_negociacoes_update',
          'allowed',
          'false',
          'reason',
          'operador_not_responsible',
          'user',
          user.id,
        )
      throw new ForbiddenError('Acesso negado: responsável apenas.')
    }

    if (caseRecord.getString('estado_caso') === 'minuta_gerada') {
      throw new ForbiddenError(
        'Acesso negado: a negociação está travada pois a minuta já foi gerada. Invalide a minuta para editar.',
      )
    }

    // Log the successful RBAC validation quality gate
    $app
      .logger()
      .info(
        'rbac_coverage',
        'action',
        'gp_negociacoes_update',
        'allowed',
        'true',
        'case_id',
        caseId,
        'user',
        user.id,
      )
    e.next()
  } catch (err) {
    if (err.status) throw err
    throw new NotFoundError('Caso referenciado não foi encontrado.')
  }
}, 'gp_negociacoes')
