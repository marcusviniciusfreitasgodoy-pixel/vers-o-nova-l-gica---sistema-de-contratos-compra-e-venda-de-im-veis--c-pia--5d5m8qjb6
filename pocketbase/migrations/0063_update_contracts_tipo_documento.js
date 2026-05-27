migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_documento')

    if (field) {
      field.values = [
        'ficha_cadastral',
        'checklist_documental',
        'recibo_sinal',
        'promessa_compra_venda',
        'contrato_particular',
        'termo_entrega_chaves',
        'termo_posse',
        'declaracoes_complementares',
        'autorizacao_intermediacao',
        'distrato',
        'contrato_preliminar',
        'contrato_definitivo',
      ]
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const field = col.fields.getByName('tipo_documento')

    if (field) {
      // Revert back to original 10 values
      field.values = [
        'ficha_cadastral',
        'checklist_documental',
        'recibo_sinal',
        'promessa_compra_venda',
        'contrato_particular',
        'termo_entrega_chaves',
        'termo_posse',
        'declaracoes_complementares',
        'autorizacao_intermediacao',
        'distrato',
      ]
      app.save(col)
    }
  },
)
