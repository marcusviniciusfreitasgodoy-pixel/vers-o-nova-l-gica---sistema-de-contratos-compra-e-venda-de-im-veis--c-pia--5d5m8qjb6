migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.add(new TextField({ name: 'imobiliaria_nome' }))
    col.fields.add(new TextField({ name: 'imobiliaria_documento' }))
    col.fields.add(new TextField({ name: 'creci' }))
    col.fields.add(new TextField({ name: 'banco_nome' }))
    col.fields.add(new TextField({ name: 'agencia' }))
    col.fields.add(new TextField({ name: 'conta' }))
    col.fields.add(new TextField({ name: 'chave_pix' }))
    col.fields.add(new NumberField({ name: 'comissao_padrao_percentual' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('imobiliaria_nome')
    col.fields.removeByName('imobiliaria_documento')
    col.fields.removeByName('creci')
    col.fields.removeByName('banco_nome')
    col.fields.removeByName('agencia')
    col.fields.removeByName('conta')
    col.fields.removeByName('chave_pix')
    col.fields.removeByName('comissao_padrao_percentual')
    app.save(col)
  },
)
