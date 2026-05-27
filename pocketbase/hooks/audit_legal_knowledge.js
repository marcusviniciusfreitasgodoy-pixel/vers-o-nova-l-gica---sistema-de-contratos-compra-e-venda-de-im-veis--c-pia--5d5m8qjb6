onRecordAfterCreateSuccess((e) => {
  if (!e.requestInfo() || !e.requestInfo().auth) return e.next()
  const authRecord = e.requestInfo().auth

  const auditCollection = $app.findCollectionByNameOrId('knowledge_audit_logs')
  const log = new Record(auditCollection)
  log.set('user', authRecord.id)
  log.set('knowledge_item', e.record.id)
  log.set('action', 'create')

  const changes = {}
  e.record.collection().fields.forEach((f) => {
    if (f.name !== 'id' && f.name !== 'created' && f.name !== 'updated') {
      changes[f.name] = { new: e.record.get(f.name) }
    }
  })
  log.set('changes', changes)

  $app.saveNoValidate(log)
  return e.next()
}, 'legal_knowledge')

onRecordAfterUpdateSuccess((e) => {
  if (!e.requestInfo() || !e.requestInfo().auth) return e.next()
  const authRecord = e.requestInfo().auth

  const changes = {}
  let hasChanges = false

  e.record.collection().fields.forEach((f) => {
    if (f.name !== 'id' && f.name !== 'created' && f.name !== 'updated') {
      const oldVal = e.record.original().get(f.name)
      const newVal = e.record.get(f.name)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[f.name] = { old: oldVal, new: newVal }
        hasChanges = true
      }
    }
  })

  if (!hasChanges) return e.next()

  const auditCollection = $app.findCollectionByNameOrId('knowledge_audit_logs')
  const log = new Record(auditCollection)
  log.set('user', authRecord.id)
  log.set('knowledge_item', e.record.id)
  log.set('action', 'update')
  log.set('changes', changes)

  $app.saveNoValidate(log)
  return e.next()
}, 'legal_knowledge')

onRecordAfterDeleteSuccess((e) => {
  if (!e.requestInfo() || !e.requestInfo().auth) return e.next()
  const authRecord = e.requestInfo().auth

  const auditCollection = $app.findCollectionByNameOrId('knowledge_audit_logs')
  const log = new Record(auditCollection)
  log.set('user', authRecord.id)
  log.set('knowledge_item', e.record.id)
  log.set('action', 'delete')

  const changes = {}
  e.record.collection().fields.forEach((f) => {
    if (f.name !== 'id' && f.name !== 'created' && f.name !== 'updated') {
      changes[f.name] = { old: e.record.get(f.name) }
    }
  })
  log.set('changes', changes)

  try {
    $app.saveNoValidate(log)
  } catch (err) {
    // ignore
  }
  return e.next()
}, 'legal_knowledge')
