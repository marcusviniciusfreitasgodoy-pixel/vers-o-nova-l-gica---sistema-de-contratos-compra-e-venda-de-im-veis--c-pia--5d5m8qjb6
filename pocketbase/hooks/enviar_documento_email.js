routerAdd(
  'POST',
  '/backend/v1/enviar_documento_email',
  (e) => {
    const body = e.requestInfo().body
    const { destinatario, assunto, mensagem, contract_id } = body

    if (!destinatario || !assunto) {
      return e.badRequestError('Destinatário e assunto são obrigatórios.')
    }

    // Simulate sending email by logging it
    $app
      .logger()
      .info(
        'Email enviado com sucesso (simulado)',
        'destinatario',
        destinatario,
        'assunto',
        assunto,
        'contract_id',
        contract_id,
      )

    return e.json(200, { success: true, message: 'E-mail enviado com sucesso.' })
  },
  $apis.requireAuth(),
)
