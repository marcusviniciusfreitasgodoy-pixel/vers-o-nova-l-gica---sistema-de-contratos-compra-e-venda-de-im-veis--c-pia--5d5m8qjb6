migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user

    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusviniciusfreitasgodoy@gmail.com')
    } catch (_) {
      user = new Record(users)
      user.setEmail('marcusviniciusfreitasgodoy@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Marcus Godoy')
      app.save(user)
    }

    const contractsCol = app.findCollectionByNameOrId('contracts')
    const reportsCol = app.findCollectionByNameOrId('analysis_reports')

    // Contract 1: Compra e Venda À Vista
    let contract1
    try {
      contract1 = app.findFirstRecordByData('contracts', 'cpf_comprador', '987.654.321-11')
    } catch (_) {
      contract1 = new Record(contractsCol)
      contract1.set('user', user.id)
      contract1.set('tipo', 'Compra e Venda À Vista')
      contract1.set('status', 'concluido')
      contract1.set('nome_vendedor', 'Carlos Alberto da Silva')
      contract1.set('cpf_vendedor', '123.456.789-00')
      contract1.set('rg_vendedor', '12.345.678-9')
      contract1.set('nome_comprador', 'Ana Paula Oliveira')
      contract1.set('cpf_comprador', '987.654.321-11')
      contract1.set('rg_comprador', '98.765.432-1')
      contract1.set(
        'endereco_imovel',
        'Rua Oscar Freire, 1234, apto 42, Cerqueira César, São Paulo/SP',
      )
      contract1.set('valor_sinal', 50000)
      contract1.set('valor_saldo', 450000)
      contract1.set('valor_total', 500000)
      app.save(contract1)
    }

    // Report 1
    try {
      app.findFirstRecordByData('analysis_reports', 'contract', contract1.id)
    } catch (_) {
      const report1 = new Record(reportsCol)
      report1.set('user', user.id)
      report1.set('contract', contract1.id)
      report1.set('file_name', 'Contrato_A_Vista_Carlos_Ana.pdf')
      report1.set('risk_level', 'baixo')
      report1.set(
        'summary',
        'Contrato em conformidade com as exigências legais da Godoy Prime Realty. Documentação completa.',
      )
      report1.set('analysis_result', {
        checklist: {
          cndt: 'presente',
          protestos: 'presente',
          matricula: 'presente',
        },
        observations: ['Todos os documentos foram entregues dentro do prazo legal.'],
      })
      app.save(report1)
    }

    // Contract 2: Compra e Venda com Financiamento
    let contract2
    try {
      contract2 = app.findFirstRecordByData('contracts', 'cpf_comprador', '111.222.333-44')
    } catch (_) {
      contract2 = new Record(contractsCol)
      contract2.set('user', user.id)
      contract2.set('tipo', 'Compra e Venda com Financiamento')
      contract2.set('status', 'em_analise')
      contract2.set('nome_vendedor', 'Imobiliária Prime Ltda')
      contract2.set('cpf_vendedor', '11.222.333/0001-44')
      contract2.set('nome_comprador', 'Roberto Mendes Santos')
      contract2.set('cpf_comprador', '111.222.333-44')
      contract2.set('endereco_imovel', 'Av. Atlântica, 500, Copacabana, Rio de Janeiro/RJ')
      contract2.set('valor_sinal', 100000)
      contract2.set('valor_reforco', 50000)
      contract2.set('valor_complemento', 50000)
      contract2.set('valor_financiado', 800000)
      contract2.set('valor_total', 1000000)
      contract2.set('instituicao_financeira', 'Itaú')
      contract2.set('taxa_juros', 9.5)
      contract2.set('prazo_meses', 360)
      app.save(contract2)
    }

    // Report 2
    try {
      app.findFirstRecordByData('analysis_reports', 'contract', contract2.id)
    } catch (_) {
      const report2 = new Record(reportsCol)
      report2.set('user', user.id)
      report2.set('contract', contract2.id)
      report2.set('file_name', 'Contrato_Financiamento_Imob_Roberto.pdf')
      report2.set('risk_level', 'medio')
      report2.set(
        'summary',
        'Atenção necessária à cláusula de financiamento bancário e prazo de entrega das certidões do vendedor.',
      )
      report2.set('analysis_result', {
        checklist: {
          clausula_financiamento: 'revisar',
          prazo_certidoes: 'destaque',
        },
        observations: [
          'Atenção especial à cláusula com prazo de 10 dias úteis para a entrega das certidões do vendedor.',
        ],
      })
      app.save(report2)
    }
  },
  (app) => {
    try {
      const contract1 = app.findFirstRecordByData('contracts', 'cpf_comprador', '987.654.321-11')
      app
        .db()
        .newQuery('DELETE FROM analysis_reports WHERE contract = {:id}')
        .bind({ id: contract1.id })
        .execute()
      app.delete(contract1)
    } catch (_) {}

    try {
      const contract2 = app.findFirstRecordByData('contracts', 'cpf_comprador', '111.222.333-44')
      app
        .db()
        .newQuery('DELETE FROM analysis_reports WHERE contract = {:id}')
        .bind({ id: contract2.id })
        .execute()
      app.delete(contract2)
    } catch (_) {}
  },
)
