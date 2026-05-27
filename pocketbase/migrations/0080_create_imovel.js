migrate(
  (app) => {
    const casesCol = app.findCollectionByNameOrId('cases')

    const collection = new Collection({
      name: 'imovel',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)",
      viewRule:
        "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)",
      deleteRule:
        "@request.auth.id != '' && (case_id.company = @request.auth.company || @request.auth.is_admin = true)",
      fields: [
        {
          name: 'case_id',
          type: 'relation',
          required: true,
          collectionId: casesCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'tipo_imovel',
          type: 'select',
          values: [
            'apartamento',
            'casa',
            'terreno',
            'comercial',
            'cobertura',
            'sala_comercial',
            'outro',
          ],
          required: false,
        },
        {
          name: 'finalidade',
          type: 'select',
          values: ['residencial', 'comercial', 'mista', 'outro'],
          required: false,
        },
        {
          name: 'endereco_resumido',
          type: 'text',
        },
        {
          name: 'cidade',
          type: 'text',
        },
        {
          name: 'estado',
          type: 'text',
        },
        {
          name: 'matricula',
          type: 'text',
        },
        {
          name: 'inscricao_iptu',
          type: 'text',
        },
        {
          name: 'observacoes',
          type: 'text',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_imovel_case_id ON imovel (case_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('imovel')
    app.delete(collection)
  },
)
