routerAdd(
  'POST',
  '/backend/v1/contracts/send-signature',
  (e) => {
    const body = e.requestInfo().body
    const contractId = body.contractId
    const sendWhatsApp = body.sendWhatsApp === true

    const contract = $app.findRecordById('contracts', contractId)

    contract.set('status', 'enviado_assinatura')
    $app.save(contract)

    let channel = 'E-mail'
    let phonesSent = []

    if (sendWhatsApp) {
      channel += ' e WhatsApp'
      try {
        const negId = contract.getString('negociacao_id')
        if (negId) {
          const neg = $app.findRecordById('gp_negociacoes', negId)
          const caseId = neg.getString('case_id')
          if (caseId) {
            const partes = $app.findRecordsByFilter('partes', `case_id = "${caseId}"`)
            for (let p of partes) {
              const phone = p.getString('telefone')
              if (phone) phonesSent.push(phone)
            }
            if (phonesSent.length > 0) {
              channel += ` [Notificados: ${phonesSent.join(', ')}]`
            }
          }
        }
      } catch (err) {}
    }

    try {
      const logCol = $app.findCollectionByNameOrId('contract_audit_logs')
      const log = new Record(logCol)
      log.set('user', e.auth?.id || '')
      log.set('contract', contractId)
      log.set('action', 'sent_for_signature')
      log.set(
        'description',
        `Documento enviado para assinatura via ${contract.getString('plataforma_assinatura') || 'Plataforma'}. Canais: ${channel}.`,
      )
      $app.save(log)
    } catch (err) {
      $app.logger().warn('Failed to create audit log', 'error', err.message)
    }

    return e.json(200, { success: true, contract: contract })
  },
  $apis.requireAuth(),
)
