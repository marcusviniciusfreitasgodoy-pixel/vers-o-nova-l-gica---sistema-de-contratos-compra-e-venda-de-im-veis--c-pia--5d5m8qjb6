onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const prevState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (
    prevState === 'minuta_gerada' &&
    (newState === 'em_preenchimento' || newState === 'pendente_revisao_juridica')
  ) {
    const caseId = e.record.id
    try {
      const contracts = $app.findRecordsByFilter(
        'contracts',
        `negociacao_id.case_id = '${caseId}'`,
        '',
        100,
        0,
      )
      for (const contract of contracts) {
        if (contract.getString('status') !== 'anulado') {
          contract.set('status', 'anulado')
          $app.saveNoValidate(contract)
        }
      }
    } catch (_) {}
  }

  e.next()
}, 'cases')
