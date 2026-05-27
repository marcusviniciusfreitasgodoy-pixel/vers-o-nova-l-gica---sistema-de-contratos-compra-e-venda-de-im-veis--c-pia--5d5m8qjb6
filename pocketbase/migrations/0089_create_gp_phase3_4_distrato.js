migrate(
  (app) => {
    const gp_doc_contrato_forca_escritura = new Collection({
      name: 'gp_doc_contrato_forca_escritura',
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
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'credor_fiduciario_id',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('gp_pessoas').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'valor_financiado', type: 'number', required: false },
        { name: 'valor_recursos_proprios', type: 'number', required: false },
        { name: 'numero_parcelas', type: 'number', required: false },
        { name: 'taxa_juros_aa', type: 'number', required: false },
        {
          name: 'indice_correcao',
          type: 'select',
          required: false,
          values: ['tr', 'ipca', 'igpm', 'outro'],
          maxSelect: 1,
        },
        {
          name: 'sistema_amortizacao',
          type: 'select',
          required: false,
          values: ['sac', 'price'],
          maxSelect: 1,
        },
        { name: 'garantia_fiduciaria_valor', type: 'number', required: false },
        { name: 'clausula_execucao_extrajudicial', type: 'text', required: false },
        { name: 'base_legal_forca_escritura', type: 'text', required: false },
        { name: 'seguros_obrigatorios', type: 'json', required: false },
        { name: 'despesas_itbi', type: 'text', required: false },
        { name: 'despesas_registro', type: 'text', required: false },
        { name: 'cartorio_registro', type: 'text', required: false },
        { name: 'foro_eleicao', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_contrato_forca_escritura)

    const gp_doc_minuta_escritura = new Collection({
      name: 'gp_doc_minuta_escritura',
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
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'promessa_origem_id',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('gp_doc_promessa').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'valor_transacao', type: 'number', required: true },
        { name: 'forma_quitacao', type: 'text', required: false },
        { name: 'declaracao_quitacao', type: 'bool', required: false },
        { name: 'valor_venal_itbi', type: 'number', required: false },
        { name: 'guia_itbi_numero', type: 'text', required: false },
        { name: 'tabelionato_destino', type: 'text', required: false },
        { name: 'cartorio_registro', type: 'text', required: false },
        {
          name: 'status_minuta',
          type: 'select',
          required: false,
          values: ['rascunho', 'revisada', 'enviada_cartorio'],
          maxSelect: 1,
        },
        { name: 'certidoes_anexas', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_minuta_escritura)

    const gp_doc_termo_chaves = new Collection({
      name: 'gp_doc_termo_chaves',
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
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_entrega', type: 'date', required: true },
        { name: 'estado_conservacao', type: 'text', required: false },
        { name: 'leitura_agua', type: 'text', required: false },
        { name: 'leitura_luz', type: 'text', required: false },
        { name: 'leitura_gas', type: 'text', required: false },
        { name: 'transferencia_taxas_data', type: 'date', required: false },
        { name: 'vistoria_anexa', type: 'json', required: false },
        { name: 'itens_entregues', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_termo_chaves)

    const gp_doc_termo_posse = new Collection({
      name: 'gp_doc_termo_posse',
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
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_imissao_posse', type: 'date', required: true },
        {
          name: 'tipo_posse',
          type: 'select',
          required: false,
          values: ['direta_livre', 'com_locatario'],
          maxSelect: 1,
        },
        { name: 'imovel_locado', type: 'bool', required: false },
        { name: 'dados_locacao', type: 'json', required: false },
        { name: 'responsabilidades_transferidas', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_termo_posse)

    const gp_doc_distrato = new Collection({
      name: 'gp_doc_distrato',
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
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'contrato_origem_tipo',
          type: 'select',
          required: false,
          values: ['recibo', 'preliminar', 'promessa', 'forca_escritura'],
          maxSelect: 1,
        },
        { name: 'contrato_origem_id', type: 'text', required: false },
        { name: 'motivo', type: 'text', required: false },
        { name: 'valores_pagos', type: 'number', required: false },
        { name: 'valor_devolver', type: 'number', required: false },
        { name: 'valor_reter', type: 'number', required: false },
        { name: 'prazo_devolucao', type: 'date', required: false },
        { name: 'quitacao_mutua', type: 'bool', required: false },
        { name: 'foro_eleicao', type: 'text', required: false },
        { name: 'base_legal_retencao', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gp_doc_distrato)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('gp_doc_contrato_forca_escritura'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_doc_minuta_escritura'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_doc_termo_chaves'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_doc_termo_posse'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_doc_distrato'))
    } catch (_) {}
  },
)
