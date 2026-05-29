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

    const TRANSITION_RULES = {
      rascunho: {
        em_qualificacao: {
          role: 'operador',
          ruleBlock: 'Preencha dados básicos do caso',
          permBlock: 'Apenas operadores iniciam casos',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      em_qualificacao: {
        em_preenchimento: {
          role: 'operador',
          ruleBlock: 'Dados de qualificação incompletos',
          permBlock: 'Apenas operadores qualificam',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      em_preenchimento: {
        aguardando_documentos: {
          role: 'operador',
          ruleBlock: 'Anexe o documento base primeiro',
          permBlock: 'Acesso negado ao Operador',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      aguardando_documentos: {
        em_validacao: {
          role: 'operador',
          ruleBlock: 'Upload do contrato assinado é obrigatório',
          permBlock: 'Acesso negado',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      em_validacao: {
        pendente_revisao_juridica: {
          role: 'gestor',
          ruleBlock: 'Validação técnica pendente',
          permBlock: 'Apenas Gestores validam contratos',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      pendente_revisao_juridica: {
        aprovado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado ao Gestor',
          techMsg: 'Erro técnico ao mudar estado',
        },
        aprovado_ressalvas: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado',
          techMsg: 'Erro técnico ao mudar estado',
        },
        bloqueado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      aprovado: {
        minuta_gerada: {
          role: 'operador',
          ruleBlock: 'Aprovação prévia necessária',
          permBlock: 'Apenas Operador gera minuta',
          techMsg: 'Erro técnico ao mudar estado',
        },
        arquivado: {
          role: 'admin',
          ruleBlock: 'Apenas casos bloqueados/aprovados',
          permBlock: 'Acesso restrito ao Admin',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      aprovado_ressalvas: {
        minuta_gerada: {
          role: 'operador',
          ruleBlock: 'Aprovação com ressalvas necessária',
          permBlock: 'Apenas Operador gera minuta',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      bloqueado: {
        arquivado: {
          role: 'admin',
          ruleBlock: 'Apenas casos bloqueados/aprovados',
          permBlock: 'Acesso restrito ao Admin',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      minuta_gerada: {
        em_preenchimento: {
          role: 'admin',
          ruleBlock: 'Caso não possui minuta gerada',
          permBlock: 'Apenas Admin autoriza retorno',
          techMsg: 'Erro na sincronização',
        },
        pendente_revisao_juridica: {
          role: 'admin',
          ruleBlock: 'Caso não possui minuta gerada',
          permBlock: 'Apenas Admin autoriza retorno',
          techMsg: 'Erro na sincronização',
        },
      },
      encaminhado_suporte_especializado: {
        em_validacao: {
          role: 'gestor',
          ruleBlock: 'Validação técnica pendente',
          permBlock: 'Apenas Gestores validam contratos',
          techMsg: 'Erro técnico ao mudar estado',
        },
        aprovado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado ao Gestor',
          techMsg: 'Erro técnico ao mudar estado',
        },
        aprovado_ressalvas: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado',
          techMsg: 'Erro técnico ao mudar estado',
        },
        bloqueado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico é obrigatório',
          permBlock: 'Acesso negado',
          techMsg: 'Erro técnico ao mudar estado',
        },
      },
      arquivado: {},
      cancelado: {},
    }

    const stateRules = TRANSITION_RULES[prevState] || {}

    if (newState === 'cancelado') {
      if (!isAdmin) {
        throw new ForbiddenError('Apenas administradores cancelam.')
      }
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Estado inválido', {
          estado_caso: new ValidationError(
            'invalid_transition',
            'Informe o motivo do cancelamento.',
          ),
        })
      }
    } else {
      const rule = stateRules[newState]
      if (!rule) {
        throw new BadRequestError('Estado inválido', {
          estado_caso: new ValidationError(
            'invalid_transition',
            'Transição de estado não permitida.',
          ),
        })
      }

      let hasRole = false
      if (rule.role === 'admin') hasRole = isAdmin
      else if (rule.role === 'gestor') hasRole = isGestor
      else if (rule.role === 'operador') hasRole = isOperador

      if (!hasRole) {
        throw new ForbiddenError(rule.permBlock)
      }

      const caseId = e.record.id

      if (newState === 'em_qualificacao') {
        if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
          })
        }
      }

      if (newState === 'em_preenchimento' && prevState !== 'minuta_gerada') {
        if (!e.record.getString('segmento_operacional') || !e.record.getString('priority')) {
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
          })
        }
      }

      if (newState === 'aguardando_documentos') {
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
        const neg = negs.length > 0 ? negs[0] : null
        if (!neg || !neg.getFloat('valor_total') || !neg.getString('forma_pagamento')) {
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
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
            throw new BadRequestError('Dados incompletos', {
              estado_caso: new ValidationError('validation_error', rule.ruleBlock),
            })
          }
        } catch (err) {
          if (err instanceof BadRequestError) throw err
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
          })
        }
      }

      if (newState === 'pendente_revisao_juridica' && prevState !== 'minuta_gerada') {
        if (!e.record.getString('nivel_complexidade')) {
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
          })
        }
      }

      if (
        newState === 'aprovado' ||
        newState === 'aprovado_ressalvas' ||
        newState === 'bloqueado'
      ) {
        if (!e.record.getString('parecer') || !e.record.getString('parecer_juridico_file')) {
          throw new BadRequestError('Dados incompletos', {
            parecer: new ValidationError('validation_required', rule.ruleBlock),
          })
        }
        if (newState === 'aprovado') {
          e.record.set('data_aprovacao', new Date().toISOString())
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
          throw new BadRequestError('Dados incompletos', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
          })
        }
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
