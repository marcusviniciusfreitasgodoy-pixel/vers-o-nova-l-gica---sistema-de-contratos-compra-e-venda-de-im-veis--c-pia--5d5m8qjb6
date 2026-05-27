onRecordAfterUpdateSuccess((e) => {
  if (e.record.getString('content') === 'Processando documento...') return e.next()
  const original = e.record.original()
  const oldText = (original.getString('title') + '\n\n' + original.getString('content')).trim()
  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (text === oldText || !text) return e.next()

  const apiKey = $secrets.get('OPENAI_API_KEY')
  if (!apiKey) return e.next()

  const res = $http.send({
    url: 'https://api.openai.com/v1/embeddings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    timeout: 30,
  })
  if (res.statusCode !== 200) return e.next()

  const record = $app.findRecordById('legal_knowledge', e.record.id)
  record.set('embedding', res.json.data[0].embedding)
  $app.save(record)
  return e.next()
}, 'legal_knowledge')
