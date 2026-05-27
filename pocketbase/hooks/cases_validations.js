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

  e.next()
}, 'cases')
