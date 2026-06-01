migrate(
  (app) => {
    const queries = [
      'DELETE FROM gp_doc_propostas',
      'DELETE FROM gp_doc_recibo_sinal',
      'DELETE FROM gp_doc_promessa',
      'DELETE FROM gp_doc_contrato_forca_escritura',
      'DELETE FROM gp_doc_minuta_escritura',
      'DELETE FROM gp_doc_termo_chaves',
      'DELETE FROM gp_doc_termo_posse',
      'DELETE FROM gp_doc_distrato',
      'DELETE FROM gp_final_documents',
      'DELETE FROM gp_negociacao_partes',
      'DELETE FROM gp_doc_autorizacao',
      'DELETE FROM gp_doc_ficha_cadastral',
      'DELETE FROM gp_doc_checklist',
      'DELETE FROM expert_proposals',
      'DELETE FROM expert_support_requests',
      'DELETE FROM case_state_transitions',
      'DELETE FROM friction_logs',
      'DELETE FROM gp_negociacoes',
      'DELETE FROM partes',
      'DELETE FROM imovel',
      'DELETE FROM cases',
    ]

    for (const q of queries) {
      try {
        app.db().newQuery(q).execute()
      } catch (e) {
        console.log('Error running query:', q, e.message)
      }
    }

    try {
      const casesCol = app.findCollectionByNameOrId('cases')
      casesCol.deleteRule =
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true)"
      app.save(casesCol)
    } catch (e) {
      console.log('Error updating cases collection rule:', e.message)
    }
  },
  (app) => {
    try {
      const casesCol = app.findCollectionByNameOrId('cases')
      casesCol.deleteRule =
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.is_admin = true) && @request.auth.role != 'operador'"
      app.save(casesCol)
    } catch (e) {
      console.log('Error reverting cases collection rule:', e.message)
    }
  },
)
