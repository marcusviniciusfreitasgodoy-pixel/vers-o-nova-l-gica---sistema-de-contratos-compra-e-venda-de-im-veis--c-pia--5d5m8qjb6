onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const caseId = record.getString('case_id')
  const authRecord = e.auth

  if (caseId) {
    try {
      const caseRecord = $app.findRecordById('cases', caseId)
      const state = caseRecord.getString('estado_caso')

      $app
        .logger()
        .info(
          'gp_negociacoes updated under case context',
          'negociacao_id',
          record.id,
          'case_id',
          caseId,
          'case_state',
          state,
          'estagio',
          record.getString('estagio'),
          'user_id',
          authRecord ? authRecord.id : 'system',
        )
    } catch (err) {
      $app.logger().error('Failed to find linked case for audit', 'case_id', caseId)
    }
  } else {
    $app
      .logger()
      .info(
        'gp_negociacoes updated without case context',
        'negociacao_id',
        record.id,
        'estagio',
        record.getString('estagio'),
        'user_id',
        authRecord ? authRecord.id : 'system',
      )
  }

  e.next()
}, 'gp_negociacoes')
