migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.add(new TextField({ name: 'permuta_imovel_endereco' }))
    col.fields.add(new TextField({ name: 'permuta_imovel_matricula' }))
    col.fields.add(new NumberField({ name: 'permuta_imovel_valor' }))
    col.fields.add(new TextField({ name: 'permuta_imovel_detalhes' }))

    const tipoNeg = col.fields.getByName('tipo_negociacao')
    if (tipoNeg) {
      tipoNeg.values = ['a_vista', 'financiamento', 'investidor', 'alto_padrao', 'permuta', 'dacao']
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.removeByName('permuta_imovel_endereco')
    col.fields.removeByName('permuta_imovel_matricula')
    col.fields.removeByName('permuta_imovel_valor')
    col.fields.removeByName('permuta_imovel_detalhes')

    const tipoNeg = col.fields.getByName('tipo_negociacao')
    if (tipoNeg) {
      tipoNeg.values = ['a_vista', 'financiamento', 'investidor', 'alto_padrao', 'permuta']
    }

    app.save(col)
  },
)
