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
      minuta_gerada: ['arquivado', 'cancelado', 'em_preenchimento'],
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

    if (newState === 'em_qualificacao') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Dados incompletos', {
          estado_caso: new ValidationError(
            'validation_error',
            'Preencha o título e o tipo de operação.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      if (role === 'cliente') {
        throw new ForbiddenError('Apenas corretores podem iniciar o preenchimento.')
      }
      const caseId = e.record.id
      try {
        const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 100, 0)
        const hasComprador = partes.some((p) => p.getString('papel_na_operacao') === 'comprador')
        const hasVendedor = partes.some((p) => p.getString('papel_na_operacao') === 'vendedor')
        if (!hasComprador || !hasVendedor) {
          throw new BadRequestError('Partes ausentes', {
            estado_caso: new ValidationError(
              'validation_error',
              'Identifique pelo menos um comprador e um vendedor.',
            ),
          })
        }
      } catch (_) {}
    }

    if (newState === 'aguardando_documentos') {
      if (role === 'cliente') {
        throw new ForbiddenError('Ação restrita à equipe operacional.')
      }
      const caseId = e.record.id
      try {
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
        if (
          negs.length === 0 ||
          !negs[0].getFloat('valor_total') ||
          !negs[0].getString('forma_pagamento')
        ) {
          throw new BadRequestError('Dados financeiros incompletos', {
            estado_caso: new ValidationError(
              'validation_error',
              'Defina o valor e forma de pagamento primeiro.',
            ),
          })
        }
      } catch (_) {}
    }

    if (newState === 'em_validacao' && prevState === 'aguardando_documentos') {
      const caseId = e.record.id
      try {
        const checklists = $app.findRecordsByFilter(
          'gp_doc_checklist',
          `negociacao_id.case_id = '${caseId}'`,
          '',
          100,
          0,
        )
        const hasFiles = checklists.some((chk) => {
          const arr = chk.get('arquivos')
          return arr && arr.length > 0
        })
        if (!hasFiles && checklists.length > 0) {
          throw new BadRequestError('Arquivos obrigatórios ausentes', {
            estado_caso: new ValidationError(
              'validation_error',
              'Anexe todos os documentos marcados como obrigatórios.',
            ),
          })
        }
      } catch (_) {}
    }

    if (newState === 'pendente_revisao_juridica') {
      if (!e.record.getString('nivel_complexidade')) {
        throw new BadRequestError('Complexidade ausente', {
          estado_caso: new ValidationError(
            'validation_error',
            'Defina o nível de complexidade do caso.',
          ),
        })
      }
    }

    if (newState === 'aprovado_ressalvas') {
      if (!e.record.getString('observacoes')) {
        throw new BadRequestError('Ressalvas ausentes', {
          estado_caso: new ValidationError(
            'validation_error',
            'Descreva as ressalvas obrigatórias.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'minuta_gerada') {
      if (!isGlobalAdmin && role !== 'gestor') {
        throw new ForbiddenError('Apenas gestores podem invalidar minutas.')
      }
    }

    const restrictedForOperador = [
      'aprovado',
      'aprovado_ressalvas',
      'cancelado',
      'arquivado',
      'pendente_revisao_juridica',
    ]
    if (role === 'operador' && restrictedForOperador.includes(newState)) {
      throw new ForbiddenError('Ação não permitida para seu perfil.')
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
