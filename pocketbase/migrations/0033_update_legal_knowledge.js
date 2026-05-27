migrate(
  (app) => {
    const legalCol = app.findCollectionByNameOrId('legal_knowledge')
    if (!legalCol.fields.getByName('version')) {
      legalCol.fields.add(new NumberField({ name: 'version', min: 1 }))
      app.save(legalCol)
    }

    const contractsCol = app.findCollectionByNameOrId('contracts')
    if (!contractsCol.fields.getByName('used_clauses')) {
      contractsCol.fields.add(new JSONField({ name: 'used_clauses' }))
      app.save(contractsCol)
    }

    try {
      app
        .db()
        .newQuery('UPDATE legal_knowledge SET version = 1 WHERE version IS NULL OR version = 0')
        .execute()
    } catch (e) {
      console.log(e)
    }

    const clauses = [
      {
        title: 'FIN002 - Condição Resolutiva',
        content:
          'A presente venda fica condicionada à aprovação do financiamento no valor de R$ {{valor_financiamento}}.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'FIN003 - Restituição',
        content:
          'Em caso de negativa do financiamento por culpa não atribuível ao COMPRADOR, os valores pagos a título de sinal serão restituídos integralmente.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'FIN004 - Prazos e Diligências',
        content:
          'O COMPRADOR deverá entregar todos os documentos exigidos pela instituição financeira {{instituicao_financeira}} no prazo de {{prazo_financiamento}} dias.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'FIN005 - Despesas Financiamento',
        content:
          'Todas as despesas com o financiamento bancário correrão por conta exclusiva do COMPRADOR.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'POS002 - Vistoria Prévia',
        content:
          'O COMPRADOR declara ter vistoriado o imóvel e aceita recebê-lo no estado de conservação em que se encontra.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'POS003 - Danos na Desocupação',
        content:
          'O VENDEDOR responderá civil e criminalmente por quaisquer danos causados ao imóvel durante o período de desocupação.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'POS004 - Retenção de Valores',
        content:
          'Fica autorizada a retenção de 10% do valor final até a efetiva desocupação e entrega das chaves, como garantia.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'LOC002 - Renúncia Preferência',
        content:
          'O VENDEDOR apresenta neste ato a carta de renúncia ao direito de preferência devidamente assinada pelo atual locatário.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'LOC003 - Sub-rogação',
        content:
          'O COMPRADOR sub-roga-se nos direitos e deveres do contrato de locação a partir da data de imissão na posse.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'INV002 - Alvará Judicial',
        content:
          'Fica condicionada a validade desta promessa à expedição de Alvará Judicial autorizando a alienação do bem.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'INV003 - Riscos de Inventário',
        content:
          'O COMPRADOR declara estar plenamente ciente dos riscos e prazos inerentes à aquisição de imóvel pendente de inventário.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'COM002 - Não Concretização',
        content:
          'A comissão de corretagem será devida integralmente mesmo que o negócio não se concretize por arrependimento das partes.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'COM003 - Retenção do Sinal',
        content:
          'Fica expressamente autorizada a retenção do valor da comissão diretamente do montante pago a título de sinal.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'COM004 - Solidariedade',
        content:
          'As partes respondem solidariamente pelo pagamento da comissão de corretagem em caso de dolo ou fraude processual.',
        category: 'clausula_condicional',
        version: 1,
      },
      {
        title: 'CAS002 - Outorga',
        content:
          'O cônjuge do VENDEDOR declara concordar com todas as cláusulas deste instrumento, prestando sua outorga uxória/marital para a venda.',
        category: 'clausula_condicional',
        version: 1,
      },
    ]

    for (const c of clauses) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', c.title)
      } catch (_) {
        const record = new Record(legalCol)
        record.set('title', c.title)
        record.set('content', c.content)
        record.set('category', c.category)
        record.set('version', c.version)
        app.save(record)
      }
    }
  },
  (app) => {
    const legalCol = app.findCollectionByNameOrId('legal_knowledge')
    legalCol.fields.removeByName('version')
    app.save(legalCol)

    const contractsCol = app.findCollectionByNameOrId('contracts')
    contractsCol.fields.removeByName('used_clauses')
    app.save(contractsCol)
  },
)
