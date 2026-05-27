migrate(
  (app) => {
    const casesCol = app.findCollectionByNameOrId('cases')

    const collection = new Collection({
      name: 'partes',
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
          name: 'tipo_da_parte',
          type: 'select',
          values: ['pessoa_fisica', 'pessoa_juridica'],
          required: false,
        },
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'documento',
          type: 'text',
        },
        {
          name: 'papel_na_operacao',
          type: 'select',
          values: ['comprador', 'vendedor', 'representante', 'testemunha', 'outro'],
          required: false,
        },
        {
          name: 'e_mail',
          type: 'text',
        },
        {
          name: 'telefone',
          type: 'text',
        },
        {
          name: 'observacoes',
          type: 'text',
        },
        {
          name: 'possui_representacao',
          type: 'bool',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_partes_case_id ON partes (case_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('partes')
    app.delete(collection)
  },
)
