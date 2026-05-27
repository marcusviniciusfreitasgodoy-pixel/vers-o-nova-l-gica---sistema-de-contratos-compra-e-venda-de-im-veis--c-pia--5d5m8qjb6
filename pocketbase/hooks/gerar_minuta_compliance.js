routerAdd(
  'POST',
  '/backend/v1/gerar-minuta-compliance',
  (e) => {
    const body = e.requestInfo().body || {}
    const { tipo, ...resto } = body

    let anthropicKey = $secrets.get('ANTHROPIC_API_KEY') || ''
    let openaiKey = $secrets.get('OPENAI_API_KEY') || ''
    let geminiKey = $secrets.get('GEMINI_API_KEY') || ''

    anthropicKey = anthropicKey.replace(/[^\x21-\x7E]/g, '')
    openaiKey = openaiKey.replace(/[^\x21-\x7E]/g, '')
    geminiKey = geminiKey.replace(/[^\x21-\x7E]/g, '')

    if (!anthropicKey && !openaiKey && !geminiKey) {
      $app.logger().error('Missing global AI API keys in Secrets.')
      return e.badRequestError(
        'Configuração do sistema incompleta: Nenhuma chave de API configurada para habilitar a geração por IA.',
      )
    }

    let contextText = ''
    let ragSources = []
    try {
      if (openaiKey) {
        const embedText = `Diretrizes CNJ 88, PLD-FT, lavagem de dinheiro, compliance imobiliário para contrato de ${tipo}`
        const embedRes = $http.send({
          url: 'https://api.openai.com/v1/embeddings',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + openaiKey },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: embedText }),
          timeout: 15,
        })
        if (embedRes.statusCode === 200) {
          const results = $vectors.search(e, 'legal_knowledge', {
            field: 'embedding',
            query: embedRes.json.data[0].embedding,
            k: 5,
          })
          ragSources = results.items || []
        }
      }

      if (ragSources.length === 0) {
        ragSources = $app.findRecordsByFilter(
          'legal_knowledge',
          "category='boas_praticas' || category='legislacao'",
          '-updated',
          5,
          0,
        )
      }

      contextText = ragSources
        .map((r) => r.getString('title') + ': ' + r.getString('content'))
        .join('\n\n')
    } catch (err) {
      $app.logger().warn('RAG error in gerar-minuta-compliance', 'error', err.message)
    }

    const systemPrompt = `Você é um advogado especialista em Direito Imobiliário e Compliance (Provimento CNJ 88/2019).
Gere um(a) ${resto.tipo_documento || 'contrato'} rigorosamente baseado nas informações fornecidas.
É MANDATÓRIO incluir cláusulas específicas de Prevenção à Lavagem de Dinheiro (PLD-FT):
- Declaração de origem lícita dos recursos.
- Qualificação completa e detalhada das partes e beneficiários finais.
- Ciência de que a operação pode e será reportada ao COAF caso suspeita, isentando corretores/imobiliárias de responsabilidade por este reporte legal.

É MANDATÓRIO incluir também, explicitamente, o seguinte texto para LGPD e Assinatura Eletrônica:
"As partes autorizam o tratamento de dados pessoais exclusivamente para execução deste contrato."
"As partes reconhecem como válida a assinatura eletrônica deste instrumento."

Contexto Legal a ser respeitado:
${contextText}

Regras de Formatação Obrigatórias:
1. Geração em TEXTO PURO (Plain Text). É ESTRITAMENTE PROIBIDO o uso de Markdown (como #, ##, **, _, etc). Não use formatação em markdown.
2. Cabeçalho Obrigatório: Inicie com as exatas 3 linhas:
GODOY PRIME REALTY
Assessoria Jurídica Imobiliária
MINUTA DE CONTRATO
3. Numeração Formal: Use numeração ordinal em caixa alta para cláusulas (ex: CLÁUSULA PRIMEIRA - [TÍTULO]).
4. Qualificação das Partes: Rótulos VENDEDOR e COMPRADOR em caixa alta como texto puro.

Retorne APENAS o texto do documento. Sem introduções, sem formatação JSON, apenas o texto puro (plain text) com as quebras de linha necessárias.`

    const userPrompt = `Dados do Contrato preenchidos pelo usuário:\n${JSON.stringify(resto, null, 2)}\n\nEscreva a minuta completa.`

    let generatedText = ''
    let success = false
    let lastErrorMsg = ''

    if (anthropicKey && !success) {
      const aiBody = {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }
      const chatRes = $http.send({
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(aiBody),
        timeout: 120,
      })
      if (chatRes.statusCode === 200) {
        generatedText = chatRes.json.content[0].text
        success = true
      } else {
        lastErrorMsg = chatRes.json?.error?.message || `Anthropic: ${chatRes.statusCode}`
      }
    }

    if (openaiKey && !success) {
      const aiBody = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }
      const chatRes = $http.send({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + openaiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiBody),
        timeout: 120,
      })
      if (chatRes.statusCode === 200) {
        generatedText = chatRes.json.choices[0].message.content
        success = true
      } else {
        lastErrorMsg = chatRes.json?.error?.message || `OpenAI: ${chatRes.statusCode}`
      }
    }

    if (!success) {
      return e.badRequestError('Falha ao gerar minuta por IA. ' + lastErrorMsg)
    }

    const sourcesMapped = ragSources.map((r) => ({
      titulo: r.getString('title'),
      categoria: r.getString('category'),
    }))

    return e.json(200, {
      minuta: generatedText,
      fontes_utilizadas: sourcesMapped,
    })
  },
  $apis.requireAuth(),
)
