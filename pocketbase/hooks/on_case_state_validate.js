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
          ruleBlock: 'Critérios incompletos',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      em_qualificacao: {
        em_preenchimento: {
          role: 'operador',
          ruleBlock: 'Qualificação pendente',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      em_preenchimento: {
        aguardando_documentos: {
          role: 'operador',
          ruleBlock: 'Documento base ausente',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      aguardando_documentos: {
        em_validacao: {
          role: 'operador',
          ruleBlock: 'Contrato não anexado',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      em_validacao: {
        pendente_revisao_juridica: {
          role: 'gestor',
          ruleBlock: 'Aprovação necessária',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      pendente_revisao_juridica: {
        aprovado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico ausente',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        aprovado_ressalvas: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico ausente',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        bloqueado: {
          role: 'gestor',
          ruleBlock: 'Parecer jurídico ausente',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        cancelado: {
          role: 'admin',
          ruleBlock: 'Regra de cancelamento',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      aprovado: {
        minuta_gerada: {
          role: 'operador',
          ruleBlock: 'Falha na geração',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
        arquivado: {
          role: 'admin',
          ruleBlock: 'Transição não permitida',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      aprovado_ressalvas: {
        minuta_gerada: {
          role: 'operador',
          ruleBlock: 'Falha na geração',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      bloqueado: {
        arquivado: {
          role: 'admin',
          ruleBlock: 'Transição não permitida',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sistema',
        },
      },
      minuta_gerada: {
        em_preenchimento: {
          role: 'admin',
          ruleBlock: 'Regra de negócio',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sync',
        },
        pendente_revisao_juridica: {
          role: 'admin',
          ruleBlock: 'Regra de negócio',
          permBlock: 'Acesso negado',
          techMsg: 'Erro de sync',
        },
      },
      arquivado: {},
      cancelado: {},
    }

    const stateRules = TRANSITION_RULES[prevState] || {}

    if (newState === 'cancelado') {
      if (!isAdmin) {
        throw new ForbiddenError('Acesso negado')
      }
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Estado inválido', {
          estado_caso: new ValidationError('invalid_transition', 'Regra de cancelamento'),
        })
      }
    } else {
      const rule = stateRules[newState]
      if (!rule) {
        throw new BadRequestError('Estado inválido', {
          estado_caso: new ValidationError('invalid_transition', 'Transição não permitida'),
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

        const tipoOperacao = e.record.getString('tipo_operacao')
        const requireBuyer = !['autorizacao_venda', 'checklist_documental'].includes(tipoOperacao)

        try {
          const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 100, 0)
          const hasVendedor = partes.some((p) => p.getString('papel_na_operacao') === 'vendedor')
          const hasComprador = partes.some((p) => p.getString('papel_na_operacao') === 'comprador')

          if (!hasVendedor) {
            throw new BadRequestError('Dados incompletos', {
              estado_caso: new ValidationError('validation_error', 'Vendedor não cadastrado'),
            })
          }

          if (requireBuyer && !hasComprador) {
            throw new BadRequestError('Dados incompletos', {
              estado_caso: new ValidationError('validation_error', 'Comprador não cadastrado'),
            })
          }

          const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
          if (imoveis.length === 0) {
            throw new BadRequestError('Dados incompletos', {
              estado_caso: new ValidationError('validation_error', 'Imóvel não cadastrado'),
            })
          }
        } catch (err) {
          if (err instanceof BadRequestError) throw err
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
        if (!e.record.getString('parecer') && !e.record.getString('parecer_juridico_file')) {
          throw new BadRequestError('Estado inválido', {
            estado_caso: new ValidationError('validation_error', rule.ruleBlock),
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

    // 1. Centralized Case Audit
    try {
      const transitionsCol = $app.findCollectionByNameOrId('case_state_transitions')
      const transitionRecord = new Record(transitionsCol)
      transitionRecord.set('case', caseId)

      if (e.auth) {
        transitionRecord.set('user', e.auth.id)
        const role = e.auth.getBool('is_admin') ? 'admin' : e.auth.getString('role') || 'operador'
        transitionRecord.set('user_role', role)
      } else {
        transitionRecord.set('user_role', 'sistema')
      }

      transitionRecord.set('previous_state', prevState)
      transitionRecord.set('new_state', newState)

      $app.saveNoValidate(transitionRecord)
    } catch (err) {
      $app.logger().error('case_transition_log_error', 'case_id', caseId, 'error', err.message)
    }

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
