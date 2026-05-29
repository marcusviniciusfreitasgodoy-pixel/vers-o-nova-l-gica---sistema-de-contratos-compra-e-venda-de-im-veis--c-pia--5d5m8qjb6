onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  if (!original) return e.next()

  const oldState = original.getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (oldState && oldState !== newState) {
    try {
      const col = $app.findCollectionByNameOrId('case_state_transitions')
      const trans = new Record(col)
      trans.set('case', e.record.id)
      trans.set('user', e.auth ? e.auth.id : e.record.getString('responsible'))
      trans.set('previous_state', oldState)
      trans.set('new_state', newState)
      trans.set('user_role', e.auth ? e.auth.getString('role') : 'system')
      $app.save(trans)
    } catch (err) {
      $app
        .logger()
        .error('Failed to log case transition', 'error', err.message, 'caseId', e.record.id)
    }
  }

  e.next()
}, 'cases')
