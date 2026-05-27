migrate(
  (app) => {
    const gpNegociacoes = app.findCollectionByNameOrId('gp_negociacoes')
    const gpPessoas = app.findCollectionByNameOrId('gp_pessoas')

    // 1. gp_doc_propostas
    const propostas = new Collection({
      name: 'gp_doc_propostas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'negociacao_id',
          type: 'relation',
          required: true,
          collectionId: gpNegociacoes.id,
          maxSelect: 1,
        },
        { name: 'rodada_negociacao', type: 'number' },
        {
          name: 'contraproposta_de',
          type: 'select',
          values: ['vendedor', 'comprador'],
          maxSelect: 1,
        },
        { name: 'valor_ofertado', type: 'number', required: true },
        { name: 'forma_pagamento_proposta', type: 'json' },
        { name: 'prazo_validade_dias', type: 'number' },
        { name: 'condicoes_oferta', type: 'text' },
        { name: 'previsao_sinal', type: 'json' },
        { name: 'prazo_resposta', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['enviada', 'aceita', 'recusada', 'expirada', 'contraproposta'],
          maxSelect: 1,
        },
        { name: 'data_aceite', type: 'date' },
        { name: 'aceite_por', type: 'relation', collectionId: gpPessoas.id, maxSelect: 1 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(propostas)

    // Add self-reference to gp_doc_propostas
    const propostasSaved = app.findCollectionByNameOrId('gp_doc_propostas')
    propostasSaved.fields.add(
      new RelationField({
        name: 'proposta_anterior_id',
        collectionId: propostasSaved.id,
        maxSelect: 1,
      }),
    )
    app.save(propostasSaved)

    // 2. gp_doc_recibo_sinal
    const reciboSinal = new Collection({
      name: 'gp_doc_recibo_sinal',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'negociacao_id',
          type: 'relation',
          required: true,
          collectionId: gpNegociacoes.id,
          maxSelect: 1,
        },
        { name: 'valor_sinal', type: 'number', required: true },
        {
          name: 'forma_recebimento',
          type: 'select',
          values: ['pix', 'ted', 'dinheiro', 'cheque'],
          maxSelect: 1,
        },
        { name: 'data_recebimento', type: 'date', required: true },
        {
          name: 'natureza_valor',
          type: 'select',
          values: ['principio_pagamento', 'arras'],
          maxSelect: 1,
        },
        { name: 'imputa_preco', type: 'bool' },
        { name: 'condicao_devolucao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(reciboSinal)

    // 3. gp_doc_promessa
    const promessa = new Collection({
      name: 'gp_doc_promessa',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'negociacao_id',
          type: 'relation',
          required: true,
          collectionId: gpNegociacoes.id,
          maxSelect: 1,
        },
        {
          name: 'subtipo',
          type: 'select',
          required: true,
          values: ['preliminar_condicional', 'promessa_plena'],
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'sinal_valor', type: 'number' },
        {
          name: 'arras_tipo',
          type: 'select',
          values: ['confirmatorias', 'penitenciais'],
          maxSelect: 1,
        },
        { name: 'arras_base_legal', type: 'text' },
        { name: 'direito_arrependimento', type: 'bool' },
        { name: 'forma_pagamento_detalhe', type: 'json' },
        { name: 'condicoes_suspensivas', type: 'json' },
        { name: 'prazo_implemento_condicao', type: 'number' },
        { name: 'prazo_escritura_dias', type: 'number' },
        { name: 'prazo_cura_mora_dias', type: 'number' },
        { name: 'multa_inadimplemento', type: 'json' },
        { name: 'posse_data_entrega', type: 'date' },
        {
          name: 'posse_condicao',
          type: 'select',
          values: ['na_assinatura', 'na_escritura', 'no_registro'],
          maxSelect: 1,
        },
        { name: 'iptu_responsabilidade', type: 'json' },
        { name: 'condominio_responsabilidade', type: 'json' },
        {
          name: 'despesas_cartorio',
          type: 'select',
          values: ['comprador', 'vendedor', 'divididas'],
          maxSelect: 1,
        },
        {
          name: 'despesas_itbi',
          type: 'select',
          values: ['comprador', 'vendedor', 'divididas'],
          maxSelect: 1,
        },
        { name: 'irretratavel', type: 'bool' },
        { name: 'clausula_registro', type: 'bool' },
        { name: 'foro_eleicao', type: 'text' },
        { name: 'testemunhas', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(promessa)
  },
  (app) => {
    try {
      const promessa = app.findCollectionByNameOrId('gp_doc_promessa')
      app.delete(promessa)
    } catch (_) {}

    try {
      const reciboSinal = app.findCollectionByNameOrId('gp_doc_recibo_sinal')
      app.delete(reciboSinal)
    } catch (_) {}

    try {
      const propostas = app.findCollectionByNameOrId('gp_doc_propostas')
      app.delete(propostas)
    } catch (_) {}
  },
)
