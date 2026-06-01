onRecordDelete((e) => {
  const caseId = e.record.id

  const collections = ['partes', 'imovel', 'gp_negociacoes']
  for (const col of collections) {
    try {
      const records = $app.findRecordsByFilter(col, 'case_id = {:id}', '', 1000, 0, { id: caseId })
      for (const rec of records) {
        try {
          $app.delete(rec)
        } catch (delErr) {
          $app
            .logger()
            .error('Error deleting related record from ' + col, 'id', rec.id, 'err', delErr.message)
        }
      }
    } catch (err) {
      // ignore if no records found
    }
  }

  e.next()
}, 'cases')
