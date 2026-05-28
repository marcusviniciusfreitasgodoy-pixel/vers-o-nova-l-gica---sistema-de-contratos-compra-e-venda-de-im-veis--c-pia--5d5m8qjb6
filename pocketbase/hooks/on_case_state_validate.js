// @deps zod@3.23.8
onRecordUpdateRequest((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (prevState && prevState !== newState) {
    const role = e.auth ? e.auth.getString('role') : ''
    const isGlobalAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.getBool('is_admin'))
    const isGestor = role === 'gestor' || isGlobalAdmin
    const isOperador = role === 'operador' || isGestor

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
        'cancelado',
      ],
      pendente_revisao_juridica: [
        'aprovado',
        'aprovado_ressalvas',
        'em_preenchimento',
        'bloqueado',
        'cancelado',
      ],
      encaminhado_suporte_especializado: ['em_validacao', 'aprovado', 'bloqueado', 'cancelado'],
      aprovado: ['minuta_gerada', 'cancelado'],
      aprovado_ressalvas: ['minuta_gerada', 'em_preenchimento', 'cancelado'],
      bloqueado: ['em_validacao', 'em_preenchimento', 'cancelado'],
      minuta_gerada: ['arquivado', 'cancelado', 'em_preenchimento', 'pendente_revisao_juridica'],
      cancelado: ['arquivado'],
      arquivado: [],
    }

    const allowed = transitions[prevState] || []

    if (!allowed.includes(newState) && !isGlobalAdmin) {
      throw new BadRequestError('Transição de estado inválida', {
        estado_caso: new ValidationError(
          'invalid_transition',
          `Não é possível mover o caso de '${prevState}' para '${newState}'.`,
        ),
      })
    }

    const caseId = e.record.id

    if (newState === 'cancelado') {
      if (['arquivado', 'cancelado'].includes(prevState)) {
        throw new BadRequestError('Ação não permitida', {
          estado_caso: new ValidationError(
            'invalid_transition',
            'Não é possível cancelar a partir deste estado.',
          ),
        })
      }
      if (!isGlobalAdmin) {
        throw new ForbiddenError('Apenas administradores podem cancelar casos.')
      }
      if (!e.record.getString('motivo_cancelamento')) {
        throw new BadRequestError('O motivo de cancelamento é obrigatório.', {
          motivo_cancelamento: new ValidationError(
            'validation_required',
            'O motivo do cancelamento é obrigatório.',
          ),
        })
      }
    }

    if (newState === 'em_qualificacao' && prevState === 'rascunho') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Preencha o título e o tipo de operação para prosseguir.', {
          estado_caso: new ValidationError(
            'validation_error',
            'Preencha o título e o tipo de operação para prosseguir.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      try {
        const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
        const gpImoveis = $app.findRecordsByFilter('gp_imoveis', `case_id = '${caseId}'`, '', 1, 0)

        const endereco =
          (gpImoveis.length > 0 ? gpImoveis[0].getString('endereco_resumido') : '') ||
          (imoveis.length > 0 ? imoveis[0].getString('endereco_resumido') : '')

        const matricula =
          (gpImoveis.length > 0 ? gpImoveis[0].getString('matricula_numero') : '') ||
          (imoveis.length > 0 ? imoveis[0].getString('matricula') : '')

        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
        const valor = negs.length > 0 ? negs[0].getFloat('valor_total') : 0

        if (!endereco || !valor) {
          throw new BadRequestError('Endereço/Valor ausentes', {
            estado_caso: new ValidationError(
              'validation_error',
              'A matrícula do imóvel é obrigatória para qualificação.',
            ),
          })
        }

        if (!matricula) {
          throw new BadRequestError('A matrícula do imóvel é obrigatória para qualificação.', {
            estado_caso: new ValidationError(
              'validation_error',
              'A matrícula do imóvel é obrigatória para qualificação.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err
        throw new BadRequestError('A matrícula do imóvel é obrigatória para qualificação.', {
          estado_caso: new ValidationError(
            'validation_error',
            'A matrícula do imóvel é obrigatória para qualificação.',
          ),
        })
      }
    }

    if (newState === 'aguardando_documentos' && prevState === 'em_preenchimento') {
      try {
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
        const neg = negs.length > 0 ? negs[0] : null

        if (!neg || !neg.getString('forma_pagamento')) {
          throw new BadRequestError('Defina as partes e a forma de pagamento.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Defina as partes e a forma de pagamento.',
            ),
          })
        }

        const partes = $app.findRecordsByFilter('partes', `case_id = '${caseId}'`, '', 1, 0)
        const gpPartes = neg
          ? $app.findRecordsByFilter(
              'gp_negociacao_partes',
              `negociacao_id = '${neg.id}'`,
              '',
              1,
              0,
            )
          : []

        if (partes.length === 0 && gpPartes.length === 0) {
          throw new BadRequestError('Defina as partes e a forma de pagamento.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Defina as partes e a forma de pagamento.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err
        throw new BadRequestError('Defina as partes e a forma de pagamento.', {
          estado_caso: new ValidationError(
            'validation_error',
            'Defina as partes e a forma de pagamento.',
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
        if (!allCompleted) {
          throw new BadRequestError('Anexe todos os documentos listados no checklist.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Anexe todos os documentos listados no checklist.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Anexe todos os documentos listados no checklist.', {
          estado_caso: new ValidationError(
            'validation_error',
            'Anexe todos os documentos listados no checklist.',
          ),
        })
      }
    }

    if (newState === 'pendente_revisao_juridica' && prevState === 'em_validacao') {
      if (!isGestor) {
        throw new ForbiddenError('Perfil insuficiente para validar')
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!isGestor) {
        throw new ForbiddenError('Perfil insuficiente para aprovar')
      }
      if (!e.record.getString('parecer')) {
        throw new BadRequestError('O parecer jurídico é obrigatório para decidir o caso.', {
          parecer: new ValidationError(
            'validation_required',
            'O parecer jurídico é obrigatório para decidir o caso.',
          ),
        })
      }
      if (newState === 'aprovado_ressalvas' && !e.record.getString('observacoes')) {
        throw new BadRequestError('O parecer deve detalhar as ressalvas.', {
          observacoes: new ValidationError(
            'validation_required',
            'O parecer deve detalhar as ressalvas.',
          ),
        })
      }
    }

    if (newState === 'bloqueado' && prevState === 'pendente_revisao_juridica') {
      if (!isGestor) {
        throw new ForbiddenError('Perfil insuficiente para bloquear')
      }
      if (!e.record.getString('observacoes')) {
        throw new BadRequestError('Justifique o bloqueio nas observações.', {
          observacoes: new ValidationError(
            'validation_required',
            'Justifique o bloqueio nas observações.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'bloqueado') {
      if (!isGestor) {
        throw new ForbiddenError('Apenas gestores desbloqueiam.')
      }
    }

    if (newState === 'arquivado' && prevState === 'minuta_gerada') {
      if (!isGestor) {
        throw new ForbiddenError('Perfil insuficiente para arquivar')
      }
    }

    if (
      prevState === 'minuta_gerada' &&
      (newState === 'em_preenchimento' || newState === 'pendente_revisao_juridica')
    ) {
      if (!isGlobalAdmin) {
        throw new ForbiddenError('Apenas administradores podem invalidar minutas.')
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
      newState === 'bloqueado'
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
