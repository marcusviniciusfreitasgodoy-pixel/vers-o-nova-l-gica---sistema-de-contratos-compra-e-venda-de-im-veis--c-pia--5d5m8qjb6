migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    if (!col.fields.getByName('cartorio')) {
      col.fields.add(new TextField({ name: 'cartorio' }))
      col.fields.add(new TextField({ name: 'prazo_acordo' }))
      col.fields.add(new TextField({ name: 'responsavel_comissao' }))
      col.fields.add(new DateField({ name: 'prazo_escritura' }))
      col.fields.add(new DateField({ name: 'data_posse' }))
      col.fields.add(new NumberField({ name: 'percentual_multa' }))
      col.fields.add(new TextField({ name: 'cidade' }))
      col.fields.add(new NumberField({ name: 'valor_recursos_proprios' }))
      col.fields.add(
        new SelectField({
          name: 'tipo_negociacao',
          values: ['a_vista', 'financiamento', 'investidor', 'alto_padrao', 'permuta'],
          maxSelect: 1,
        }),
      )
      col.fields.add(
        new SelectField({
          name: 'tipo_documento',
          values: [
            'ficha_cadastral',
            'checklist',
            'recibo_sinal',
            'promessa_cv',
            'contrato_particular',
            'termo_chaves',
            'termo_posse',
            'declaracoes',
            'autorizacao',
            'distrato',
          ],
          maxSelect: 1,
        }),
      )
      col.fields.add(new TextField({ name: 'situacao_juridica_imovel' }))
      col.fields.add(new TextField({ name: 'condicao_suspensiva' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    col.fields.removeByName('cartorio')
    col.fields.removeByName('prazo_acordo')
    col.fields.removeByName('responsavel_comissao')
    col.fields.removeByName('prazo_escritura')
    col.fields.removeByName('data_posse')
    col.fields.removeByName('percentual_multa')
    col.fields.removeByName('cidade')
    col.fields.removeByName('valor_recursos_proprios')
    col.fields.removeByName('tipo_negociacao')
    col.fields.removeByName('tipo_documento')
    col.fields.removeByName('situacao_juridica_imovel')
    col.fields.removeByName('condicao_suspensiva')

    app.save(col)
  },
)
