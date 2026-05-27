migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const clauses = [
      {
        code: 'FIX001',
        title: 'Objeto - Descrição do Imóvel',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 10,
        content:
          'Pelo presente instrumento e na melhor forma de direito, o Vendedor promete vender ao Comprador, e este promete comprar-lhe o imóvel constante de {{imovel.tipo}}, situado em {{imovel.endereco}}, matriculado sob o nº {{imovel.matricula}} no Cartório de Registro de Imóveis de {{imovel.cartorio}}.',
      },
      {
        code: 'FIX002',
        title: 'Preço Total',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 20,
        content:
          'O preço certo, ajustado e irreajustável para a presente promessa de compra e venda é de R$ {{financeiro.valor_total}}, que será pago da seguinte forma e condições estabelecidas a seguir.',
      },
      {
        code: 'FIX003',
        title: 'Sinal e Princípio de Pagamento (Arras)',
        category: 'clausula_fixa',
        trigger_logic: 'financeiro.valor_sinal > 0',
        priority: 21,
        content:
          'O valor de R$ {{financeiro.valor_sinal}} será pago a título de sinal e princípio de pagamento (arras), valendo o comprovante de depósito ou transferência como recibo, sujeitando-se ao disposto no artigo 417 do Código Civil Brasileiro.',
      },
      {
        code: 'FIX004',
        title: 'Caráter de Irrevogabilidade e Irretratabilidade',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 90,
        content:
          'O presente contrato é celebrado em caráter irrevogável e irretratável, extensivo aos herdeiros e sucessores das partes, vedado o direito de arrependimento, ressalvadas as hipóteses de descumprimento de cláusulas contratuais essenciais.',
      },
      {
        code: 'FIX005',
        title: 'Evicção de Direito',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 91,
        content:
          'O Vendedor se responsabiliza pelos riscos da evicção, garantindo a origem, a boa e pacífica posse e o domínio do imóvel ora transacionado, comprometendo-se a defendê-lo de quaisquer turbações de terceiros e respondendo por todos os ônus decorrentes.',
      },
      {
        code: 'FIX006',
        title: 'Outorga da Escritura Definitiva',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 80,
        content:
          'A escritura definitiva de compra e venda será outorgada ao Comprador ou a quem este expressamente indicar, em data oportuna, condicionada impreterivelmente à quitação integral do preço ajustado neste instrumento.',
      },
      {
        code: 'FIX007',
        title: 'Despesas com Escrituração e Registro',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 81,
        content:
          'Todas as despesas relativas à lavratura da escritura definitiva, imposto de transmissão (ITBI), taxas, emolumentos, registro no Cartório de Imóveis, despachante e outras necessárias à transferência da propriedade correrão por conta exclusiva do Comprador.',
      },
      {
        code: 'FIX008',
        title: 'Foro de Eleição',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 100,
        content:
          'Para dirimir quaisquer questões oriundas ou relativas à interpretação ou execução deste contrato que não puderem ser resolvidas de forma extrajudicial e amigável, as partes elegem o foro da Comarca de {{operacao.foro}}, renunciando expressamente a qualquer outro, por mais privilegiado que seja.',
      },
      {
        code: 'FIN001',
        title: 'Financiamento Bancário - Aprovação',
        category: 'clausula_condicional',
        trigger_logic: 'comprador.financiamento == true',
        priority: 30,
        content:
          'A parcela de R$ {{financeiro.valor_financiamento}} será paga por meio de recursos provenientes de financiamento bancário imobiliário a ser obtido pelo Comprador junto à instituição {{financeiro.instituicao_financeira}} ou outra congênere de sua escolha.',
      },
      {
        code: 'FIN002',
        title: 'Prazo para Obtenção do Financiamento',
        category: 'clausula_condicional',
        trigger_logic: 'comprador.financiamento == true',
        priority: 31,
        content:
          'O Comprador terá o prazo estipulado de {{financeiro.prazo_financiamento}} dias, contados da assinatura deste instrumento, para protocolar e providenciar toda a documentação necessária à aprovação do crédito. A não obtenção do crédito por culpa exclusiva do Comprador ensejará a possibilidade de rescisão contratual e retenção do sinal/arras.',
      },
      {
        code: 'FIN003',
        title: 'Uso de Recursos do FGTS',
        category: 'clausula_condicional',
        trigger_logic: 'comprador.fgts == true',
        priority: 32,
        content:
          'Fica expressamente autorizada e prevista a liberação e saque de recursos das contas vinculadas do FGTS do Comprador para compor o pagamento da aquisição do imóvel, devendo este cumprir todas as normativas e exigências do Conselho Curador do FGTS e da Caixa Econômica Federal.',
      },
      {
        code: 'FIN004',
        title: 'Pagamento Parcelado Diretamente ao Vendedor',
        category: 'clausula_condicional',
        trigger_logic: 'financeiro.parcelas > 1',
        priority: 25,
        content:
          'O saldo remanescente do preço ajustado será pago em {{financeiro.parcelas}} parcelas mensais, sucessivas e corrigidas monetariamente, conforme pactuado pelas partes e especificado no quadro resumo.',
      },
      {
        code: 'FIN005',
        title: 'Multa de Inadimplência',
        category: 'clausula_condicional',
        trigger_logic: 'financeiro.parcelas > 1',
        priority: 26,
        content:
          'O eventual atraso no pagamento de qualquer parcela sujeitará o Comprador à multa moratória equivalente a 2% (dois por cento) sobre o valor total do débito em aberto, acrescida de juros de mora de 1% (um por cento) ao mês, incidentes pro rata die.',
      },
      {
        code: 'FIN006',
        title: 'Vencimento Antecipado da Dívida',
        category: 'clausula_condicional',
        trigger_logic: 'financeiro.parcelas > 1',
        priority: 27,
        content:
          'O atraso contínuo e ininterrupto superior a 30 (trinta) dias no pagamento de qualquer das parcelas estipuladas acarretará o vencimento imediato e antecipado de todo o saldo devedor vincendo, tornando o presente instrumento título executivo extrajudicial.',
      },
      {
        code: 'POS001',
        title: 'Posse Direta e Imediata',
        category: 'clausula_condicional',
        trigger_logic: 'posse.imediata == true',
        priority: 40,
        content:
          'A posse direta, justa e precária do imóvel é transmitida ao Comprador neste ato, mediante a tradição e entrega formal das chaves, momento a partir do qual este passará a arcar integralmente com todos os impostos, taxas, contas de consumo e condomínio incidentes sobre a unidade.',
      },
      {
        code: 'POS002',
        title: 'Transmissão da Posse Futura',
        category: 'clausula_condicional',
        trigger_logic: 'posse.imediata == false',
        priority: 40,
        content:
          'A posse direita do imóvel será integralmente transferida ao Comprador na data preestabelecida de {{posse.data_posse}}, devendo o imóvel ser entregue inteiramente livre e desocupado de pessoas ou coisas não constantes da negociação, condicionando-se tal ato ao pagamento da etapa correspondente do saldo devedor.',
      },
      {
        code: 'POS003',
        title: 'Multa Diária por Atraso na Desocupação',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.ocupado == true',
        priority: 41,
        content:
          'Na hipótese de o Vendedor não desocupar e entregar as chaves do imóvel na data expressamente aprazada, este incorrerá no pagamento de multa penal e não compensatória no valor de R$ {{posse.multa_desocupacao}} por dia de atraso, sem prejuízo da responsabilidade por eventuais perdas e danos causados.',
      },
      {
        code: 'POS004',
        title: 'Responsabilidade por Conservação até a Entrega',
        category: 'clausula_condicional',
        trigger_logic: 'posse.imediata == false',
        priority: 42,
        content:
          'Até a data e momento da efetiva entrega das chaves e imissão na posse pelo Comprador, o Vendedor obriga-se a zelar e manter o imóvel rigorosamente no mesmo estado de conservação em que se encontra nesta data, respondendo integralmente por deteriorações ou danos ocorridos no ínterim.',
      },
      {
        code: 'COM001',
        title: 'Pagamento da Comissão de Corretagem',
        category: 'protecao_comercial',
        trigger_logic: 'comissao.valor > 0',
        priority: 50,
        content:
          'Pela exitosa intermediação do presente negócio imobiliário, fica reconhecida como devida a comissão de corretagem, estabelecida no percentual de {{comissao.percentual}}% sobre o valor da transação, perfazendo o montante de R$ {{comissao.valor}}, devida exclusivamente pela parte comissionante.',
      },
      {
        code: 'COM002',
        title: 'Comissão Assegurada em Caso de Rescisão',
        category: 'protecao_comercial',
        trigger_logic: 'comissao.garantida == true',
        priority: 51,
        content:
          'Fica mutuamente reconhecido e aceito que a superveniente rescisão ou distrato deste instrumento por arrependimento, culpa ou infração de qualquer das partes não elidirá, sob nenhuma hipótese, a exigibilidade do pagamento integral da comissão de corretagem aos profissionais responsáveis pela aproximação útil das partes.',
      },
      {
        code: 'LOC001',
        title: 'Declaração e Ciência de Locação Vigente',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.locado == true',
        priority: 60,
        content:
          'O Comprador atesta e declara ter ciência inequívoca de que o imóvel objeto do presente contrato encontra-se atualmente locado a terceiros, existindo contrato formal de locação em plena vigência, cujo teor o Comprador analisou e aceitou.',
      },
      {
        code: 'LOC002',
        title: 'Prova de Renúncia ao Direito de Preferência do Locatário',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.locado == true',
        priority: 61,
        content:
          'O Vendedor declara e comprova cabalmente neste ato que o atual locatário do imóvel renunciou de forma tempestiva e expressa ao seu direito de preferência para a aquisição da unidade, conforme notificação e carta de renúncia assinadas e com firmas reconhecidas, cujas cópias foram entregues ao Comprador.',
      },
      {
        code: 'LOC003',
        title: 'Sub-rogação Automática no Contrato de Locação',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.locado == true && posse.imediata == true',
        priority: 62,
        content:
          'Com a assinatura deste compromisso e consequente transmissão da posse indireta, o Comprador sub-roga-se de pleno direito em todas as prerrogativas, direitos e deveres legais originários do Vendedor e decorrentes do referido contrato de locação vigente.',
      },
      {
        code: 'ONU001',
        title: 'Alienação Fiduciária Pendente e Responsabilidade por Baixa',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.financiado == true',
        priority: 70,
        content:
          'As partes atestam que o imóvel encontra-se gravado com cláusula de alienação fiduciária em garantia junto ao credor originário. O Vendedor assume o compromisso irrevogável de promover a total quitação e averbação de baixa do aludido gravame perante a matrícula, antecedendo a outorga da escritura definitiva.',
      },
      {
        code: 'ONU002',
        title: 'Ciência de Imóvel em Processo de Inventário',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.inventario == true',
        priority: 71,
        content:
          'As partes reconhecem ciência de que o bem alienado encontra-se em regular processo de inventário e partilha. A lavratura da escritura definitiva ocorrerá mediante expedição de competente Alvará Judicial autorizativo, responsabilizando-se o espólio ou os herdeiros pelo escorreito trâmite do feito.',
      },
      {
        code: 'ONU003',
        title: 'Assunção de Obrigação de Baixa de Ônus e Restrições',
        category: 'clausula_condicional',
        trigger_logic: 'imovel.onus == true',
        priority: 72,
        content:
          'Em virtude da constatação e ciência acerca da existência de apontamentos, penhoras, ações em curso ou demais restrições averbadas, o Vendedor obriga-se de forma exclusiva, pessoal e irrevogável a diligenciar e promover a integral e tempestiva baixa de todos os gravames de forma a tornar o imóvel perfeitamente livre e desembaraçado para transferência legal.',
      },
      {
        code: 'ONU004',
        title: 'Declaração de Venda em Caráter Ad Corpus',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 73,
        content:
          'A presente venda e compra processa-se expressamente sob a modalidade "ad corpus", restando estabelecido que as dimensões da área do imóvel são mencionadas apenas de forma referencial e enunciativa. Consequentemente, as partes abdicam de postular futuramente qualquer abatimento de preço, acréscimo de valor ou suplementação de área sob alegação de eventual divergência com a realidade física.',
      },
      {
        code: 'TRI001',
        title: 'Cabal Regularidade Fiscal, Tributária e Condominial',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 85,
        content:
          'O Vendedor declara formalmente, sob todas as sanções e penas estatuídas em lei, que inexistem pendências fiscais, tributárias, dívidas condominiais, cota extra, ou obrigações de natureza propter rem atreladas e incidentes sobre a referida propriedade imobiliária, responsabilizando-se pelo pagamento e quitação de qualquer débito relativo a fatos geradores anteriores à efetiva imissão na posse do Comprador.',
      },
      {
        code: 'LGP001',
        title: 'Autorização e Ciente sobre Tratamento de Dados (LGPD)',
        category: 'clausula_fixa',
        trigger_logic: 'sempre',
        priority: 95,
        content:
          'Em rigorosa adequação à Lei Geral de Proteção de Dados (Lei nº 13.709/18), os envolvidos declaram-se cientes e expressamente concordam que as suas informações e dados pessoais coletados neste instrumento ou em anexos complementares serão tratados exclusivamente com a finalidade de gestão, execução contratual, faturamento, e para o escorreito cumprimento de imperativos legais, fiscais, ou determinações de órgãos registrais e tabelionatos.',
      },
      {
        code: 'CAS001',
        title: 'Declaração de Anuência e Outorga do Cônjuge/Companheiro',
        category: 'clausula_condicional',
        trigger_logic: 'vendedor.estado_civil == "Casado"',
        priority: 11,
        content:
          'Intervém, expressa e conjuntamente no presente instrumento, na qualidade de anuente solidário, o cônjuge do Vendedor, Sr(a). {{vendedor.conjuge}}, outorgando sua irrevogável anuência uxória e consentimento material com os termos, preço, forma de pagamento e prazos entabulados para a venda, a fim de conferir inteira eficácia e validade ao presente negócio jurídico.',
      },
      {
        code: 'REP001',
        title: 'Regular Representação por Instrumento de Procuração Pública',
        category: 'clausula_condicional',
        trigger_logic: 'comprador.procurador == true || vendedor.procurador == true',
        priority: 12,
        content:
          'Neste ato negocial, a respectiva parte declara e comprova encontrar-se devidamente representada pelo seu outorgado procurador, constituído por força de instrumento público de procuração lavrado em Notas, dotado de poderes irrevogáveis, especiais, específicos e aptos a legitimar a alienação, aquisição, transigência e a subscrição formal deste compromisso de compra e venda.',
      },
    ]

    clauses.forEach((c) => {
      try {
        app.findFirstRecordByData('legal_knowledge', 'code', c.code)
      } catch (_) {
        const record = new Record(col)
        record.set('title', c.title)
        record.set('code', c.code)
        record.set('category', c.category)
        record.set('trigger_logic', c.trigger_logic)
        record.set('priority', c.priority)
        record.set('content', c.content)
        record.set('version', 1)
        app.save(record)
      }
    })
  },
  (app) => {
    const codes = [
      'FIX001',
      'FIX002',
      'FIX003',
      'FIX004',
      'FIX005',
      'FIX006',
      'FIX007',
      'FIX008',
      'FIN001',
      'FIN002',
      'FIN003',
      'FIN004',
      'FIN005',
      'FIN006',
      'POS001',
      'POS002',
      'POS003',
      'POS004',
      'COM001',
      'COM002',
      'LOC001',
      'LOC002',
      'LOC003',
      'ONU001',
      'ONU002',
      'ONU003',
      'ONU004',
      'TRI001',
      'LGP001',
      'CAS001',
      'REP001',
    ]
    codes.forEach((code) => {
      try {
        const record = app.findFirstRecordByData('legal_knowledge', 'code', code)
        app.delete(record)
      } catch (_) {}
    })
  },
)
