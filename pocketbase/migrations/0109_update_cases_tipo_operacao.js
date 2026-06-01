migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.add(
      new SelectField({
        name: 'tipo_operacao',
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
          'autorizacao_venda',
        ],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cases')
    col.fields.add(
      new SelectField({
        name: 'tipo_operacao',
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
      }),
    )
    app.save(col)
  },
)
