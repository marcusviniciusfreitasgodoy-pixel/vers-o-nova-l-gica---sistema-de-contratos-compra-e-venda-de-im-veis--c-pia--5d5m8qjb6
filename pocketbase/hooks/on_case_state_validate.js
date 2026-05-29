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

    // 1. Matriz de Transição Operacional
    const validTransitions = {
      rascunho: ['em_qualificacao', 'cancelado'],
      em_qualificacao: ['em_preenchimento', 'cancelado'],
      em_preenchimento: ['aguardando_documentos', 'cancelado'],
      aguardando_documentos: ['em_validacao', 'cancelado'],
      em_validacao: ['pendente_revisao_juridica', 'cancelado'],
      pendente_revisao_juridica: ['aprovado', 'aprovado_ressalvas', 'bloqueado', 'cancelado'],
      encaminhado_suporte_especializado: [
        'em_validacao',
        'aprovado',
        'aprovado_ressalvas',
        'bloqueado',
        'cancelado',
      ],
      aprovado: ['minuta_gerada', 'arquivado'],
      aprovado_ressalvas: ['minuta_gerada'],
      bloqueado: ['arquivado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica'],
      cancelado: [],
      arquivado: [],
    }

    const allowed = validTransitions[prevState] || []

    if (!allowed.includes(newState)) {
      throw new BadRequestError('Estado inválido', {
        estado_caso: new ValidationError(
          'invalid_transition',
          'Ação permitida apenas em rascunho.',
        ),
      })
    }

    // Role Enforcement Matrix & Rule Blocks
    let requiredRole = ''
    let blockMsg = 'Acesso negado para seu perfil.'
    let ruleBlockMsg = 'Verifique os dados obrigatórios.'

    if (newState === 'cancelado') {
      if (!isAdmin) {
        requiredRole = 'Admin'
        blockMsg = 'Apenas administradores cancelam.'
      }
      ruleBlockMsg = 'Informe o motivo do cancelamento.'
    } else if (newState === 'minuta_gerada') {
      if (!isOperador) {
        requiredRole = 'Operador'
        blockMsg = 'Perfil sem acesso a minutas.'
      }
      ruleBlockMsg = 'Aguarde o processamento do arquivo.'
    } else if (
      prevState === 'minuta_gerada' &&
      (newState === 'em_preenchimento' || newState === 'pendente_revisao_juridica')
    ) {
      if (!isAdmin) {
        requiredRole = 'Admin'
        blockMsg = 'Permissão de Admin requerida.'
      }
      ruleBlockMsg = 'Ação permitida apenas em rascunho.'
    } else if (
      newState === 'em_qualificacao' ||
      newState === 'em_preenchimento' ||
      newState === 'aguardando_documentos' ||
      newState === 'em_validacao'
    ) {
      if (!isOperador) {
        requiredRole = 'Operador'
      }
    } else if (
      newState === 'pendente_revisao_juridica' ||
      newState === 'aprovado' ||
      newState === 'aprovado_ressalvas' ||
      newState === 'bloqueado'
    ) {
      if (!isGestor) {
        requiredRole = 'Gestor'
      }
    } else if (newState === 'arquivado') {
      if (!isAdmin) {
        requiredRole = 'Admin'
      }
    }

    if (requiredRole) {
      throw new ForbiddenError(blockMsg)
    }

    // 3. Completeness Matrix
    const caseId = e.record.id

    if (newState === 'em_qualificacao') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Dados básicos faltantes', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState !== 'minuta_gerada') {
      if (!e.record.getString('segmento_operacional') || !e.record.getString('priority')) {
        throw new BadRequestError('Dados da qualificação faltantes', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
      try {
        const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 1, 0)
        if (partes.length === 0) {
          throw new BadRequestError('Participantes não informados', {
            estado_caso: new ValidationError('validation_error', ruleBlockMsg),
          })
        }
      } catch (err) {
        throw new BadRequestError('Participantes não informados', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
    }

    if (newState === 'aguardando_documentos') {
      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const neg = negs.length > 0 ? negs[0] : null

      if (!neg || !neg.getFloat('valor_total') || !neg.getString('forma_pagamento')) {
        throw new BadRequestError('Ficha cadastral pendente', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
    }

    if (newState === 'em_validacao') {
      try {
        const checklists = $app.findRecordsByFilter(
          'gp_doc_checklist',
          `negociacao_id.case_id = '${caseId}'`,
          '',
          100,
          0,
        )
        const hasFiles = checklists.some((c) => c.get('arquivos') && c.get('arquivos').length > 0)

        if (!hasFiles) {
          throw new BadRequestError('Documentação incompleta', {
            estado_caso: new ValidationError('validation_error', ruleBlockMsg),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Documentação incompleta', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
    }

    if (newState === 'pendente_revisao_juridica' && prevState !== 'minuta_gerada') {
      if (!e.record.getString('nivel_complexidade')) {
        throw new BadRequestError('Análise técnica incompleta', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
        })
      }
    }

    // Rule 4. Legal Review Governance
    if (
      prevState === 'pendente_revisao_juridica' &&
      (newState === 'aprovado' || newState === 'aprovado_ressalvas' || newState === 'bloqueado')
    ) {
      if (!e.record.getString('parecer') || !e.record.getString('parecer_juridico_file')) {
        throw new BadRequestError('Parecer obrigatório para aprovação', {
          parecer: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!e.record.getString('parecer') || !e.record.getString('parecer_juridico_file')) {
        throw new BadRequestError('Parecer obrigatório para aprovação', {
          parecer: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
      if (newState === 'aprovado') {
        e.record.set('data_aprovacao', new Date().toISOString())
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('Regras de ressalva não preenchidas', {
          observacoes: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
    }

    if (newState === 'bloqueado') {
      if (!e.record.getString('motivo_bloqueio')) {
        throw new BadRequestError('Motivo de bloqueio obrigatório', {
          motivo_bloqueio: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
    }

    if (newState === 'cancelado') {
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Motivo de cancelamento obrigatório', {
          motivo_cancelamento: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
    }

    if (newState === 'minuta_gerada') {
      const contracts = $app.findRecordsByFilter(
        'contracts',
        `negociacao_id.case_id = '${caseId}'`,
        '',
        1,
        0,
      )
      if (contracts.length === 0 || !contracts[0].getString('arquivo_gerado')) {
        throw new BadRequestError('Dados de fechamento inválidos', {
          estado_caso: new ValidationError('validation_error', ruleBlockMsg),
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

    // 2. Synchronization Matrix
    let reflexoNegociacao = null

    if (prevState === 'minuta_gerada' && newState === 'em_preenchimento') {
      reflexoNegociacao = 'proposta'
    } else if (prevState === 'minuta_gerada' && newState === 'pendente_revisao_juridica') {
      reflexoNegociacao = 'promessa'
    } else {
      const negMap = {
        rascunho: 'captacao',
        em_qualificacao: 'preliminar',
        em_preenchimento: 'preliminar',
        aguardando_documentos: 'preliminar',
        em_validacao: 'promessa',
        pendente_revisao_juridica: 'promessa',
        aprovado: 'promessa',
        aprovado_ressalvas: 'promessa',
        minuta_gerada: 'promessa',
        cancelado: 'nulo',
        arquivado: 'nulo',
      }
      reflexoNegociacao = negMap[newState]
    }

    if (reflexoNegociacao && reflexoNegociacao !== 'nulo') {
      try {
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 100, 0)
        for (let neg of negs) {
          if (neg.getString('estagio') !== reflexoNegociacao) {
            neg.set('estagio', reflexoNegociacao)
            $app.saveNoValidate(neg)
          }
        }
      } catch (err) {
        $app.logger().error('sync_negociacao_error', 'case_id', caseId, 'error', err.message)
      }
    }
  }

  e.next()
}, 'cases')
