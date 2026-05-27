onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const status = record.getString('status')

  if (status === 'aceita') {
    try {
      const negId = record.getString('negociacao_id')
      if (negId) {
        const neg = $app.findRecordById('gp_negociacoes', negId)
        const caseId = neg.getString('case_id')

        if (caseId) {
          const caseRecord = $app.findRecordById('cases', caseId)
          const oldState = caseRecord.getString('estado_caso')
          const newState = 'aguardando_documentos'

          if (
            oldState !== newState &&
            oldState !== 'minuta_gerada' &&
            oldState !== 'aprovado' &&
            oldState !== 'cancelado'
          ) {
            caseRecord.set('estado_caso', newState)
            $app.save(caseRecord)

            const col = $app.findCollectionByNameOrId('case_state_transitions')
            const transition = new Record(col)
            transition.set('case', caseId)
            transition.set('user', e.auth?.id || '')
            transition.set('previous_state', oldState)
            transition.set('new_state', newState)
            transition.set('user_role', 'system')
            $app.save(transition)
          }
        }
      }
    } catch (err) {
      $app.logger().error('gp_doc_propostas_audit_error', 'error', err.message)
    }
  }

  e.next()
}, 'gp_doc_propostas')
