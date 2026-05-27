migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    try {
      app.findFirstRecordByData(
        'legal_knowledge',
        'title',
        'Modelo Padrão - Promessa de Compra e Venda - Godoy Prime Realty',
      )
      return // already exists
    } catch (_) {}

    const record = new Record(col)
    record.set('title', 'Modelo Padrão - Promessa de Compra e Venda - Godoy Prime Realty')
    record.set('category', 'boas_praticas')

    const content = `GODOY PRIME REALTY
═══════════════════════════════════════════════════════════════════════════

INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA

Por este instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Promessa de Compra e Venda, mediante as cláusulas e condições a seguir estabelecidas:

Cláusula 1ª - Das Partes
VENDEDOR: [NOME_COMPLETO_VENDEDOR], nacionalidade: [NACIONALIDADE], estado civil: [ESTADO_CIVIL], profissão: [PROFISSAO], portador do RG nº [NUMERO_RG] expedido por [ORGAO_EMISSOR_RG], inscrito no CPF sob o nº [CPF_VENDEDOR], residente e domiciliado em [ENDERECO_COMPLETO_VENDEDOR]. E-mail: [EMAIL_VENDEDOR], Telefone: [TELEFONE_VENDEDOR].
COMPRADOR: [NOME_COMPLETO_COMPRADOR], nacionalidade: [NACIONALIDADE_COMPRADOR], estado civil: [ESTADO_CIVIL_COMPRADOR], profissão: [PROFISSAO_COMPRADOR], portador do RG nº [NUMERO_RG_COMPRADOR] expedido por [ORGAO_EMISSOR_RG_COMPRADOR], inscrito no CPF sob o nº [CPF_COMPRADOR], residente e domiciliado em [ENDERECO_COMPLETO_COMPRADOR]. E-mail: [EMAIL_COMPRADOR], Telefone: [TELEFONE_COMPRADOR].

Cláusula 2ª - Do Objeto
O objeto do presente contrato é o imóvel (tipo: [TIPO_IMOVEL]), situado em [ENDERECO_COMPLETO_IMOVEL], bairro [BAIRRO], CEP [CEP], Matrícula nº [NUMERO_MATRICULA], registrado no RGI de [NUMERO_RGI], Inscrição Municipal nº [INSCRICAO_MUNICIPAL], possuindo área total de [AREA_TOTAL] m², área construída de [AREA_CONSTRUIDA] m² e [NUMERO_VAGAS] vaga(s) de garagem.

Cláusula 3ª - Do Preço e Condições de Pagamento
O preço certo e ajustado para a presente compra e venda é de [VALOR_TOTAL] ([VALOR_TOTAL_POR_EXTENSO]), que será pago da seguinte forma:
- Sinal: [VALOR_SINAL], na data de [DATA_PAGAMENTO_SINAL], forma de pagamento: [FORMA_PAGAMENTO_SINAL].
- Saldo: [VALOR_SALDO], conforme acordado.
- Comissão de Corretagem: [VALOR_COMISSAO], equivalente a [PERCENTUAL_COMISSAO] do valor de venda.

Cláusula 4ª - Da Documentação
As partes obrigam-se a apresentar as seguintes certidões e documentos: Ônus Reais, Quitação Fiscal, Quitação Condominial e Negativas Pessoais.

Cláusula 5ª - Das Obrigações
O VENDEDOR obriga-se a transferir o domínio, garantir a habitabilidade e quitar impostos até a data da posse. O COMPRADOR obriga-se ao pagamento do preço, custos de registro e impostos futuros.

Cláusula 6ª - Da Posse
A posse do imóvel será transferida com a entrega das chaves, sujeita à penalidade de [VALOR_MULTA_DIARIA] por dia em caso de atraso na desocupação ou entrega.

Cláusula 7ª - Das Penalidades
Em caso de rescisão por culpa do COMPRADOR, perderá este o sinal pago. Sendo a culpa do VENDEDOR, devolverá o sinal em dobro. Em caso de atraso, haverá multa de [PERCENTUAL_MULTA] e juros de [PERCENTUAL_JUROS] ao mês.

Cláusula 8ª - Da Rescisão
Caso qualquer das partes descumpra o estipulado, a parte inocente poderá notificar a infratora para sanar a falha, sob pena de rescisão de pleno direito.

Cláusula 9ª - Da Legislação
Este contrato é regido pelo Código Civil Brasileiro aplicável à espécie.

Cláusula 10ª - Do Foro
Fica eleito o Foro da Comarca do Rio de Janeiro para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.

═══════════════════════════════════════════════════════════════════════════
Rio de Janeiro, [DATA_ASSINATURA].`

    record.set('content', content)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData(
        'legal_knowledge',
        'title',
        'Modelo Padrão - Promessa de Compra e Venda - Godoy Prime Realty',
      )
      app.delete(record)
    } catch (_) {}
  },
)
