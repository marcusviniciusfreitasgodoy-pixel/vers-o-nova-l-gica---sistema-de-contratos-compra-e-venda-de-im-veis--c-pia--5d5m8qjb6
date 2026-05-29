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

    // 1. Matriz de Transição Operacional (Definitive Version)
    const validTransitions = {
      rascunho: ['em_qualificacao', 'cancelado'],
      em_qualificacao: ['em_preenchimento', 'cancelado'],
      em_preenchimento: ['aguardando_documentos', 'cancelado'],
      aguardando_documentos: ['em_validacao', 'cancelado'],
      em_validacao: ['pendente_revisao_juridica', 'cancelado'],
      pendente_revisao_juridica: ['aprovado', 'aprovado_ressalvas', 'bloqueado', 'cancelado'],
      aprovado: ['minuta_gerada', 'arquivado'],
      aprovado_ressalvas: ['minuta_gerada', 'arquivado'],
      bloqueado: ['arquivado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica'],
      cancelado: ['arquivado'],
      arquivado: [],
      encaminhado_suporte_especializado: [
        'em_validacao',
        'aprovado',
        'aprovado_ressalvas',
        'bloqueado',
        'cancelado',
      ],
    }

    const allowed = validTransitions[prevState] || []

    if (!allowed.includes(newState)) {
      let msg = `Não é possível mover o caso de '${prevState}' para '${newState}'.`
      if (newState === 'cancelado') msg = 'Estado terminal não permite cancelamento'
      if (newState === 'arquivado') msg = 'Estado não permite arquivamento'
      throw new BadRequestError('Rule Violation', {
        estado_caso: new ValidationError('invalid_transition', msg),
      })
    }

    // Role Enforcement Matrix
    if (newState === 'em_qualificacao') {
      if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
    } else if (newState === 'em_preenchimento') {
      if (prevState === 'minuta_gerada') {
        if (!isAdmin) throw new ForbiddenError('Acesso negado: Perfil Admin exigido')
      } else {
        if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
      }
    } else if (newState === 'aguardando_documentos') {
      if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
    } else if (newState === 'em_validacao') {
      if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
    } else if (newState === 'pendente_revisao_juridica') {
      if (prevState === 'minuta_gerada') {
        if (!isAdmin) throw new ForbiddenError('Acesso negado: Perfil Admin exigido')
      } else {
        if (!isGestor) throw new ForbiddenError('Acesso negado: Perfil Gestor exigido')
      }
    } else if (
      newState === 'aprovado' ||
      newState === 'aprovado_ressalvas' ||
      newState === 'bloqueado'
    ) {
      if (!isGestor) throw new ForbiddenError('Acesso negado: Perfil Gestor exigido')
    } else if (newState === 'minuta_gerada') {
      if (!isOperador) throw new ForbiddenError('Acesso negado: Perfil Operador exigido')
    } else if (newState === 'cancelado' || newState === 'arquivado') {
      if (!isAdmin) throw new ForbiddenError('Acesso negado: Perfil Admin exigido')
    }

    // 3. Completeness Matrix
    const caseId = e.record.id

    if (newState === 'em_qualificacao') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Dados básicos faltantes', {
          estado_caso: new ValidationError(
            'validation_error',
            'Informe título e tipo da operação.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState !== 'minuta_gerada') {
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
        throw new BadRequestError('Matrícula não validada', {
          estado_caso: new ValidationError(
            'validation_error',
            'Anexe a matrícula e valide dados do imóvel.',
          ),
        })
      }
    }

    if (newState === 'aguardando_documentos') {
      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const neg = negs.length > 0 ? negs[0] : null

      if (!neg || !neg.getFloat('valor_total') || !neg.getString('forma_pagamento')) {
        throw new BadRequestError('Ficha cadastral pendente', {
          estado_caso: new ValidationError(
            'validation_error',
            'Preencha dados financeiros e anexe a ficha.',
          ),
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
        const allCompleted =
          checklists.length > 0 &&
          checklists.every((c) => c.get('arquivos') && c.get('arquivos').length > 0)

        if (!allCompleted && checklists.length > 0) {
          throw new BadRequestError('Documentação incompleta', {
            estado_caso: new ValidationError(
              'validation_error',
              'Aguardando upload dos documentos das partes.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Documentação incompleta', {
          estado_caso: new ValidationError(
            'validation_error',
            'Aguardando upload dos documentos das partes.',
          ),
        })
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!e.record.getString('parecer') || !e.record.getString('parecer_juridico_file')) {
        throw new BadRequestError('Parecer favorável ausente', {
          parecer: new ValidationError(
            'validation_required',
            'Parecer jurídico obrigatório para prosseguir.',
          ),
        })
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('Regras de ressalva não preenchidas', {
          observacoes: new ValidationError(
            'validation_required',
            'Descreva as ressalvas obrigatórias.',
          ),
        })
      }
      e.record.set('data_aprovacao', new Date().toISOString())
    }

    if (newState === 'bloqueado') {
      if (!e.record.getString('motivo_bloqueio') && !e.record.getString('observacoes')) {
        throw new BadRequestError('Motivo de bloqueio obrigatório', {
          motivo_bloqueio: new ValidationError(
            'validation_required',
            'Justifique o bloqueio do processo.',
          ),
        })
      }
    }

    if (newState === 'cancelado') {
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Motivo de cancelamento obrigatório', {
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'Informe o motivo do cancelamento.',
          ),
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
          estado_caso: new ValidationError(
            'validation_error',
            'Minuta disponível para download é obrigatória.',
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

    // 2. Synchronization Matrix
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
      bloqueado: 'distratado',
      cancelado: 'distratado',
      arquivado: 'distratado',
    }

    const reflexoNegociacao = negMap[newState]

    if (reflexoNegociacao && newState !== 'minuta_gerada') {
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
