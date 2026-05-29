// Audit trailing, legacy linkage sync (Umbilical Cord) and Authority Maintenance hook.

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const caseId = record.getString('case_id')

  if (caseId) {
    try {
      const caseRecord = $app.findRecordById('cases', caseId)
      const oldState = caseRecord.getString('estado_caso')

      // Authority Maintenance: "cases" module must remain the source of truth for the estado_caso.
      // Removed reverse-sync to enforce strict unidirectional Case -> Negotiation state machine.

      // Soft-Link Integrity: "Umbilical Cord" synchronization.
      const partes = $app.findRecordsByFilter('partes', `case_id = {:caseId}`, '-created', 100, 0, {
        caseId: caseId,
      })
      const negPartesCol = $app.findCollectionByNameOrId('gp_negociacao_partes')

      let linkedPartesCount = 0
      for (const parte of partes) {
        const gpPessoaId = parte.getString('gp_pessoa_id')
        if (gpPessoaId) {
          const negParte = new Record(negPartesCol)
          negParte.set('negociacao_id', record.id)
          negParte.set('pessoa_id', gpPessoaId)

          const legacyPapel = parte.getString('papel_na_operacao')
          let novoPapel = 'outro'
          if (legacyPapel === 'comprador') novoPapel = 'comprador'
          if (legacyPapel === 'vendedor') novoPapel = 'vendedor'
          if (legacyPapel === 'representante') novoPapel = 'procurador'

          negParte.set('papel', novoPapel)
          $app.save(negParte)
          linkedPartesCount++
        }
      }

      $app
        .logger()
        .info(
          'case_history_audit',
          'module',
          'gp_negociacoes',
          'action',
          'created',
          'case_id',
          caseId,
          'negociacao_id',
          record.id,
        )

      try {
        const errLogCol = $app.findCollectionByNameOrId('system_error_logs')
        const logRecord = new Record(errLogCol)
        logRecord.set('error_message', 'Negociação Iniciada')
        logRecord.set('component', 'gp_negociacoes_audit')
        logRecord.set('severity', 'info')
        logRecord.set('context_data', {
          case_id: caseId,
          negociacao_id: record.id,
          action: 'created',
        })
        if (e.auth) logRecord.set('user', e.auth.id)
        $app.save(logRecord)
      } catch (_) {}
      $app
        .logger()
        .info(
          'soft_link_integrity',
          'action',
          'sync_legacy_partes',
          'case_id',
          caseId,
          'partes_migrated',
          linkedPartesCount.toString(),
        )
    } catch (err) {
      $app.logger().error('gp_negociacoes_audit_error', 'error', err.message)
    }
  }

  e.next()
}, 'gp_negociacoes')

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const caseId = record.getString('case_id')

  if (caseId) {
    try {
      const caseRecord = $app.findRecordById('cases', caseId)
      const oldState = caseRecord.getString('estado_caso')
      const estagio = record.getString('estagio')

      // Unidirectional sync strictly enforced: Negotiation does not mutate Case state automatically.

      $app
        .logger()
        .info(
          'case_history_audit',
          'module',
          'gp_negociacoes',
          'action',
          'updated',
          'case_id',
          caseId,
          'negociacao_id',
          record.id,
          'estagio',
          estagio,
        )

      try {
        const errLogCol = $app.findCollectionByNameOrId('system_error_logs')
        const logRecord = new Record(errLogCol)
        logRecord.set('error_message', 'Negociação Atualizada: ' + estagio)
        logRecord.set('component', 'gp_negociacoes_audit')
        logRecord.set('severity', 'info')
        logRecord.set('context_data', {
          case_id: caseId,
          negociacao_id: record.id,
          action: 'updated',
          estagio,
        })
        if (e.auth) logRecord.set('user', e.auth.id)
        $app.save(logRecord)
      } catch (_) {}
    } catch (err) {
      $app.logger().error('gp_negociacoes_audit_error', 'error', err.message)
    }
  }

  e.next()
}, 'gp_negociacoes')
