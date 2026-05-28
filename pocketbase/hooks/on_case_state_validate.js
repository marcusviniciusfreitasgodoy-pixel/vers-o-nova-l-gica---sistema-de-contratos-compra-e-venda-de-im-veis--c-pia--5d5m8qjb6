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
      if (['minuta_gerada', 'arquivado', 'cancelado'].includes(prevState)) {
        throw new BadRequestError('Ação não permitida', {
          estado_caso: new ValidationError(
            'invalid_transition',
            'Não é possível cancelar a partir deste estado.',
          ),
        })
      }
      if (!isGestor) {
        throw new ForbiddenError('Apenas administradores ou gestores podem cancelar casos.')
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

    if (newState === 'em_qualificacao') {
      if (!e.record.getString('title') || !e.record.getString('tipo_operacao')) {
        throw new BadRequestError('Preencha o título e o tipo de operação para avançar.', {
          estado_caso: new ValidationError(
            'validation_error',
            'Preencha o título e o tipo de operação para avançar.',
          ),
        })
      }
    }

    if (newState === 'em_preenchimento' && prevState === 'em_qualificacao') {
      try {
        const imoveis = $app.findRecordsByFilter('imovel', `case_id = '${caseId}'`, '', 1, 0)
        if (
          imoveis.length === 0 ||
          !imoveis[0].getString('endereco_resumido') ||
          !imoveis[0].getString('matricula')
        ) {
          throw new BadRequestError('Informe o endereço e o valor da operação.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Informe o endereço e o valor da operação.',
            ),
          })
        }
        const negs = $app.findRecordsByFilter('gp_negociacoes', `case_id = '${caseId}'`, '', 1, 0)
        if (negs.length === 0 || !negs[0].getFloat('valor_total')) {
          throw new BadRequestError('Informe o endereço e o valor da operação.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Informe o endereço e o valor da operação.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err
        throw new BadRequestError('Informe o endereço e o valor da operação.', {
          estado_caso: new ValidationError(
            'validation_error',
            'Informe o endereço e o valor da operação.',
          ),
        })
      }
    }

    if (newState === 'aguardando_documentos' && prevState === 'em_preenchimento') {
      try {
        const checklists = $app.findRecordsByFilter(
          'gp_doc_checklist',
          `negociacao_id.case_id = '${caseId}'`,
          '',
          100,
          0,
        )
        const hasMatricula = checklists.some(
          (c) =>
            c.getString('categoria_parte') === 'imovel' &&
            c.get('arquivos') &&
            c.get('arquivos').length > 0,
        )
        if (!hasMatricula && checklists.length === 0) {
          throw new BadRequestError('Anexe a matrícula do imóvel para prosseguir.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Anexe a matrícula do imóvel para prosseguir.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
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
          throw new BadRequestError('Existem documentos pendentes no checklist.', {
            estado_caso: new ValidationError(
              'validation_error',
              'Existem documentos pendentes no checklist.',
            ),
          })
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
      }
    }

    if (newState === 'pendente_revisao_juridica' && prevState === 'em_validacao') {
      if (!isOperador) {
        throw new ForbiddenError('Somente operadores podem enviar para o jurídico.')
      }
    }

    if (newState === 'aprovado' || newState === 'aprovado_ressalvas') {
      if (!isGestor) {
        throw new ForbiddenError('Apenas gestores aprovam casos.')
      }
      if (!e.record.getString('parecer')) {
        throw new BadRequestError('O parecer jurídico é obrigatório para aprovação.', {
          parecer: new ValidationError(
            'validation_required',
            'O parecer jurídico é obrigatório para aprovação.',
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
        throw new ForbiddenError('Sem permissão de gestor.')
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
    if (newState === 'em_qualificacao') reflexoNegociacao = 'preliminar'
    if (newState === 'em_preenchimento') reflexoNegociacao = 'preliminar'
    if (newState === 'em_validacao' || newState === 'aprovado' || newState === 'bloqueado')
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
