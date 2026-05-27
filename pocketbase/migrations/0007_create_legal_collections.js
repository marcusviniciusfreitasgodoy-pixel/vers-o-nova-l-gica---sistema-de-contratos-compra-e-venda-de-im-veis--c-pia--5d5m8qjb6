migrate(
  (app) => {
    const legalKnowledge = new Collection({
      name: 'legal_knowledge',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['legislacao', 'jurisprudencia', 'boas_praticas'],
          maxSelect: 1,
        },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(legalKnowledge)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const contracts = app.findCollectionByNameOrId('contracts')

    const analysisReports = new Collection({
      name: 'analysis_reports',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'contract',
          type: 'relation',
          collectionId: contracts.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'file_name', type: 'text' },
        { name: 'analysis_result', type: 'json', required: true },
        { name: 'summary', type: 'text' },
        {
          name: 'risk_level',
          type: 'select',
          values: ['baixo', 'medio', 'alto', 'critico'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(analysisReports)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('analysis_reports'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('legal_knowledge'))
    } catch (_) {}
  },
)
