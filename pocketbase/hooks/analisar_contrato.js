routerAdd(
  'POST',
  '/backend/v1/analisar-contrato',
  (e) => {
    const body = e.requestInfo().body || {}
    let arquivo = body.arquivo || ''
    const tipo = (body.tipo || '').toLowerCase()
    const tipoContrato = body.tipoContrato || 'outro'
    const contractId = body.contractId || null
    const fileName = body.fileName || ''
    const adaptiveThought = body.adaptiveThought === true

    try {
      if (arquivo.includes('base64,')) {
        arquivo = arquivo.split('base64,')[1]
      }

      if (tipo === 'txt') {
        arquivo = arquivo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        arquivo = arquivo.replace(/[═─━│┃┄┅┆┇┈┉╌╍╎╏║╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀]/g, ' ')
        arquivo = arquivo.replace(/={2,}/g, ' ')
        arquivo = arquivo.replace(/\s{2,}/g, ' ').trim()
      }

      let anthropicKey = $secrets.get('ANTHROPIC_API_KEY') || ''
      let openaiKey = $secrets.get('OPENAI_API_KEY') || ''
      let geminiKey = $secrets.get('GEMINI_API_KEY') || ''

      anthropicKey = anthropicKey.replace(/[^\x21-\x7E]/g, '')
      openaiKey = openaiKey.replace(/[^\x21-\x7E]/g, '')
      geminiKey = geminiKey.replace(/[^\x21-\x7E]/g, '')

      if (!anthropicKey && !openaiKey && !geminiKey) {
        $app.logger().error('Missing global AI API keys in Secrets.')
        return e.badRequestError(
          'Configuração do sistema incompleta: Nenhuma chave de API de IA configurada nos segredos globais.',
        )
      }

      let contextText = ''
      let ragSources = []
      try {
        if (openaiKey) {
          const embedText = `Contrato do tipo: ${tipoContrato}. Diretrizes CNJ 88, PLD-FT, lavagem de dinheiro, compliance imobiliário.`
          const embedRes = $http.send({
            url: 'https://api.openai.com/v1/embeddings',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + openaiKey,
              'Cache-Control': 'no-cache',
            },
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
          ragSources = $app.findRecordsByFilter('legal_knowledge', '', '-updated', 10, 0)
        }

        contextText = ragSources
          .map((r) => r.getString('title') + ': ' + r.getString('content'))
          .join('\n\n')
      } catch (err) {
        $app.logger().warn('Falha ao buscar base de conhecimento', 'error', err.message)
      }

      const systemPrompt = `Você é um Assistente Jurídico de IA especializado em Direito Imobiliário Brasileiro, Compliance e PLD-FT.
Analise o contrato fornecido (${tipoContrato}) considerando a legislação (Código Civil, STJ, TJRJ), as diretrizes do Provimento CNJ 88/2019 (Prevenção à Lavagem de Dinheiro) e os Padrões de Alta Rigorosidade da Godoy Prime Realty.

INSTRUÇÕES CRÍTICAS DE AVALIAÇÃO:
1. DOCUMENTAÇÃO EXAUSTIVA E PRAZO: Verifique se o contrato exige a lista COMPLETA de certidões e se há prazo para apresentação (ex: 10 dias). As certidões do vendedor e imóvel exigidas são: CNDT, Feitos Ajuizados (Federal, Estadual, Trabalhista), Protestos, Objeto e Pé, Ônus Reais, Quitação Fiscal/IPTU e Quitação Condominial. Se a lista estiver completa e o prazo presente, aponte como "conforme". Se faltar algum item, aponte a omissão.
2. CLÁUSULA DE FINANCIAMENTO: Se houver indícios de financiamento bancário, DEVE existir cláusula que responsabilize o COMPRADOR pela obtenção do crédito e estipule obrigação de quitar com recursos próprios (ex: prazo de 30 dias) em caso de negativa. Atrasos burocráticos do banco não isentam o comprador, salvo culpa do vendedor. Se esta cláusula existir dessa exata forma, está "conforme".
3. PREVENÇÃO À LAVAGEM DE DINHEIRO (PLD-FT): Verifique rigorosamente se há cláusulas que declarem a licitude da origem dos recursos e a ciência das partes sobre possíveis comunicações ao COAF (conforme Provimento CNJ 88/2019). A ausência dessa cláusula é considerada uma OMISSÃO CRÍTICA (status "critico" ou "risco"). Avalie também se há indícios de operações suspeitas (ex: pagamento de altos valores em espécie sem justificativa) que elevem o risco da operação para "critico".
4. NÃO ABREVIES CLÁUSULAS: A integridade legal exige precisão. Cláusulas de posse, obrigações, penalidades e rescisão devem ser robustas. Se o contrato apresentar o texto padrão da Godoy Prime Realty, considere-o 100% em conformidade.
5. IMPORTANTE: Não retorne "crítico" ou "risco" para contratos que sigam rigorosamente as instruções 1, 2 e 3. Se o texto gerado estiver de acordo com o padrão estabelecido, o status deve ser "conforme" sem falsos positivos.
6. ALERTA COAF: Se identificar indícios de "Operação Suspeita" conforme regras de PLD-FT, defina "alerta_coaf": true.

Contexto Jurídico (RAG):
${contextText}

Responda ESTRITAMENTE no seguinte formato JSON (sem markdown de bloco de código):
{
  "conformidade": "conforme|risco|critico",
  "clausulas_encontradas": ["string"],
  "clausulas_faltando": ["string"],
  "riscos": [
    {
      "titulo": "string",
      "descricao": "string",
      "severidade": "ALTO|MEDIO|BAIXO",
      "embasamento": "string"
    }
  ],
  "omissoes": [
    {
      "clausula": "string",
      "importancia": "CRITICA|IMPORTANTE|RECOMENDADA",
      "redacaoPadrao": "string"
    }
  ],
  "clausulas_abusivas": [
    {
      "texto": "string",
      "motivo": "string",
      "recomendacao": "string"
    }
  ],
  "recomendacoes": {
    "imediatas": ["string"],
    "recomendadas": ["string"]
  },
  "alerta_coaf": false,
  "relatorio_completo": "string"
}`

      let extractedText = ''

      if (tipo === 'imagem' || tipo === 'image') {
        let extracted = false
        let extractErr = 'Nenhum provedor disponível'

        if (anthropicKey && !extracted) {
          const imgBody = {
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 8192,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/jpeg',
                      data: arquivo,
                    },
                  },
                  {
                    type: 'text',
                    text: 'Extraia o texto legível desta imagem. Retorne apenas o texto.',
                  },
                ],
              },
            ],
          }

          let extractRes = $http.send({
            url: 'https://api.anthropic.com/v1/messages',
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify(imgBody),
            timeout: 60,
          })

          if (extractRes.statusCode !== 200) {
            imgBody.model = 'claude-3-haiku-20241022'
            extractRes = $http.send({
              url: 'https://api.anthropic.com/v1/messages',
              method: 'POST',
              headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify(imgBody),
              timeout: 60,
            })
          }

          if (extractRes.statusCode === 200) {
            extractedText = extractRes.json.content[0].text
            extracted = true
          } else {
            extractErr = extractRes.json?.error?.message || 'Anthropic falhou'
          }
        }

        if (openaiKey && !extracted) {
          const imgBody = {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extraia o texto legível desta imagem. Retorne apenas o texto.',
                  },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${arquivo}` } },
                ],
              },
            ],
            max_tokens: 4096,
          }
          const extractRes = $http.send({
            url: 'https://api.openai.com/v1/chat/completions',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + openaiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(imgBody),
            timeout: 60,
          })
          if (extractRes.statusCode === 200) {
            extractedText = extractRes.json.choices[0].message.content
            extracted = true
          } else {
            extractErr = extractRes.json?.error?.message || 'OpenAI falhou'
          }
        }

        if (geminiKey && !extracted) {
          const imgBody = {
            contents: [
              {
                parts: [
                  { text: 'Extraia o texto legível desta imagem. Retorne apenas o texto.' },
                  { inline_data: { mime_type: 'image/jpeg', data: arquivo } },
                ],
              },
            ],
          }
          const extractRes = $http.send({
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imgBody),
            timeout: 60,
          })
          if (extractRes.statusCode === 200 && extractRes.json.candidates?.length > 0) {
            extractedText = extractRes.json.candidates[0].content.parts[0].text
            extracted = true
          } else {
            extractErr = extractRes.json?.error?.message || 'Gemini falhou'
          }
        }

        if (!extracted) {
          throw new Error(`Falha na extração de texto da imagem: ${extractErr}`)
        }
      } else if (tipo === 'txt') {
        extractedText = arquivo
      } else {
        try {
          const atobFn =
            typeof atob !== 'undefined'
              ? atob
              : (str) => {
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                  let output = ''
                  str = String(str).replace(/[=]+$/, '')
                  for (
                    let bc = 0, bs, buffer, idx = 0;
                    (buffer = str.charAt(idx++));
                    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
                      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                      : 0
                  ) {
                    buffer = chars.indexOf(buffer)
                  }
                  return output
                }
          const binStr = atobFn(arquivo)
          try {
            extractedText = decodeURIComponent(escape(binStr))
          } catch (err) {
            extractedText = binStr
          }
        } catch (e) {
          extractedText = arquivo
        }
      }

      if (extractedText.length > 200000) {
        extractedText = extractedText.substring(0, 200000)
      }

      let analysisResult = null
      let usedModel = ''
      let success = false
      let lastErrorMsg = 'Falha na comunicação com os serviços de IA.'

      const tryParse = (content, modelName) => {
        try {
          let clean = content
          if (content.includes('```json')) {
            clean = content.split('```json')[1].split('```')[0]
          } else if (content.includes('```')) {
            clean = content.split('```')[1].split('```')[0]
          }
          let parsed = JSON.parse(clean.trim())

          analysisResult = {
            conformidade: {
              status:
                typeof parsed.conformidade === 'string'
                  ? parsed.conformidade
                  : parsed.conformidade?.status || 'conforme',
              clausulasEncontradas:
                parsed.clausulas_encontradas || parsed.clausulasEncontradas || [],
              clausulasFaltando: parsed.clausulas_faltando || parsed.clausulasFaltando || [],
            },
            riscos: parsed.riscos || [],
            omissoes: parsed.omissoes || parsed.omissoesImportantes || [],
            clausulasAbusivas: parsed.clausulas_abusivas || parsed.clausulasAbusivas || [],
            recomendacoes: parsed.recomendacoes || { imediatas: [], recomendadas: [] },
            alerta_coaf: !!parsed.alerta_coaf,
          }

          analysisResult.usedModel = modelName
          usedModel = modelName
          success = true
          return true
        } catch (parseErr) {
          $app.logger().error('JSON Parse failed', 'model', modelName, 'error', parseErr.message)
          return false
        }
      }

      const finalSystemPrompt =
        systemPrompt +
        (adaptiveThought
          ? '\n\nINSTRUÇÃO ADICIONAL: Modo de Pensamento Adaptativo Ativado. Realize uma auditoria profunda, raciocinando meticulosamente sobre cada cláusula e buscando potenciais riscos ocultos ou omissões sutis com o máximo rigor possível.'
          : '')

      // 1. Anthropic Fallback
      if (anthropicKey && !success) {
        let m = 'claude-3-5-sonnet-latest'
        const aiBody = {
          model: m,
          max_tokens: adaptiveThought ? 8192 : 4096,
          system: finalSystemPrompt,
          temperature: 1.0,
          messages: [
            {
              role: 'user',
              content: `Analise este contrato (${tipoContrato}):\n\n${extractedText}`,
            },
          ],
        }

        let chatRes = $http.send({
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify(aiBody),
          timeout: 180,
        })

        if (chatRes.statusCode !== 200) {
          m = 'claude-3-haiku-20241022'
          aiBody.model = m
          chatRes = $http.send({
            url: 'https://api.anthropic.com/v1/messages',
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify(aiBody),
            timeout: 180,
          })
        }

        if (chatRes.statusCode === 200) {
          let content = chatRes.json.content[0].text
          tryParse(content, m)
        } else {
          lastErrorMsg = `Anthropic falhou: ${chatRes.json?.error?.message || `HTTP ${chatRes.statusCode}`}`
          $app
            .logger()
            .warn('Anthropic attempt failed', 'status', chatRes.statusCode, 'msg', lastErrorMsg)
        }
      }

      // 2. OpenAI Fallback
      if (openaiKey && !success) {
        let m = 'gpt-4o-mini'
        const aiBody = {
          model: m,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            {
              role: 'user',
              content: `Analise este contrato (${tipoContrato}):\n\n${extractedText}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 1.0,
        }

        let chatRes = $http.send({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + openaiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(aiBody),
          timeout: 180,
        })

        if (chatRes.statusCode === 200) {
          let content = chatRes.json.choices[0].message.content
          tryParse(content, m)
        } else {
          lastErrorMsg = `OpenAI falhou: ${chatRes.json?.error?.message || `HTTP ${chatRes.statusCode}`}`
          $app
            .logger()
            .warn('OpenAI attempt failed', 'status', chatRes.statusCode, 'msg', lastErrorMsg)
        }
      }

      // 3. Gemini Fallback
      if (geminiKey && !success) {
        let m = 'gemini-1.5-flash'
        const geminiPrompt = `System: ${finalSystemPrompt}\n\nUser: Analise este contrato (${tipoContrato}):\n\n${extractedText}`
        const aiBody = {
          contents: [{ role: 'user', parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 1.0,
            responseMimeType: 'application/json',
          },
        }

        let chatRes = $http.send({
          url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(aiBody),
          timeout: 180,
        })

        if (chatRes.statusCode === 200 && chatRes.json.candidates?.length > 0) {
          let content = chatRes.json.candidates[0].content.parts[0].text
          tryParse(content, m)
        } else {
          lastErrorMsg = `Gemini falhou: ${chatRes.json?.error?.message || `HTTP ${chatRes.statusCode}`}`
          $app
            .logger()
            .warn('Gemini attempt failed', 'status', chatRes.statusCode, 'msg', lastErrorMsg)
        }
      }

      if (!success) {
        return e.badRequestError(
          `Nenhum provedor de IA configurado obteve sucesso. Último erro: ${lastErrorMsg}`,
        )
      }

      if (!analysisResult) {
        return e.internalServerError('Falha no processamento do resultado da análise.')
      }

      // Inject RAG sources into the result
      analysisResult.rag_sources = ragSources.map((r) => ({
        titulo: r.getString('title'),
        categoria: r.getString('category'),
      }))

      try {
        const reportsCol = $app.findCollectionByNameOrId('analysis_reports')
        const reportRecord = new Record(reportsCol)
        reportRecord.set('user', e.auth.id)
        if (contractId) {
          reportRecord.set('contract', contractId)
        }
        if (fileName) {
          reportRecord.set('file_name', fileName)
        }
        reportRecord.set('analysis_result', analysisResult)

        let summaryText = ''
        if (analysisResult.conformidade) {
          const statusVal = analysisResult.conformidade.status || 'desconhecido'
          summaryText = `Status geral: ${statusVal}. Riscos: ${analysisResult.riscos ? analysisResult.riscos.length : 0}`
        }
        reportRecord.set('summary', summaryText)

        let risk = 'baixo'
        if (analysisResult.conformidade) {
          const s = (analysisResult.conformidade.status || '').toLowerCase()
          if (s === 'critico' || s === 'crítico' || s === 'crítica') risk = 'critico'
          else if (s === 'risco' || s === 'alto') risk = 'alto'
          else risk = 'baixo'
        }
        reportRecord.set('risk_level', risk)

        $app.save(reportRecord)
        analysisResult.reportId = reportRecord.id
      } catch (saveErr) {
        $app.logger().error('Erro ao salvar report', 'err', saveErr.message)
      }

      return e.json(200, analysisResult)
    } catch (err) {
      $app.logger().error('Erro na rota analisar-contrato', 'error', err.message)
      const errorMsg =
        err.message.startsWith('[') || err.message.includes('Falha')
          ? err.message
          : 'Não consegui analisar o contrato. Verifique o arquivo e as chaves de API.'
      return e.badRequestError(errorMsg)
    }
  },
  $apis.requireAuth(),
  $apis.bodyLimit(20 * 1024 * 1024),
)
