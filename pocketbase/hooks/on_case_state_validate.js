onRecordUpdateRequest((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (prevState && prevState !== newState) {
    const transitions = {
      rascunho: ['em_qualificacao', 'cancelado'],
      em_qualificacao: ['em_preenchimento', 'cancelado', 'arquivado'],
      em_preenchimento: ['aguardando_documentos', 'em_validacao', 'cancelado'],
      aguardando_documentos: ['em_preenchimento', 'em_validacao', 'cancelado'],
      em_validacao: [
        'pendente_revisao_juridica',
        'aprovado',
        'aprovado_ressalvas',
        'encaminhado_suporte_especializado',
        'bloqueado',
      ],
      pendente_revisao_juridica: [
        'aprovado',
        'aprovado_ressalvas',
        'em_preenchimento',
        'bloqueado',
      ],
      encaminhado_suporte_especializado: ['em_validacao', 'aprovado', 'bloqueado'],
      aprovado: ['minuta_gerada', 'cancelado'],
      aprovado_ressalvas: ['minuta_gerada', 'em_preenchimento', 'cancelado'],
      bloqueado: ['em_validacao', 'cancelado'],
      minuta_gerada: ['arquivado', 'cancelado'],
      cancelado: ['arquivado'],
      arquivado: [],
    }

    const allowed = transitions[prevState] || []
    const isGlobalAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.getBool('is_admin'))
    const role = e.auth ? e.auth.getString('role') : ''

    if (!allowed.includes(newState) && !isGlobalAdmin) {
      throw new BadRequestError('Transição de estado inválida', {
        estado_caso: new ValidationError(
          'invalid_transition',
          `Não é possível mover o caso de '${prevState}' para '${newState}'.`,
        ),
      })
    }

    const restrictedForOperador = ['aprovado', 'aprovado_ressalvas', 'cancelado', 'arquivado']
    if (role === 'operador' && restrictedForOperador.includes(newState)) {
      throw new BadRequestError('Ação não permitida para seu perfil.', {
        estado_caso: new ValidationError(
          'unauthorized_transition',
          'Seu perfil (Operador) não tem permissão para esta transição.',
        ),
      })
    }
  }

  const prevResponsible = original.getString('responsible')
  const newResponsible = e.record.getString('responsible')
  const role = e.auth ? e.auth.getString('role') : ''

  if (prevResponsible && prevResponsible !== newResponsible) {
    if (role === 'operador') {
      throw new BadRequestError('Ação não permitida para seu perfil.', {
        responsible: new ValidationError(
          'unauthorized_change',
          'Operadores não podem alterar o responsável do caso.',
        ),
      })
    }
  }

  e.next()
}, 'cases')
