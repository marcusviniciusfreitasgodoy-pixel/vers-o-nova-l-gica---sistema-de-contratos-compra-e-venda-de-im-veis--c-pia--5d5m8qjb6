migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const field = col.fields.getByName('category')
    field.values = [
      'legislacao',
      'jurisprudencia',
      'boas_praticas',
      'clausula_fixa',
      'clausula_condicional',
      'protecao_comercial',
      'distrato',
      'permuta',
      'checklist_documental',
    ]
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')
    const field = col.fields.getByName('category')
    field.values = [
      'legislacao',
      'jurisprudencia',
      'boas_praticas',
      'clausula_fixa',
      'clausula_condicional',
      'protecao_comercial',
    ]
    app.save(col)
  },
)
