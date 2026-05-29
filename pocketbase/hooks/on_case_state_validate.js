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

    const transitions = {
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
      aprovado: ['minuta_gerada', 'arquivado', 'cancelado'],
      aprovado_ressalvas: ['minuta_gerada', 'arquivado', 'cancelado'],
      bloqueado: ['em_preenchimento', 'cancelado', 'arquivado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica', 'arquivado'],
      cancelado: [],
      arquivado: [],
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

    // Validations based on State Matrix
    if (newState === 'em_qualificacao' && prevState === 'rascunho') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'validation_error',
            'Título e tipo de operação são obrigatórios.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
      const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)
      const endereco =
        (gpImoveis.length > 0 ? gpImoveis[0].getString('endereco_resumido') : '') ||
        (imoveis.length > 0 ? imoveis[0].getString('endereco_resumido') : '')

      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const valorTotal = negs.length > 0 ? negs[0].getFloat('valor_total') : 0

      if (!endereco || !valorTotal) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'validation_error',
            'Endereço e Valor são obrigatórios para avançar.',
          ),
        })
      }
    }

    if (newState === 'aguardando_documentos' && prevState === 'em_preenchimento') {
      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const neg = negs.length > 0 ? negs[0] : null

      if (!neg || !neg.getFloat('valor_total') || !neg.getString('forma_pagamento')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Dados financeiros incompletos.'),
        })
      }

      const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 1, 0)
      const gpPartes = neg
        ? $app.findRecordsByFilter('gp_negociacao_partes', `negociacao_id = '${neg.id}'`, '', 1, 0)
        : []

      if (partes.length === 0 && gpPartes.length === 0) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'validation_error',
            'Complete os dados financeiros e termos.',
          ),
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
            estado_caso: new ValidationError(
              'validation_error',
              'Documentos obrigatórios ausentes.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Documentos obrigatórios ausentes.'),
        })
      }
    }

    // Role-based Access Control
    if (newState === 'pendente_revisao_juridica' && prevState === 'em_validacao') {
      if (!isGestor) throw new ForbiddenError('Apenas gestores validam documentos.')
    }

    if (
      ['aprovado', 'aprovado_ressalvas', 'bloqueado'].includes(newState) &&
      prevState === 'pendente_revisao_juridica'
    ) {
      if (!isGestor) throw new ForbiddenError('Perfil sem autoridade jurídica.')

      if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
        if (!e.record.getString('parecer')) {
          throw new BadRequestError('Rule Violation', {
            parecer: new ValidationError(
              'validation_required',
              newState === 'aprovado'
                ? 'Parecer jurídico positivo obrigatório.'
                : 'Ressalvas devem ser descritas no parecer.',
            ),
          })
        }
        if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
          throw new BadRequestError('Rule Violation', {
            observacoes: new ValidationError(
              'validation_required',
              'Ressalvas devem ser descritas.',
            ),
          })
        }
      }

      if (newState === 'bloqueado') {
        if (!e.record.getString('observacoes')) {
          throw new BadRequestError('Rule Violation', {
            observacoes: new ValidationError(
              'validation_required',
              'Motivo do bloqueio é obrigatório.',
            ),
          })
        }
      }
    }

    if (
      prevState === 'minuta_gerada' &&
      ['em_preenchimento', 'pendente_revisao_juridica'].includes(newState)
    ) {
      if (!isAdmin) throw new ForbiddenError('Apenas Administradores reabrem casos.')
    }

    if (newState === 'cancelado') {
      if (!isAdmin) throw new ForbiddenError('Apenas Administradores cancelam.')
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Rule Violation', {
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'Motivo de cancelamento obrigatório.',
          ),
        })
      }
    }

    if (newState === 'arquivado') {
      if (!isAdmin) throw new ForbiddenError('Acesso restrito ao Administrador.')
      if (!['aprovado', 'aprovado_ressalvas', 'bloqueado'].includes(prevState)) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'validation_error',
            'Apenas estados finais podem ser arquivados.',
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
    let reflexoNegociacao = ''

    if (newState === 'rascunho') reflexoNegociacao = 'captacao'
    if (newState === 'em_qualificacao') reflexoNegociacao = 'preliminar'
    if (
      newState === 'em_preenchimento' ||
      newState === 'aguardando_documentos' ||
      newState === 'em_validacao'
    )
      reflexoNegociacao = 'preliminar'

    if (
      newState === 'pendente_revisao_juridica' ||
      newState === 'aprovado' ||
      newState === 'aprovado_ressalvas' ||
      newState === 'minuta_gerada'
    )
      reflexoNegociacao = 'promessa'

    if (newState === 'cancelado') reflexoNegociacao = 'distratado'
    if (newState === 'arquivado') reflexoNegociacao = 'concluido'

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
