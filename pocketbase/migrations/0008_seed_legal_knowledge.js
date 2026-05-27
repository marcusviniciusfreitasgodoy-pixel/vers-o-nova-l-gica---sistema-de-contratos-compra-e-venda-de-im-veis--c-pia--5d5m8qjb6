migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const data = [
      {
        title: 'Código Civil - Compra e Venda (Art. 481 a 504)',
        content:
          'Pelo contrato de compra e venda, um dos contratantes se obriga a transferir o domínio de certa coisa, e o outro, a pagar-lhe certo preço em dinheiro. O preço, se não houver acordo, pode ser deixado ao arbítrio de terceiro.',
        category: 'legislacao',
      },
      {
        title: 'Lei 8.245/1991 - Lei do Inquilinato',
        content:
          'A locação de imóveis urbanos regula-se pelo disposto nesta lei. É obrigatória a previsão de foro competente e qualificação clara e objetiva das partes.',
        category: 'legislacao',
      },
      {
        title: 'Súmula 326 do STJ (Dano Moral e Sucumbência)',
        content:
          'Na ação de indenização por dano moral, a condenação em montante inferior ao postulado na inicial não implica sucumbência recíproca. Atenção ao prever cláusulas penais que desequilibrem a relação contratual.',
        category: 'jurisprudencia',
      },
      {
        title: 'Prática Imobiliária RJ - Foro de Jacarepaguá',
        content:
          'Para negócios envolvendo imóveis situados na Barra da Tijuca, Recreio dos Bandeirantes, Camorim e Vargem Grande, o foro competente padrão recomendado é o Foro Regional de Jacarepaguá da Comarca da Capital do RJ.',
        category: 'boas_praticas',
      },
    ]

    for (const item of data) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', item.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', item.title)
        record.set('content', item.content)
        record.set('category', item.category)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('legal_knowledge')
      app.truncateCollection(col)
    } catch (_) {}
  },
)
