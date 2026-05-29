onRecordAfterUpdateSuccess((e) => {
  const oldState = e.record.original().getString('estado_caso')
  const newState = e.record.getString('estado_caso')

  if (oldState !== newState) {
    const transitionsCol = $app.findCollectionByNameOrId('case_state_transitions')
    const log = new Record(transitionsCol)
    log.set('case', e.record.id)
    if (e.auth) {
      log.set('user', e.auth.id)
      log.set('user_role', e.auth.getString('role'))
    }
    log.set('previous_state', oldState)
    log.set('new_state', newState)
    $app.saveNoValidate(log)
  }
  e.next()
}, 'cases')
