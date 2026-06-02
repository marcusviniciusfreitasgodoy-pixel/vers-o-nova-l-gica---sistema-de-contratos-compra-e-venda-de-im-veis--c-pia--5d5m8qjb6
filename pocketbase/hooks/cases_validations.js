onRecordValidate((e) => {
  const record = e.record
  const isCorretor = record.getString('segmento_operacional') === 'corretor_autonomo'
  const isReciboAutonomo = record.getString('tipo_operacao') === 'recibo_sinal_autonomo'

  if (isReciboAutonomo && !isCorretor) {
    throw new BadRequestError('Validação falhou', {
      tipo_operacao: new ValidationError(
        'validation_error',
        'Recibo de Sinal Autônomo é restrito a Corretor Autônomo.',
      ),
    })
  }

  const estadoCaso = record.getString('estado_caso')
  if (
    estadoCaso &&
    estadoCaso !== 'rascunho' &&
    estadoCaso !== 'cancelado' &&
    estadoCaso !== 'arquivado' &&
    record.id
  ) {
    const tipoOperacao = record.getString('tipo_operacao')
    const requireBuyer = !['autorizacao_venda', 'checklist_documental'].includes(tipoOperacao)

    try {
      const partes = $app.findRecordsByFilter('partes', `case_id = '${record.id}'`, '', 100, 0)
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
    } catch (err) {
      if (err instanceof BadRequestError) throw err
    }
  }

  e.next()
}, 'cases')
