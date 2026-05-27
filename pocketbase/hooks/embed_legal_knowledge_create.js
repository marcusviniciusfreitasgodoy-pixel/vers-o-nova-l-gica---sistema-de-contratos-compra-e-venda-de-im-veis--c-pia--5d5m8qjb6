onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('content') === 'Processando documento...') return e.next()
  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (!text) return e.next()
  const apiKey = $secrets.get('OPENAI_API_KEY')
  if (!apiKey) {
    $app.logger().warn('OPENAI_API_KEY missing for embedding', 'record', e.record.id)
    return e.next()
  }
  const res = $http.send({
    url: 'https://api.openai.com/v1/embeddings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    timeout: 30,
  })
  if (res.statusCode !== 200) {
    $app.logger().error('Embedding failed', 'status', res.statusCode, 'raw', res.raw)
    return e.next()
  }
  const record = $app.findRecordById('legal_knowledge', e.record.id)
  record.set('embedding', res.json.data[0].embedding)
  $app.save(record)
  return e.next()
}, 'legal_knowledge')
