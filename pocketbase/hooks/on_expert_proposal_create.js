onRecordAfterCreateSuccess((e) => {
  const reqId = e.record.getString('request')
  if (reqId) {
    try {
      const req = $app.findRecordById('expert_support_requests', reqId)
      req.set('status', 'proposal_issued')
      $app.save(req)
    } catch (err) {
      $app
        .logger()
        .error('Failed to update request status to proposal_issued', 'error', err.message)
    }
  }
  e.next()
}, 'expert_proposals')
