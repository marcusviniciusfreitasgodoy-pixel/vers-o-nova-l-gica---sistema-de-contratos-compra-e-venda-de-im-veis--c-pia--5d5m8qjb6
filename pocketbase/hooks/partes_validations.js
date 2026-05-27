onRecordValidate((e) => {
  const record = e.record
  const tipo = record.getString('tipo_da_parte')
  const doc = record.getString('documento')
  const email = record.getString('e_mail')

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError('E-mail inválido', {
      e_mail: new ValidationError('validation_invalid_email', 'E-mail inválido.'),
    })
  }

  if (doc) {
    const digits = doc.replace(/\D/g, '')
    if (tipo === 'pessoa_fisica' && digits.length !== 11) {
      throw new BadRequestError('CPF inválido', {
        documento: new ValidationError('validation_invalid_cpf', 'CPF deve ter 11 dígitos.'),
      })
    }
    if (tipo === 'pessoa_juridica' && digits.length !== 14) {
      throw new BadRequestError('CNPJ inválido', {
        documento: new ValidationError('validation_invalid_cnpj', 'CNPJ deve ter 14 dígitos.'),
      })
    }
  }

  e.next()
}, 'partes')
