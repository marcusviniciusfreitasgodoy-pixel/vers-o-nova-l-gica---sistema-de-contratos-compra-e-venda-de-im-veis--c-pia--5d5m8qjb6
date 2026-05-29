onRecordUpdateValidate((e) => {
  const oldRecord = e.record.original()
  const newRecord = e.record
  const oldState = oldRecord.getString('estado_caso')
  const newState = newRecord.getString('estado_caso')

  if (oldState !== newState) {
    if (newState === 'aguardando_documentos' && !newRecord.getString('documento_base')) {
      throw new BadRequestError('Bloqueio de Regra', {
        documento_base: new ValidationError(
          'missing_doc',
          'Documento Base obrigatório para avançar.',
        ),
      })
    }
    if (newState === 'em_validacao' && !newRecord.getString('contrato_assinado')) {
      throw new BadRequestError('Bloqueio de Regra', {
        contrato_assinado: new ValidationError(
          'missing_doc',
          'Contrato Assinado obrigatório para validação.',
        ),
      })
    }
    if (
      (newState === 'aprovado' || newState === 'aprovado_ressalvas' || newState === 'bloqueado') &&
      oldState === 'pendente_revisao_juridica'
    ) {
      if (!newRecord.getString('parecer') && !newRecord.getString('parecer_juridico_file')) {
        throw new BadRequestError('Bloqueio de Regra', {
          parecer: new ValidationError(
            'missing_parecer',
            'Parecer Jurídico obrigatório para concluir revisão.',
          ),
        })
      }
    }
  }
  e.next()
}, 'cases')
