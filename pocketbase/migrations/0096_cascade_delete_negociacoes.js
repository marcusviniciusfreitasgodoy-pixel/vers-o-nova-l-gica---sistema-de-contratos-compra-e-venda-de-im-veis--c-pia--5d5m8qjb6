migrate(
  (app) => {
    const collectionsToUpdate = [
      { name: 'gp_negociacoes', field: 'case_id' },
      { name: 'gp_negociacao_partes', field: 'negociacao_id' },
      { name: 'gp_doc_autorizacao', field: 'negociacao_id' },
      { name: 'gp_doc_ficha_cadastral', field: 'negociacao_id' },
      { name: 'gp_doc_checklist', field: 'negociacao_id' },
      { name: 'gp_doc_propostas', field: 'negociacao_id' },
      { name: 'gp_doc_recibo_sinal', field: 'negociacao_id' },
      { name: 'gp_doc_promessa', field: 'negociacao_id' },
      { name: 'gp_doc_contrato_forca_escritura', field: 'negociacao_id' },
      { name: 'gp_doc_minuta_escritura', field: 'negociacao_id' },
      { name: 'gp_doc_termo_chaves', field: 'negociacao_id' },
      { name: 'gp_doc_termo_posse', field: 'negociacao_id' },
      { name: 'gp_doc_distrato', field: 'negociacao_id' },
      { name: 'partes', field: 'case_id' },
      { name: 'imovel', field: 'case_id' },
    ]

    for (const item of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(item.name)
        const field = col.fields.getByName(item.field)
        if (field) {
          field.cascadeDelete = true
          app.save(col)
        }
      } catch (e) {
        console.log('Migration error for ' + item.name + ': ' + e)
      }
    }
  },
  (app) => {
    // Not reverting in down to prevent accidental rule loss
  },
)
