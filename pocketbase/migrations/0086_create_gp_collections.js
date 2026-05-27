migrate(
  (app) => {
    const gpPessoas = new Collection({
      name: 'gp_pessoas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'tipo_pessoa', type: 'select', values: ['fisica', 'juridica'] },
        { name: 'nome_razao_social', type: 'text', required: true },
        { name: 'cpf_cnpj', type: 'text', required: true },
        { name: 'rg_ie', type: 'text' },
        { name: 'orgao_emissor', type: 'text' },
        { name: 'nacionalidade', type: 'text' },
        {
          name: 'estado_civil',
          type: 'select',
          values: ['solteiro', 'casado', 'uniao_estavel', 'divorciado', 'viuvo', 'separado'],
        },
        {
          name: 'regime_bens',
          type: 'select',
          values: [
            'comunhao_parcial',
            'comunhao_universal',
            'separacao_total',
            'participacao_final',
            'nao_aplicavel',
          ],
        },
        { name: 'profissao', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'endereco', type: 'json' },
        { name: 'reside_exterior', type: 'bool' },
        { name: 'representante_procuracao', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gpPessoas)

    const gpImoveis = new Collection({
      name: 'gp_imoveis',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'tipo_imovel',
          type: 'select',
          values: ['apartamento', 'casa', 'lote', 'sala_comercial', 'galpao', 'terreno', 'outro'],
        },
        { name: 'matricula_numero', type: 'text' },
        { name: 'cartorio_ri', type: 'text' },
        { name: 'inscricao_iptu', type: 'text' },
        { name: 'inscricao_municipal', type: 'text' },
        { name: 'endereco', type: 'json' },
        { name: 'condominio_nome', type: 'text' },
        { name: 'area_privativa', type: 'number' },
        { name: 'area_total', type: 'number' },
        { name: 'vaga_garagem', type: 'json' },
        { name: 'fracao_ideal', type: 'number' },
        { name: 'onus_gravames', type: 'json' },
        { name: 'valor_venal', type: 'number' },
        { name: 'descricao_registral', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gpImoveis)

    const companiesColId = app.findCollectionByNameOrId('companies').id

    const gpNegociacoes = new Collection({
      name: 'gp_negociacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'imovel_id', type: 'relation', collectionId: gpImoveis.id, maxSelect: 1 },
        { name: 'corretor_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'company_id', type: 'relation', collectionId: companiesColId, maxSelect: 1 },
        {
          name: 'estagio',
          type: 'select',
          values: [
            'captacao',
            'proposta',
            'preliminar',
            'promessa',
            'definitivo',
            'finalizacao',
            'concluido',
            'distratado',
          ],
        },
        { name: 'valor_total', type: 'number' },
        {
          name: 'forma_pagamento',
          type: 'select',
          values: ['a_vista', 'parcelado_direto', 'financiado_sfh', 'financiado_fiduciario'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gpNegociacoes)

    const gpNegociacaoPartes = new Collection({
      name: 'gp_negociacao_partes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'negociacao_id', type: 'relation', collectionId: gpNegociacoes.id, maxSelect: 1 },
        { name: 'pessoa_id', type: 'relation', collectionId: gpPessoas.id, maxSelect: 1 },
        {
          name: 'papel',
          type: 'select',
          values: [
            'vendedor',
            'comprador',
            'conjuge_vendedor',
            'conjuge_comprador',
            'anuente',
            'credor_fiduciario',
            'fiador',
            'procurador',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(gpNegociacaoPartes)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('gp_negociacao_partes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_negociacoes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_imoveis'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('gp_pessoas'))
    } catch (_) {}
  },
)
