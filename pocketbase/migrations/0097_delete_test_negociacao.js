migrate(
  (app) => {
    try {
      // Busca a negociação pelo prefixo do ID fornecido
      const records = app.findRecordsByFilter('gp_negociacoes', "id ~ 'b3fk25gd'", '', 10, 0)

      if (records && records.length > 0) {
        for (const record of records) {
          const id = record.id

          // Tabelas dependentes de gp_negociacoes
          const childTables = [
            'gp_negociacao_partes',
            'gp_doc_autorizacao',
            'gp_doc_ficha_cadastral',
            'gp_doc_checklist',
            'gp_doc_propostas',
            'gp_doc_recibo_sinal',
            'gp_doc_promessa',
            'gp_doc_contrato_forca_escritura',
            'gp_doc_minuta_escritura',
            'gp_doc_termo_chaves',
            'gp_doc_termo_posse',
            'gp_doc_distrato',
          ]

          // Remove os registros órfãos nas coleções filhas
          for (const table of childTables) {
            try {
              if (app.hasTable(table)) {
                app
                  .db()
                  .newQuery(`DELETE FROM ${table} WHERE negociacao_id = {:id}`)
                  .bind({ id })
                  .execute()
              }
            } catch (e) {
              console.log(`Failed to delete from ${table}:`, e)
            }
          }

          // Exclui o registro alvo principal
          app.delete(record)
          console.log(`Deleted test negociacao ${id}`)
        }
      } else {
        console.log("No records matching 'b3fk25gd' found.")
      }
    } catch (e) {
      console.log('Error finding or deleting record:', e)
    }
  },
  (app) => {
    // Irreversível, pois os dados são deletados permanentemente.
  },
)
