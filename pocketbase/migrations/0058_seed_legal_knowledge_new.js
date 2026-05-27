migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const records = [
      {
        title: 'Lei do Distrato - Retenção Padrão (Lei 13.786/2018)',
        content:
          'Em caso de desfazimento do contrato celebrado exclusivamente com o incorporador, a pena convencional não poderá exceder a 25% (vinte e cinco por cento) da quantia paga.',
        category: 'distrato',
        version: 1,
        priority: 100,
        code: 'LEI-DISTRATO-01',
        trigger_logic: '',
      },
      {
        title: 'Lei do Distrato - Patrimônio de Afetação',
        content:
          'Quando a incorporação estiver submetida ao regime do patrimônio de afetação, o incorporador poderá reter até 50% (cinquenta por cento) dos valores pagos.',
        category: 'distrato',
        version: 1,
        priority: 101,
        code: 'LEI-DISTRATO-02',
        trigger_logic: '',
      },
      {
        title: 'Cláusula de Permuta com Torna',
        content:
          'As partes ajustam a permuta dos imóveis descritos no objeto deste contrato. Sendo os imóveis de valores distintos, fica convencionado o pagamento de torna em dinheiro no valor de {{financeiro.valor_torna}} pelo contratante.',
        category: 'permuta',
        version: 1,
        priority: 50,
        code: 'PERMUTA-01',
        trigger_logic: '{"path": "metadata.tipo_negociacao", "operator": "==", "value": "permuta"}',
      },
      {
        title: 'Checklist Documental - Lei 7.433/85',
        content:
          'Documentos exigidos nos termos da Lei nº 7.433/1985 para a lavratura da escritura pública: I - certidão de ônus reais; II - certidão de quitação de tributos imobiliários; III - certidões de feitos ajuizados.',
        category: 'checklist_documental',
        version: 1,
        priority: 10,
        code: 'CHECKLIST-01',
        trigger_logic: '',
      },
    ]

    for (let i = 0; i < records.length; i++) {
      const data = records[i]
      try {
        app.findFirstRecordByData('legal_knowledge', 'code', data.code)
      } catch (_) {
        const record = new Record(col)
        record.set('title', data.title)
        record.set('content', data.content)
        record.set('category', data.category)
        record.set('version', data.version)
        record.set('priority', data.priority)
        record.set('code', data.code)
        record.set('trigger_logic', data.trigger_logic)
        app.save(record)
      }
    }
  },
  (app) => {
    const codes = ['LEI-DISTRATO-01', 'LEI-DISTRATO-02', 'PERMUTA-01', 'CHECKLIST-01']
    for (let i = 0; i < codes.length; i++) {
      try {
        const record = app.findFirstRecordByData('legal_knowledge', 'code', codes[i])
        app.delete(record)
      } catch (_) {}
    }
  },
)
