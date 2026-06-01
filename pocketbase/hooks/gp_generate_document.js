routerAdd(
  'POST',
  '/backend/v1/gp/generate-document',
  (e) => {
    const body = e.requestInfo().body
    const negociacaoId = body.negociacaoId
    const tipoDocumento = body.tipoDocumento || 'documento'

    if (!negociacaoId) {
      throw new BadRequestError('negociacaoId is required')
    }

    const neg = $app.findRecordById('gp_negociacoes', negociacaoId)

    const html = `
    <html>
      <body style="font-family: sans-serif; padding: 40px; color: #333;">
        <h2>Documento Gerado (Novo Motor GP)</h2>
        <p><strong>Tipo:</strong> ${tipoDocumento}</p>
        <p><strong>Negociação ID:</strong> ${neg.id}</p>
        <p><strong>Estágio Atual:</strong> ${neg.get('estagio') || 'N/A'}</p>
        <hr style="border: 1px solid #ccc; margin: 20px 0;"/>
        <p>Este documento foi gerado de forma independente do sistema legado, utilizando dados exclusivos do novo fluxo (gp_negociacoes).</p>
      </body>
    </html>
  `

    const file = $filesystem.fileFromBytes(html, tipoDocumento + '.html')

    let record = null
    try {
      const records = $app.findRecordsByFilter(
        'gp_final_documents',
        `negociacao_id = '${negociacaoId}'`,
        '-created',
        100,
        0,
      )
      for (const r of records) {
        const meta = r.get('metadata') || {}
        if (meta.tipoDocumento === tipoDocumento) {
          record = r
          break
        }
      }
    } catch (err) {}

    if (!record) {
      const col = $app.findCollectionByNameOrId('gp_final_documents')
      record = new Record(col)
      record.set('negociacao_id', negociacaoId)
      record.set('status', 'rascunho')
      record.set('plataforma_assinatura', 'Clicksign')
    }

    record.set('arquivo_gerado', file)
    const meta = record.get('metadata') || {}
    meta.tipoDocumento = tipoDocumento
    record.set('metadata', meta)

    $app.save(record)

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
