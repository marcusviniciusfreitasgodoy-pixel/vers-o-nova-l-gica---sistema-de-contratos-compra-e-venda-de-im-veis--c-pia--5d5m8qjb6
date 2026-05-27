migrate(
  (app) => {
    const collection = new Collection({
      name: 'cases',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)",
      viewRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)",
      deleteRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)",
      fields: [
        {
          name: 'company',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('companies').id,
          maxSelect: 1,
        },
        {
          name: 'responsible',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'priority', type: 'select', maxSelect: 1, values: ['baixa', 'media', 'alta'] },
        {
          name: 'segmento_operacional',
          type: 'select',
          maxSelect: 1,
          values: [
            'corretor_autonomo',
            'imobiliaria_pequena_media',
            'imobiliaria_estruturada_premium',
            'construtora_incorporadora',
          ],
        },
        {
          name: 'tipo_operacao',
          type: 'select',
          maxSelect: 1,
          values: [
            'compra_venda_padrao',
            'compra_venda_sinal',
            'compra_venda_financiamento',
            'recibo_sinal_autonomo',
            'checklist_documental',
            'promessa_compra_venda',
            'distrato',
            'termo_posse_chaves',
            'permuta',
          ],
        },
        {
          name: 'nivel_complexidade',
          type: 'select',
          maxSelect: 1,
          values: ['simples', 'moderado', 'sensivel', 'complexo', 'bloqueado'],
        },
        {
          name: 'estado_caso',
          type: 'select',
          maxSelect: 1,
          values: [
            'rascunho',
            'em_qualificacao',
            'em_preenchimento',
            'aguardando_documentos',
            'em_validacao',
            'pendente_revisao_juridica',
            'encaminhado_suporte_especializado',
            'aprovado',
            'aprovado_ressalvas',
            'bloqueado',
            'minuta_gerada',
            'cancelado',
            'arquivado',
          ],
        },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cases')
    app.delete(collection)
  },
)
