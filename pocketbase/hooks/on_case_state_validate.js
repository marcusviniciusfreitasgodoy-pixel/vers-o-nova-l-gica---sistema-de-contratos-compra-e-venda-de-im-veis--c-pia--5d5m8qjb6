// @deps zod@3.23.8
onRecordUpdateRequest((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (prevState && prevState !== newState) {
    const role = e.auth ? e.auth.getString('role') : ''
    const isGlobalAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.getBool('is_admin'))
    const isGestor = role === 'gestor' || isGlobalAdmin

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
      aprovado: ['minuta_gerada', 'arquivado'],
      aprovado_ressalvas: ['minuta_gerada', 'arquivado'],
      bloqueado: ['em_preenchimento', 'cancelado'],
      minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica', 'arquivado'],
      cancelado: ['arquivado'],
      arquivado: [],
    }

    const allowed = transitions[prevState] || []

    if (!allowed.includes(newState) && !isGlobalAdmin) {
      throw new BadRequestError('Rule Violation', {
        estado_caso: new ValidationError(
          'invalid_transition',
          `Não é possível mover o caso de '${prevState}' para '${newState}'.`,
        ),
      })
    }

    const caseId = e.record.id

    // Permissions matrix
    if (
      ['aprovado', 'aprovado_ressalvas', 'bloqueado', 'pendente_revisao_juridica'].includes(
        newState,
      )
    ) {
      if (!isGestor) throw new ForbiddenError('Requer perfil de Gestor.')
    }

    if (newState === 'arquivado') {
      if (!isGlobalAdmin && role !== 'admin') throw new ForbiddenError('Perfil sem permissão.')
    }

    if (
      prevState === 'minuta_gerada' &&
      (newState === 'em_preenchimento' || newState === 'pendente_revisao_juridica')
    ) {
      if (!isGlobalAdmin && role !== 'admin') throw new ForbiddenError('Perfil sem permissão.')
    }

    if (newState === 'cancelado') {
      if (['arquivado', 'minuta_gerada'].includes(prevState)) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError(
            'invalid_transition',
            'Não é possível cancelar a partir deste estado.',
          ),
        })
      }
      if (!isGestor) throw new ForbiddenError('Requer perfil de Gestor.')
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('Rule Violation', {
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'Motivo do cancelamento é obrigatório.',
          ),
        })
      }
    }

    // Rules check
    if (newState === 'em_qualificacao' && prevState === 'rascunho') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Campos obrigatórios ausentes.'),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
      const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)

      const matricula =
        (gpImoveis.length > 0 ? gpImoveis[0].getString('matricula_numero') : '') ||
        (imoveis.length > 0 ? imoveis[0].getString('matricula') : '')

      const endereco =
        (gpImoveis.length > 0 ? gpImoveis[0].getString('endereco_resumido') : '') ||
        (imoveis.length > 0 ? imoveis[0].getString('endereco_resumido') : '')

      if (!matricula && !endereco) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Matrícula do imóvel pendente.'),
        })
      }
    }

    if (newState === 'aguardando_documentos' && prevState === 'em_preenchimento') {
      const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
      const neg = negs.length > 0 ? negs[0] : null

      if (!neg || !neg.getFloat('valor_total') || !neg.getString('forma_pagamento')) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Termos obrigatórios não anexados.'),
        })
      }

      const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 1, 0)
      const gpPartes = neg
        ? $app.findRecordsByFilter('gp_negociacao_partes', `negociacao_id = '${neg.id}'`, '', 1, 0)
        : []

      if (partes.length === 0 && gpPartes.length === 0) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Termos obrigatórios não anexados.'),
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
              'Checklist documental incompleto.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Checklist documental incompleto.'),
        })
      }
    }

    if (newState === 'pendente_revisao_juridica' && prevState === 'em_validacao') {
      const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
      const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)
      const matricula =
        (gpImoveis.length > 0 ? gpImoveis[0].getString('matricula_numero') : '') ||
        (imoveis.length > 0 ? imoveis[0].getString('matricula') : '')

      if (!matricula) {
        throw new BadRequestError('Rule Violation', {
          estado_caso: new ValidationError('validation_error', 'Validação de documentos falhou.'),
        })
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!e.record.getString('parecer')) {
        throw new BadRequestError('Rule Violation', {
          parecer: new ValidationError(
            'validation_required',
            'Parecer jurídico obrigatório ausente.',
          ),
        })
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('Rule Violation', {
          observacoes: new ValidationError(
            'validation_required',
            'Justificativa para ressalva é obrigatória.',
          ),
        })
      }
    }

    if (newState === 'bloqueado' && prevState === 'pendente_revisao_juridica') {
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
    if (newState === 'em_qualificacao') reflexoNegociacao = 'proposta'
    if (newState === 'em_preenchimento' || newState === 'aguardando_documentos')
      reflexoNegociacao = 'preliminar'
    if (
      newState === 'em_validacao' ||
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
