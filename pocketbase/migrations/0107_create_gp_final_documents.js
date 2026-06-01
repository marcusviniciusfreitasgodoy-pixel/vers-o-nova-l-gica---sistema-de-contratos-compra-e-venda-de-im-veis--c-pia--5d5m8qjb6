migrate(
  (app) => {
    const collection = new Collection({
      name: 'gp_final_documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        {
          name: 'negociacao_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('gp_negociacoes').id,
          maxSelect: 1,
        },
        { name: 'arquivo_gerado', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'status', type: 'select', values: ['rascunho', 'assinado', 'cancelado'] },
        { name: 'plataforma_assinatura', type: 'text' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('gp_final_documents')
    app.delete(collection)
  },
)
