onRecordBeforeSaveRequest((e) => {
  const isCreate = e.record.isNew()
  const oldStatus = isCreate ? null : e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (newStatus === 'received' && oldStatus !== 'received') {
    const now = new Date()
    let added = 0
    while (added < 2) {
      now.setDate(now.getDate() + 1)
      if (now.getDay() !== 0 && now.getDay() !== 6) added++
    }
    e.record.set('sla_deadline', now.toISOString().replace('T', ' ').substring(0, 19) + 'Z')
  }

  e.next()
}, 'expert_support_requests')
