migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const clauses = [
      {
        title: 'FIX001 - Objeto',
        content:
          'O VENDEDOR promete vender e o COMPRADOR promete comprar o imóvel descrito como {{tipo_imovel}}, localizado em {{endereco_imovel}}, matrícula {{matricula_imovel}} do {{cartorio_imovel}}.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX002 - Preço',
        content:
          'O preço certo e ajustado para a presente venda e compra é de R$ {{valor_total}}, que será pago da seguinte forma: Sinal de R$ {{valor_sinal}} na data {{data_pagamento_sinal}} e demais parcelas conforme acordado.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX003 - Foro',
        content:
          'As partes elegem o foro da Comarca de {{foro_comarca}} para dirimir quaisquer dúvidas oriundas deste contrato.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX004 - Boa Fé',
        content:
          'As partes obrigam-se a guardar, assim na conclusão do contrato, como em sua execução, os princípios de probidade e boa-fé.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX005 - Irrevogabilidade',
        content: 'O presente contrato é celebrado em caráter irrevogável e irretratável.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX006 - LGPD',
        content:
          'As partes concordam com o tratamento de seus dados pessoais para a finalidade específica de execução deste contrato, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
        category: 'clausula_fixa',
      },
      {
        title: 'FIX007 - Assinatura Eletrônica',
        content:
          'As partes concordam em assinar o presente contrato eletronicamente através da plataforma {{plataforma_assinatura}}, possuindo a mesma validade jurídica da assinatura física.',
        category: 'clausula_fixa',
      },
      {
        title: 'FIN001 - Financiamento Bancário',
        content:
          'Parte do pagamento, no valor de R$ {{valor_financiamento}}, será efetuada através de financiamento bancário a ser obtido pelo COMPRADOR no prazo de {{prazo_financiamento}} dias.',
        category: 'clausula_condicional',
      },
      {
        title: 'POS001 - Imóvel Ocupado',
        content:
          'O imóvel encontra-se ocupado, comprometendo-se o VENDEDOR a desocupá-lo e entregá-lo livre de pessoas e coisas até {{prazo_desocupacao}} dias após a assinatura, sob pena de multa diária de R$ {{multa_desocupacao}}.',
        category: 'clausula_condicional',
      },
      {
        title: 'LOC001 - Imóvel Locado',
        content:
          'O imóvel encontra-se locado, declarando o COMPRADOR ter ciência do contrato de locação vigente.',
        category: 'clausula_condicional',
      },
      {
        title: 'INV001 - Inventário',
        content:
          'O imóvel encontra-se em processo de inventário, ficando a outorga da escritura definitiva condicionada à expedição do formal de partilha.',
        category: 'clausula_condicional',
      },
      {
        title: 'COM001 - Comissão',
        content:
          'A comissão de corretagem, no importe de R$ {{valor_comissao}} ({{percentual_comissao}}%), será paga ao intermediador da negociação pelo {{responsavel_comissao}}.',
        category: 'clausula_condicional',
      },
      {
        title: 'CAS001 - Anuência Conjugal',
        content:
          'O cônjuge do VENDEDOR, Sr(a). {{conjuge_vendedor}}, comparece neste ato para prestar sua expressa outorga uxória/marital, ratificando a venda sob o regime de {{regime_bens_vendedor}}.',
        category: 'clausula_condicional',
      },
    ]

    for (const c of clauses) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', c.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', c.title)
        record.set('content', c.content)
        record.set('category', c.category)
        app.save(record)
      }
    }
  },
  (app) => {},
)
