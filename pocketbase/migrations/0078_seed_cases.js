migrate(
  (app) => {
    try {
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'marcusviniciusfreitasgodoy@gmail.com',
      )
      const companies = app.findCollectionByNameOrId('companies')

      let defaultCompany
      try {
        defaultCompany = app.findFirstRecordByData('companies', 'name', 'Godoy Imóveis')
      } catch (_) {
        defaultCompany = new Record(companies)
        defaultCompany.set('name', 'Godoy Imóveis')
        defaultCompany.set('document', '12345678000199')
        defaultCompany.set('segment', 'imobiliaria_estruturada_premium')
        app.save(defaultCompany)
      }

      if (adminUser.get('company') !== defaultCompany.id) {
        adminUser.set('company', defaultCompany.id)
        app.save(adminUser)
      }

      const cases = app.findCollectionByNameOrId('cases')

      try {
        app.findFirstRecordByData('cases', 'title', 'Venda de Apartamento no Centro')
      } catch (_) {
        const case1 = new Record(cases)
        case1.set('company', defaultCompany.id)
        case1.set('responsible', adminUser.id)
        case1.set('title', 'Venda de Apartamento no Centro')
        case1.set('description', 'Venda padrão de apartamento 3 quartos')
        case1.set('priority', 'media')
        case1.set('segmento_operacional', 'imobiliaria_estruturada_premium')
        case1.set('tipo_operacao', 'compra_venda_padrao')
        case1.set('nivel_complexidade', 'simples')
        case1.set('estado_caso', 'rascunho')
        app.save(case1)
      }

      try {
        app.findFirstRecordByData('cases', 'title', 'Permuta de Terreno por Casa')
      } catch (_) {
        const case2 = new Record(cases)
        case2.set('company', defaultCompany.id)
        case2.set('responsible', adminUser.id)
        case2.set('title', 'Permuta de Terreno por Casa')
        case2.set('description', 'Troca de terreno em condomínio fechado por casa de rua')
        case2.set('priority', 'alta')
        case2.set('segmento_operacional', 'imobiliaria_estruturada_premium')
        case2.set('tipo_operacao', 'permuta')
        case2.set('nivel_complexidade', 'complexo')
        case2.set('estado_caso', 'em_qualificacao')
        app.save(case2)
      }

      try {
        app.findFirstRecordByData('cases', 'title', 'Financiamento Casa Verde e Amarela')
      } catch (_) {
        const case3 = new Record(cases)
        case3.set('company', defaultCompany.id)
        case3.set('responsible', adminUser.id)
        case3.set('title', 'Financiamento Casa Verde e Amarela')
        case3.set('description', 'Processo dependendo da aprovação da Caixa')
        case3.set('priority', 'baixa')
        case3.set('segmento_operacional', 'imobiliaria_pequena_media')
        case3.set('tipo_operacao', 'compra_venda_financiamento')
        case3.set('nivel_complexidade', 'moderado')
        case3.set('estado_caso', 'aguardando_documentos')
        app.save(case3)
      }
    } catch (err) {
      console.log('Seed error: ', err)
    }
  },
  (app) => {
    // Irreversible without deleting possible prod data
  },
)
