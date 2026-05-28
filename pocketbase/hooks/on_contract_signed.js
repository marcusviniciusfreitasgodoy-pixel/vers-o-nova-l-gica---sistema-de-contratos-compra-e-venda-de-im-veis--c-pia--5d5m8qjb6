onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const oldStatus = record.original().getString('status')
  const newStatus = record.getString('status')

  if (newStatus === 'assinado' && oldStatus !== 'assinado') {
    const negociacaoId = record.getString('negociacao_id')
    if (!negociacaoId) return e.next()

    try {
      const negociacao = $app.findRecordById('gp_negociacoes', negociacaoId)
      const caseId = negociacao.getString('case_id')
      if (!caseId) return e.next()

      const partes = $app.findRecordsByFilter('partes', `case_id = "${caseId}"`, '', 100, 0)
      const emails = partes.map((p) => p.getString('e_mail')).filter((e) => e && e.trim() !== '')

      let userId = record.getString('user')
      if (!userId) {
        try {
          const admin = $app.findFirstRecordByFilter('users', 'is_admin=true', '')
          if (admin) userId = admin.id
        } catch (_) {}
      }

      if (emails.length > 0) {
        const assunto = `Documento Assinado - ${record.getString('tipo_documento')}`
        const destinatario = emails.join(', ')

        $app
          .logger()
          .info(
            'Email de documento assinado enviado com sucesso (simulado)',
            'destinatarios',
            destinatario,
            'assunto',
            assunto,
            'contract_id',
            record.id,
          )

        try {
          const log = new Record($app.findCollectionByNameOrId('contract_audit_logs'))
          if (userId) log.set('user', userId)
          log.set('contract', record.id)
          log.set('action', 'email_sent')
          log.set('description', `E-mail de conclusão enviado para: ${destinatario}`)
          log.set('changes', { status: 'assinado', destinatarios: emails })
          $app.save(log)
        } catch (logErr) {
          $app.logger().warn('Erro ao criar log de auditoria', 'err', logErr.message)
        }
      } else {
        $app
          .logger()
          .warn(
            'Não há e-mails cadastrados para as partes deste contrato',
            'case_id',
            caseId,
            'contract_id',
            record.id,
          )
        try {
          const log = new Record($app.findCollectionByNameOrId('contract_audit_logs'))
          if (userId) log.set('user', userId)
          log.set('contract', record.id)
          log.set('action', 'email_failed')
          log.set(
            'description',
            `Falha ao enviar e-mail: Nenhuma parte possui e-mail cadastrado (Caso: ${caseId})`,
          )
          $app.save(log)
        } catch (logErr) {}
      }
    } catch (err) {
      $app.logger().error('Erro na automação de e-mail do contrato', 'err', err.message)
    }
  }

  return e.next()
}, 'contracts')
