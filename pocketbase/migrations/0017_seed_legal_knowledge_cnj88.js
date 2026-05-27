migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const records = [
      {
        title: 'Provimento CNJ 88/2019 - PLD/FT',
        content:
          'O Provimento nº 88/2019 do Conselho Nacional de Justiça (CNJ) dispõe sobre a política, os procedimentos e os controles a serem adotados pelos notários e registradores visando à prevenção dos crimes de lavagem de dinheiro e do financiamento do terrorismo (PLD/FT). Exige a identificação rigorosa das partes, a qualificação dos beneficiários finais e a comunicação de operações suspeitas ao Conselho de Controle de Atividades Financeiras (COAF), especialmente em transações imobiliárias pagas em espécie, com valores incompatíveis com o patrimônio, ou envolvendo Pessoas Expostas Politicamente (PEP).',
        category: 'legislacao',
      },
      {
        title: 'Manual de Compliance Notarial - Operações Suspeitas',
        content:
          'No âmbito de transações imobiliárias, são consideradas operações suspeitas de lavagem de dinheiro: pagamento de montantes expressivos em espécie; resistência em fornecer informações sobre a origem dos recursos ou sobre os beneficiários finais; transações imobiliárias com valores flagrantemente discrepantes do valor de mercado; uso de empresas de fachada ou testas de ferro; e operações incompatíveis com a capacidade financeira das partes. O contrato deve conter cláusulas declaratórias de licitude dos recursos e ciência do dever de comunicação ao COAF.',
        category: 'boas_praticas',
      },
      {
        title: 'Cláusula Obrigatória PLD/FT (Provimento 88 CNJ)',
        content:
          'Nos contratos de compra e venda de imóveis, deve constar cláusula em que as partes declaram, sob as penas da lei, que os recursos utilizados na transação têm origem lícita e não são fruto de crimes, e que estão cientes de que a operação poderá ser comunicada ao COAF, na forma da Lei nº 9.613/1998 e do Provimento CNJ nº 88/2019.',
        category: 'boas_praticas',
      },
    ]

    for (const data of records) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', data.title)
        continue
      } catch (_) {
        const record = new Record(col)
        record.set('title', data.title)
        record.set('content', data.content)
        record.set('category', data.category)
        app.save(record)
      }
    }
  },
  (app) => {
    const titles = [
      'Provimento CNJ 88/2019 - PLD/FT',
      'Manual de Compliance Notarial - Operações Suspeitas',
      'Cláusula Obrigatória PLD/FT (Provimento 88 CNJ)',
    ]
    for (const title of titles) {
      try {
        const record = app.findFirstRecordByData('legal_knowledge', 'title', title)
        app.delete(record)
      } catch (_) {}
    }
  },
)
