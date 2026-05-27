migrate(
  (app) => {
    const gp_negociacoes = app.findCollectionByNameOrId('gp_negociacoes')

    const gp_doc_autorizacao = new Collection({
      name: 'gp_doc_autorizacao',
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
          collectionId: gp_negociacoes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'corretor_creci_pf', type: 'text' },
        { name: 'corretor_creci_pj', type: 'text' },
        {
          name: 'tipo_autorizacao',
          type: 'select',
          values: ['com_exclusividade', 'sem_exclusividade'],
          maxSelect: 1,
        },
        { name: 'prazo_vigencia_dias', type: 'number' },
        { name: 'comissao_percentual', type: 'number' },
        { name: 'comissao_valor_fixo', type: 'number' },
        {
          name: 'responsavel_comissao',
          type: 'select',
          values: ['comprador', 'vendedor', 'divididas'],
          maxSelect: 1,
        },
        {
          name: 'momento_pagamento',
          type: 'select',
          values: ['na_promessa', 'na_escritura', 'no_registro'],
          maxSelect: 1,
        },
        { name: 'exclusividade_multa', type: 'json' },
        { name: 'valor_pretendido_imovel', type: 'number' },
        { name: 'autoriza_publicidade', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_autorizacao)

    const gp_doc_ficha_cadastral = new Collection({
      name: 'gp_doc_ficha_cadastral',
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
          collectionId: gp_negociacoes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'origem_captacao',
          type: 'select',
          values: ['indicacao', 'portal', 'prospeccao', 'carteira'],
          maxSelect: 1,
        },
        { name: 'data_captacao', type: 'date' },
        {
          name: 'situacao_ocupacao',
          type: 'select',
          values: ['vago', 'ocupado_proprietario', 'locado'],
          maxSelect: 1,
        },
        {
          name: 'status_ficha',
          type: 'select',
          values: ['incompleta', 'completa', 'validada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_ficha_cadastral)

    const gp_doc_checklist = new Collection({
      name: 'gp_doc_checklist',
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
          collectionId: gp_negociacoes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'momento_exigencia',
          type: 'select',
          values: ['viabilidade_fase1', 'diligencia_fase2'],
          maxSelect: 1,
        },
        {
          name: 'categoria_parte',
          type: 'select',
          values: ['vendedor', 'comprador', 'imovel'],
          maxSelect: 1,
        },
        { name: 'itens', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_checklist)
  },
  (app) => {
    try {
      const gp_doc_checklist = app.findCollectionByNameOrId('gp_doc_checklist')
      app.delete(gp_doc_checklist)
    } catch (_) {}

    try {
      const gp_doc_ficha_cadastral = app.findCollectionByNameOrId('gp_doc_ficha_cadastral')
      app.delete(gp_doc_ficha_cadastral)
    } catch (_) {}

    try {
      const gp_doc_autorizacao = app.findCollectionByNameOrId('gp_doc_autorizacao')
      app.delete(gp_doc_autorizacao)
    } catch (_) {}
  },
)
