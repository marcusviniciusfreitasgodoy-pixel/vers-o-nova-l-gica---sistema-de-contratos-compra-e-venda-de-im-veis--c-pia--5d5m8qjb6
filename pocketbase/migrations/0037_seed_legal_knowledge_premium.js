migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const clauses = [
      // FIX
      {
        code: 'FIX001',
        category: 'clausula_fixa',
        title: 'Objeto do Contrato',
        priority: 10,
        trigger_logic: '',
        content:
          'O VENDEDOR compromete-se a vender ao COMPRADOR, e este a comprar, o imóvel descrito na Cláusula Primeira, livre e desembaraçado de quaisquer ônus ou dívidas.',
      },
      {
        code: 'FIX002',
        category: 'clausula_fixa',
        title: 'Preço',
        priority: 20,
        trigger_logic: '',
        content:
          'Pela venda e compra do imóvel, as partes ajustam o preço certo e ajustado de R$ {{financeiro.valor_total}}, que será pago da seguinte forma...',
      },
      {
        code: 'FIX003',
        category: 'clausula_fixa',
        title: 'Pagamento',
        priority: 30,
        trigger_logic: '',
        content:
          'O pagamento será realizado conforme as datas e valores estipulados no quadro resumo. O atraso superior a 10 dias acarretará multa de {{financeiro.multas.inadimplencia_percentual}}%.',
      },
      {
        code: 'FIX004',
        category: 'clausula_fixa',
        title: 'Irrevogabilidade',
        priority: 40,
        trigger_logic: '',
        content:
          'O presente contrato é celebrado em caráter irrevogável e irretratável, não admitindo arrependimento por qualquer das partes, obrigando-se herdeiros e sucessores.',
      },
      {
        code: 'FIX005',
        category: 'clausula_fixa',
        title: 'Boa-Fé',
        priority: 50,
        trigger_logic: '',
        content:
          'As partes declaram atuar pautadas pela estrita boa-fé objetiva, prestando as informações necessárias e verdadeiras à celebração deste negócio jurídico.',
      },
      {
        code: 'FIX006',
        category: 'clausula_fixa',
        title: 'Foro',
        priority: 60,
        trigger_logic: '',
        content:
          'As partes elegem o foro da Comarca de {{compliance.foro}} para dirimir quaisquer dúvidas oriundas deste contrato.',
      },
      {
        code: 'FIX007',
        category: 'clausula_fixa',
        title: 'Assinatura Eletrônica (Geral)',
        priority: 70,
        trigger_logic: '',
        content:
          'As partes concordam que este contrato poderá ser assinado de forma física ou eletrônica, possuindo plena validade jurídica.',
      },
      {
        code: 'FIX008',
        category: 'clausula_fixa',
        title: 'LGPD',
        priority: 80,
        trigger_logic: '',
        content:
          'As partes consentem com o tratamento de seus dados pessoais constantes neste instrumento, estritamente para a finalidade de efetivação da compra e venda e registro competente nos termos da Lei 13.709/2018.',
      },

      // FIN
      {
        code: 'FIN001',
        category: 'clausula_condicional',
        title: 'Condição Financiamento',
        priority: 90,
        trigger_logic: '{"path":"comprador.financeiro.financiamento","value":true}',
        content:
          'O COMPRADOR financiará o valor de R$ {{financeiro.valor_financiamento}} junto à instituição financeira {{comprador.financeiro.banco}}.',
      },
      {
        code: 'FIN002',
        category: 'clausula_condicional',
        title: 'Prazo Financiamento',
        priority: 100,
        trigger_logic: '{"path":"comprador.financeiro.financiamento","value":true}',
        content:
          'O COMPRADOR tem o prazo de {{comprador.financeiro.prazo_aprovacao}} dias úteis para aprovação do crédito e liberação do financiamento.',
      },
      {
        code: 'FIN003',
        category: 'clausula_condicional',
        title: 'FGTS',
        priority: 110,
        trigger_logic: '{"path":"comprador.financeiro.fgts","value":true}',
        content:
          'Parte do pagamento, no importe de R$ {{financeiro.valor_fgts}}, será realizado mediante a utilização de recursos da conta vinculada do FGTS do COMPRADOR.',
      },

      // POS
      {
        code: 'POS001',
        category: 'clausula_condicional',
        title: 'Posse Ocupado',
        priority: 120,
        trigger_logic: '{"path":"imovel.situacao_juridica.ocupado","value":true}',
        content:
          'O imóvel encontra-se atualmente ocupado. O VENDEDOR obriga-se a desocupá-lo em até {{posse.prazo_desocupacao}} dias após a assinatura.',
      },
      {
        code: 'POS002',
        category: 'clausula_condicional',
        title: 'Multa Desocupação',
        priority: 125,
        trigger_logic: '{"path":"imovel.situacao_juridica.ocupado","value":true}',
        content:
          'Em caso de atraso na desocupação, o VENDEDOR arcará com multa diária de R$ {{financeiro.multas.multa_desocupacao}}.',
      },
      {
        code: 'POS003',
        category: 'clausula_condicional',
        title: 'Posse Imediata',
        priority: 128,
        trigger_logic: '{"path":"posse.imediata","value":true}',
        content:
          'A posse do imóvel é transmitida ao COMPRADOR neste ato, de forma imediata e definitiva.',
      },

      // COM
      {
        code: 'COM001',
        category: 'clausula_condicional',
        title: 'Comissão Garantida',
        priority: 130,
        trigger_logic: '{"path":"comissao.garantida","value":true}',
        content:
          'Fica assegurada a comissão de corretagem à imobiliária {{comissao.imobiliaria}}, no percentual de {{comissao.percentual}}%, sob responsabilidade do {{comissao.responsavel_pagamento}}.',
      },
      {
        code: 'COM002',
        category: 'clausula_condicional',
        title: 'Valor Comissão',
        priority: 135,
        trigger_logic: '{"path":"comissao.garantida","value":true}',
        content:
          'O valor da comissão de corretagem é de R$ {{comissao.valor}}, devidos no momento da assinatura deste instrumento.',
      },

      // ONU
      {
        code: 'ONU001',
        category: 'clausula_condicional',
        title: 'Ônus e Ações',
        priority: 138,
        trigger_logic: '{"path":"imovel.situacao_juridica.onus","value":true}',
        content:
          'O VENDEDOR declara a existência de ônus sobre o imóvel, comprometendo-se a baixá-los integralmente antes da lavratura da escritura pública.',
      },
      {
        code: 'ONU002',
        category: 'clausula_condicional',
        title: 'Ações Judiciais',
        priority: 139,
        trigger_logic: '{"path":"imovel.situacao_juridica.acoes_judiciais","value":true}',
        content:
          'As partes reconhecem a existência de ações judiciais em nome do VENDEDOR, as quais não afetam a segurança da presente transação.',
      },

      // TRI
      {
        code: 'TRI001',
        category: 'clausula_fixa',
        title: 'Tributos Vendedor',
        priority: 140,
        trigger_logic: '',
        content:
          'O VENDEDOR é responsável pelo pagamento de todos os impostos, taxas e condomínio incidentes sobre o imóvel até a data de entrega das chaves.',
      },
      {
        code: 'TRI002',
        category: 'clausula_fixa',
        title: 'Tributos Comprador',
        priority: 141,
        trigger_logic: '',
        content:
          'A partir da data da posse, correrão por conta exclusiva do COMPRADOR todas as despesas incidentes sobre o imóvel.',
      },

      // LOC
      {
        code: 'LOC001',
        category: 'clausula_condicional',
        title: 'Imóvel Locado',
        priority: 142,
        trigger_logic: '{"path":"imovel.situacao_juridica.locado","value":true}',
        content:
          'O imóvel objeto deste contrato encontra-se atualmente locado. O VENDEDOR declara que o locatário renunciou expressamente ao direito de preferência legal.',
      },

      // CAS
      {
        code: 'CAS001',
        category: 'clausula_condicional',
        title: 'Anuência Cônjuge Vendedor',
        priority: 150,
        trigger_logic: '{"path":"vendedor.estado_civil","value":"Casado"}',
        content:
          'Comparece neste ato o cônjuge do VENDEDOR, {{vendedor.conjuge.nome}}, inscrito(a) no CPF {{vendedor.conjuge.cpf}}, para conceder a respectiva outorga uxória/marital exigida por lei.',
      },
      {
        code: 'CAS002',
        category: 'clausula_condicional',
        title: 'Regime de Bens Vendedor',
        priority: 151,
        trigger_logic: '{"path":"vendedor.estado_civil","value":"Casado"}',
        content:
          'O VENDEDOR e seu cônjuge são casados sob o regime de {{vendedor.regime_bens}}, declarando ambos plena capacidade para a presente alienação.',
      },

      // INV
      {
        code: 'INV001',
        category: 'clausula_condicional',
        title: 'Imóvel em Inventário',
        priority: 160,
        trigger_logic: '{"path":"imovel.situacao_juridica.inventario","value":true}',
        content:
          'O VENDEDOR declara que o imóvel é objeto de inventário, comprometendo-se a apresentar o formal de partilha ou alvará judicial autorizando a venda.',
      },

      // INA
      {
        code: 'INA001',
        category: 'clausula_fixa',
        title: 'Inadimplência',
        priority: 162,
        trigger_logic: '',
        content:
          'O não pagamento pontual de qualquer parcela sujeitará o COMPRADOR ao pagamento de juros de mora de 1% ao mês e correção monetária.',
      },

      // RES
      {
        code: 'RES001',
        category: 'clausula_fixa',
        title: 'Rescisão por Justa Causa',
        priority: 164,
        trigger_logic: '',
        content:
          'O descumprimento de qualquer cláusula, não sanado após notificação de 15 dias, dará ensejo à rescisão de pleno direito.',
      },

      // GAR
      {
        code: 'GAR001',
        category: 'clausula_fixa',
        title: 'Evicção',
        priority: 166,
        trigger_logic: '',
        content:
          'O VENDEDOR responde pelos riscos da evicção de direito, obrigando-se a resguardar o COMPRADOR de quaisquer turbações de terceiros.',
      },

      // VIS
      {
        code: 'VIS001',
        category: 'clausula_condicional',
        title: 'Vistoria Obrigatória',
        priority: 168,
        trigger_logic: '{"path":"posse.vistoria_obrigatoria","value":true}',
        content:
          'A entrega das chaves está condicionada à realização de vistoria prévia pelo COMPRADOR, atestando as condições do imóvel.',
      },

      // ELE
      {
        code: 'ELE001',
        category: 'clausula_condicional',
        title: 'Plataforma Assinatura Eletrônica',
        priority: 170,
        trigger_logic: '{"path":"compliance.assinatura_eletronica","value":true}',
        content:
          'Este contrato será assinado digitalmente por meio da plataforma {{compliance.plataforma_assinatura}}, com validade legal nos termos da MP 2.200-2/2001.',
      },

      // MED
      {
        code: 'MED001',
        category: 'clausula_condicional',
        title: 'Cláusula de Mediação',
        priority: 180,
        trigger_logic: '{"path":"compliance.mediacao","value":true}',
        content:
          'As partes comprometem-se a submeter eventuais litígios a uma câmara de mediação extrajudicial antes de postular no Poder Judiciário.',
      },
      {
        code: 'MED002',
        category: 'clausula_condicional',
        title: 'Cláusula de Arbitragem',
        priority: 190,
        trigger_logic: '{"path":"compliance.arbitragem","value":true}',
        content:
          'Fica eleito o juízo arbitral para dirimir, de forma definitiva, qualquer controvérsia derivada do presente instrumento.',
      },
    ]

    for (const c of clauses) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'code', c.code)
      } catch (_) {
        const record = new Record(col)
        record.set('code', c.code)
        record.set('category', c.category)
        record.set('title', c.title)
        record.set('content', c.content)
        record.set('trigger_logic', c.trigger_logic)
        record.set('priority', c.priority)
        record.set('version', 1)
        app.save(record)
      }
    }
  },
  (app) => {
    // Down migration not needed for data seed
  },
)
