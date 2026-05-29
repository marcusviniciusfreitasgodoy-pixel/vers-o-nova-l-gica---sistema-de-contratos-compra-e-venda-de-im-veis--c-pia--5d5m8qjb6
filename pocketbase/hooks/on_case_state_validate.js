// @deps zod@3.23.8
onRecordUpdateRequest((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (prevState && prevState !== newState) {
    const role = e.auth ? e.auth.getString('role') : ''
    const isGlobalAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.getBool('is_admin'))
    const isAdmin = isGlobalAdmin || role === 'admin'
    const isGestor = role === 'gestor' || isAdmin
    const isOperador = role === 'operador' || role === 'cliente' || isGestor

    const transitions = {
      rascunho: ['em_qualificacao', 'cancelado'],
      em_qualificacao: ['em_preenchimento', 'cancelado'],
      em_preenchimento: ['aguardando_documentos', 'cancelado'],
      aguardando_documentos: ['em_validacao', 'cancelado'],
      em_validacao: ['pendente_revisao_juridica', 'bloqueado', 'cancelado'],
      pendente_revisao_juridica: ['aprovado', 'aprovado_ressalvas', 'bloqueado', 'cancelado'],
      aprovado: ['minuta_gerada', 'arquivado', 'cancelado'],
      aprovado_ressalvas: ['minuta_gerada', 'arquivado', 'cancelado'],
      bloqueado: ['arquivado', 'cancelado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica', 'cancelado'],
      encaminhado_suporte_especializado: [
        'em_validacao',
        'aprovado',
        'aprovado_ressalvas',
        'bloqueado',
        'cancelado',
      ],
      cancelado: [],
      arquivado: [],
    }

    if (
      newState === 'em_qualificacao' ||
      newState === 'em_preenchimento' ||
      newState === 'aguardando_documentos' ||
      newState === 'em_validacao' ||
      newState === 'minuta_gerada'
    ) {
      if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
    }

    if (
      newState === 'pendente_revisao_juridica' &&
      prevState !== 'minuta_gerada' &&
      prevState !== 'encaminhado_suporte_especializado'
    ) {
      if (!isGestor) throw new ForbiddenError('Acesso negado: Perfil Gestor exigido')
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas' || newState === 'bloqueado') {
      if (!isGestor) throw new ForbiddenError('Acesso negado: Perfil Gestor exigido')
    }

    if (
      prevState === 'minuta_gerada' &&
      (newState === 'em_preenchimento' || newState === 'pendente_revisao_juridica')
    ) {
      if (!isAdmin) throw new ForbiddenError('Acesso negado: Perfil Admin exigido')
    }

    if (newState === 'cancelado' || newState === 'arquivado') {
      if (!isAdmin) throw new ForbiddenError('Acesso negado: Perfil Admin exigido')
    }

    const allowed = transitions[prevState] || []

    if (!allowed.includes(newState)) {
      throw new BadRequestError('Rule Violation', {
        estado_caso: new ValidationError(
          'invalid_transition',
          `Não é possível mover o caso de '${prevState}' para '${newState}'.`,
        ),
      })
    }

    const caseId = e.record.id

    if (newState === 'em_qualificacao' && prevState === 'rascunho') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Dados básicos faltantes'),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
      const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)

      const hasImovel = gpImoveis.length > 0 || imoveis.length > 0
      const matricula =
        gpImoveis.length > 0
          ? gpImoveis[0].getString('matricula_numero')
          : imoveis.length > 0
            ? imoveis[0].getString('matricula')
            : ''

      if (!hasImovel || !matricula) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Matrícula não validada'),
        })
      }
    }

    if (newState === 'aguardando_documentos' && prevState === 'em_preenchimento') {
      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const neg = negs.length > 0 ? negs[0] : null

      if (!neg || !neg.getFloat('valor_total')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Checklist obrigatório pendente'),
        })
      }

      const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 1, 0)
      const gpPartes = neg
        ? $app.findRecordsByFilter('gp_negociacao_partes', `negociacao_id = '${neg.id}'`, '', 1, 0)
        : []

      if (partes.length === 0 && gpPartes.length === 0) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Checklist obrigatório pendente'),
        })
      }
    }

    if (newState === 'em_validacao' && prevState === 'aguardando_documentos') {
      try {
        const checklists = $app.findRecordsByFilter(
          'gp_doc_checklist',
          `negociacao_id.case_id = '${caseId}'`,
          '',
          100,
          0,
        )
        const allCompleted =
          checklists.length > 0 &&
          checklists.every((c) => c.get('arquivos') && c.get('arquivos').length > 0)

        if (!allCompleted && checklists.length > 0) {
          throw new BadRequestError('Rule Violation', {
            estado_caso: new ValidationError('validation_error', 'Documentos técnicos ausentes'),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Documentos técnicos ausentes'),
        })
      }
    }

    if (
      ['aprovado', 'aprovado_ressalvas'].includes(newState) &&
      prevState === 'pendente_revisao_juridica'
    ) {
      if (!e.record.getString('parecer')) {
        throw new BadRequestError('Rule Violation', {
          parecer: new ValidationError(
            'validation_required',
            'Parecer jurídico conclusivo ausente',
          ),
        })
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('Rule Violation', {
          observacoes: new ValidationError('validation_required', 'Ressalvas não descritas'),
        })
      }
    }

    if (newState === 'bloqueado') {
      if (!e.record.getString('observacoes')) {
        throw new BadRequestError('Rule Violation', {
          observacoes: new ValidationError('validation_required', 'Motivo do bloqueio obrigatório'),
        })
      }
    }

    if (newState === 'cancelado') {
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Rule Violation', {
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'Motivo do cancelamento obrigatório',
          ),
        })
      }
    }

    if (newState === 'arquivado') {
      if (!['aprovado', 'aprovado_ressalvas', 'bloqueado'].includes(prevState)) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'validation_error',
            'Estado atual não permite arquivamento',
          ),
        })
      }
    }
  }

  e.next()
}, 'cases')

onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (prevState !== newState) {
    const caseId = e.record.id

    const negMap = {
      rascunho: 'captacao',
      em_qualificacao: 'proposta',
      em_preenchimento: 'preliminar',
      aguardando_documentos: 'preliminar',
      em_validacao: 'promessa',
      pendente_revisao_juridica: 'promessa',
      aprovado: 'concluido',
      aprovado_ressalvas: 'concluido',
      minuta_gerada: 'finalizacao',
      cancelado: 'distratado',
    }

    const reflexoNegociacao = negMap[newState]

    if (reflexoNegociacao) {
      try {
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 100, 0)
        for (let neg of negs) {
          if (neg.getString('estagio') !== reflexoNegociacao) {
            neg.set('estagio', reflexoNegociacao)
            $app.saveNoValidate(neg)
          }
        }
      } catch (_) {}
    }
  }

  e.next()
}, 'cases')
