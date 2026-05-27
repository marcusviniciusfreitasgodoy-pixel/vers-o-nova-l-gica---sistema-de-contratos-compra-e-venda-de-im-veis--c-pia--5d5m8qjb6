// Audit trailing, legacy linkage sync (Umbilical Cord) and Authority Maintenance hook.

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const caseId = record.getString('case_id')

  if (caseId) {
    try {
      const caseRecord = $app.findRecordById('cases', caseId)
      const oldState = caseRecord.getString('estado_caso')

      // Authority Maintenance: "cases" module must remain the source of truth for the estado_caso.
      // Automatically advance initial states when a negotiation begins.
      if (oldState === 'rascunho' || oldState === 'em_qualificacao') {
        caseRecord.set('estado_caso', 'em_preenchimento')
        $app.save(caseRecord)

        const col = $app.findCollectionByNameOrId('case_state_transitions')
        const transition = new Record(col)
        transition.set('case', caseId)
        transition.set('user', record.getString('corretor_id') || '')
        transition.set('previous_state', oldState)
        transition.set('new_state', 'em_preenchimento')
        transition.set('user_role', 'system')
        $app.save(transition)
      }

      // Soft-Link Integrity: "Umbilical Cord" synchronization.
      // Pulls existing legacy "partes" containing a gp_pessoa_id and auto-links them
      // into the new gp_negociacao_partes relationship framework.
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

      // Essential Audit Logging linking the new module back to "cases" history.
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

      // Sub-Logging metric for the Maturity Gate verification
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
