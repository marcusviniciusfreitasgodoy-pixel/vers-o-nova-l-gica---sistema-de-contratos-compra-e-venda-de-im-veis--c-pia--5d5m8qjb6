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
      aprovado: ['minuta_gerada', 'arquivado', 'cancelado'],
      aprovado_ressalvas: ['minuta_gerada', 'arquivado'],
      bloqueado: ['arquivado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica'],
      cancelado: [],
      arquivado: [],
    }

    const allowed = validTransitions[prevState] || []

    if (!allowed.includes(newState) && newState !== 'cancelado') {
      let msg = `Não é possível mover o caso de '${prevState}' para '${newState}'.`
      if (newState === 'arquivado')
        msg = 'O caso deve estar aprovado ou bloqueado para arquivamento'
      if (newState === 'minuta_gerada') msg = 'O caso deve estar aprovado'
      throw new BadRequestError('Rule Violation', {
        estado_caso: new ValidationError('invalid_transition', msg),
      })
    }

    // Role Enforcement Matrix & Rule Blocks
    let requiredRole = ''
    let blockMsg = ''
    let ruleBlockMsg = ''

    if (newState === 'em_qualificacao') {
      if (!isOperador) {
        requiredRole = 'Operador'
        blockMsg = 'Acesso negado ao Operador.'
      }
      ruleBlockMsg = 'Campos de título e tipo obrigatórios.'
    } else if (newState === 'em_preenchimento') {
      if (prevState === 'minuta_gerada') {
        if (!isAdmin) {
          requiredRole = 'Admin'
          blockMsg = 'Apenas Administrador autorizado.'
        }
      } else {
        if (!isOperador) {
          requiredRole = 'Operador'
          blockMsg = 'Acesso negado ao Operador.'
        }
        ruleBlockMsg = 'Endereço e valor devem ser preenchidos.'
      }
    } else if (newState === 'aguardando_documentos') {
      if (!isOperador) {
        requiredRole = 'Operador'
        blockMsg = 'Acesso negado ao Operador.'
      }
      ruleBlockMsg = 'Dados financeiros incompletos.'
    } else if (newState === 'em_validacao') {
      if (!isOperador) {
        requiredRole = 'Operador'
        blockMsg = 'Acesso negado ao Operador.'
      }
      ruleBlockMsg = 'Contrato_assinado não detectado.'
    } else if (newState === 'pendente_revisao_juridica') {
      if (prevState === 'minuta_gerada') {
        if (!isAdmin) {
          requiredRole = 'Admin'
          blockMsg = 'Apenas Administrador autorizado.'
        }
      } else {
        if (!isGestor) {
          requiredRole = 'Gestor'
          blockMsg = 'Perfil de Gestor exigido.'
        }
        ruleBlockMsg = 'Análise técnica prévia incompleta.'
      }
    } else if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!isGestor) {
        requiredRole = 'Gestor'
        blockMsg = 'Perfil de Gestor exigido.'
      }
      ruleBlockMsg = 'Parecer jurídico obrigatório não anexado.'
    } else if (newState === 'bloqueado') {
      if (!isGestor) {
        requiredRole = 'Gestor'
        blockMsg = 'Perfil de Gestor exigido.'
      }
      ruleBlockMsg = 'Motivo do bloqueio deve ser informado.'
    } else if (newState === 'minuta_gerada') {
      if (!isOperador) {
        requiredRole = 'Operador'
        blockMsg = 'Acesso negado ao Operador.'
      }
      ruleBlockMsg = 'Dados da transação inconsistentes.'
    } else if (newState === 'arquivado') {
      if (!isAdmin) {
        requiredRole = 'Admin'
        blockMsg = 'Perfil de Admin exigido.'
      }
      ruleBlockMsg =
        prevState === 'bloqueado' ? 'O caso deve estar bloqueado.' : 'O caso deve estar aprovado.'
    } else if (newState === 'cancelado') {
      if (!isAdmin) {
        requiredRole = 'Admin'
        blockMsg = 'Perfil de Admin exigido.'
      }
    }

    if (requiredRole) {
      throw new ForbiddenError(blockMsg || `Acesso negado: Perfil ${requiredRole} exigido`)
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
      const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
      const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)

      const hasImovel = gpImoveis.length > 0 || imoveis.length > 0
      if (!hasImovel) {
        throw new BadRequestError('Matrícula não validada', {
          estado_caso: new ValidationError(
            'validation_error',
            'Anexe a matrícula atualizada para validar a qualificação.',
          ),
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
            estado_caso: new ValidationError(
              'validation_error',
              'O contrato assinado (promessa) é obrigatório nesta fase.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Documentação incompleta', {
          estado_caso: new ValidationError(
            'validation_error',
            'O contrato assinado (promessa) é obrigatório nesta fase.',
          ),
        })
      }
    }

    if (newState === 'pendente_revisao_juridica' && prevState !== 'minuta_gerada') {
      if (!e.record.getString('nivel_complexidade')) {
        throw new BadRequestError('Análise técnica incompleta', {
          estado_caso: new ValidationError(
            'validation_error',
            'Aguardando definição de complexidade pelo Gestor.',
          ),
        })
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!e.record.getString('parecer') || !e.record.getString('parecer_juridico_file')) {
        throw new BadRequestError('Parecer favorável ausente', {
          parecer: new ValidationError('validation_required', ruleBlockMsg),
        })
      }
      if (newState === 'aprovado') {
        e.record.set('data_aprovacao', new Date().toISOString())
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('Regras de ressalva não preenchidas', {
          observacoes: new ValidationError(
            'validation_required',
            'Descreva as ressalvas detalhadamente antes de prosseguir.',
          ),
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
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'Informe o motivo do cancelamento para o histórico.',
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
            'A minuta final deve estar disponível para download.',
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
      em_qualificacao: 'proposta',
      em_preenchimento: 'preliminar',
      em_validacao: 'promessa',
      pendente_revisao_juridica: 'promessa',
      aprovado: 'promessa',
      aprovado_ressalvas: 'promessa',
      minuta_gerada: 'definitivo',
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
      } catch (err) {
        $app.logger().error('sync_negociacao_error', 'case_id', caseId, 'error', err.message)
      }
    }
  }

  e.next()
}, 'cases')
