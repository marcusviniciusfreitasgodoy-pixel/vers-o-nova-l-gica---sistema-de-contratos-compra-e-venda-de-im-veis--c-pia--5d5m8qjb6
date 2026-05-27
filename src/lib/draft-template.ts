import { formatCurrency } from './formatters'

export function generateDraftText(data: any, user: any) {
  const {
    tipo,
    tipo_vendedor,
    tipo_comprador,
    nome_vendedor,
    cnpj_vendedor,
    representante_vendedor,
    cpf_vendedor,
    rg_vendedor,
    nacionalidade_vendedor,
    estado_civil_vendedor,
    profissao_vendedor,
    endereco_vendedor,
    nome_comprador,
    cnpj_comprador,
    representante_comprador,
    cpf_comprador,
    rg_comprador,
    nacionalidade_comprador,
    estado_civil_comprador,
    profissao_comprador,
    endereco_comprador,
    endereco_imovel,
    matricula_imovel,
    rgi_imovel,
    inscricao_municipal,
    area_total,
    vagas_garagem,
    valor_total,
    valor_sinal,
    valor_reforco,
    valor_complemento,
    valor_saldo,
    valor_financiado,
    instituicao_financeira,
    data_pagamento_saldo,
    tipo_documento,
    tipo_negociacao,
    situacao_juridica_imovel,
    condicao_suspensiva,
    cartorio,
    prazo_escritura,
    data_posse,
    percentual_multa,
    cidade,
    clausula_arrependimento,
    possui_financiamento,
    uso_fgts,
    imovel_ocupado,
    possui_torna,
    vendedor_casado,
    regime_bens,
    nome_conjuge,
    imovel_financiado,
    imovel_locado,
    imovel_inventario,
    possui_onus,
    valor_fgts,
    parcelas,
    prazo_pagamento,
    prazo_desocupacao,
    ocupacao_imovel,
    pep,
    procurador,
    matricula_atualizada,
    debitos_condominio,
    valor_condominio,
    valor_iptu_anual,
    valor_avaliacao,
    cep_imovel,
    bairro_imovel,
    cidade_imovel,
    numero_imovel,
    complemento_imovel,
    quartos,
    email_vendedor,
    telefone_vendedor,
    orgao_emissor_vendedor,
  } = data

  const dateNow = new Date().toLocaleDateString('pt-BR')
  const foro = cidade || cidade_imovel || '[Cidade/Estado]'

  if (tipo_documento === 'autorizacao_intermediacao') {
    const contratadoNome = user?.imobiliaria_nome || '[NOME DA IMOBILIÁRIA]'
    const contratadoDoc = user?.imobiliaria_documento || '[CNPJ/CPF]'
    const contratadoCreci = user?.creci || '[CRECI]'

    const addr =
      `${endereco_imovel || ''} ${numero_imovel || ''} ${complemento_imovel || ''}`.trim() ||
      '[Endereço]'

    const now = new Date()
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const dateStr = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`

    return `AUTORIZAÇÃO PARA DIVULGAÇÃO E VENDA DE IMÓVEL

CONTRATANTES

NOME: ${nome_vendedor || '[Nome]'}
RG: ${rg_vendedor || '[RG]'}
TELEFONES: ${telefone_vendedor || '[Telefone]'}
ORGÃO EMISSOR: ${orgao_emissor_vendedor || '[Órgão]'}
E-MAIL: ${email_vendedor || '[E-mail]'}
CPF: ${cpf_vendedor || '[CPF]'}

DESCRIÇÃO DO IMÓVEL

ENDEREÇO: ${addr}
BAIRRO: ${bairro_imovel || '[Bairro]'}
R$ CONDOMÍNIO: ${formatCurrency(valor_condominio || 0)}
CIDADE: ${cidade_imovel || '[Cidade]'}
R$ IPTU: ${formatCurrency(valor_iptu_anual || 0)}
VAGAS: ${vagas_garagem || '0'}
CEP: ${cep_imovel || '[CEP]'}
QUARTOS: ${quartos || '0'}

VALOR DE AVALIAÇÃO: R$ ${formatCurrency(valor_avaliacao || 0)}
VALOR DE VENDA: R$ ${formatCurrency(valor_total || 0)}

CONTRATADO: ${contratadoNome} CNPJ: ${contratadoDoc}

CONDIÇÕES

1. A presente Autorização de Venda, COM GESTÃO EXCLUSIVA, tem o seu amparo na Lei 6.530, Art. 20, item III, de 12/05/1978 e pela Resolução do COFECI no. 458/95 de 17/11/1995.

2. Entenda-se por GESTÃO EXCLUSIVA, a escolha do CONTRATADO, como responsável exclusivo pela Representação Comercial do imóvel perante o mercado. A ele caberá centralizar os contatos de possíveis interessados Clientes Diretos ou Corretores, acompanhar todas as visitas realizadas, atender outros Corretores interessados em estabelecer parceria comercial para venda do Imóvel e investir na divulgação do imóvel de forma ampla.

3. É concedida esta autorização pelo prazo de 90 dias, a contar desta data, nela também está incluída a veiculação de anúncios e fotos do imóvel em todos os meios de publicidade utilizados pelo CONTRATADO, prorrogada automaticamente pelo mesmo período, caso, após o término do citado prazo, não ocorra manifestação expressa dos CONTRATANTES.

OS CONTRATANTES SE COMPROMETEM A PAGAR AO CONTRATADO O PERCENTUAL DE 5% SOBRE O PREÇO DE VENDA EFETIVAMENTE TRANSACIONADO, A TÍTULO DE HONORÁRIOS DE CORRETAGEM, QUE SERÃO PAGOS NO ATO DO RECEBIMENTO DO VALOR FINANCIADO PELO ITAÚ UNIBANCO S.A.

4. A mesma remuneração será devida pelos CONTRATANTES se, durante a vigência desta autorização o proprietário realizar a venda do imóvel sem a ciência e acompanhamento do CONTRATADO ou se em até 180 dias após o término do prazo estabelecido neste instrumento, eles venham a realizar, por conta própria ou através de terceiros, a venda do imóvel objeto da presente autorização, com pretendentes apresentados ou indicados pelo CONTRATADO, conforme relação nominal que lhes será ou tenha sido entregue, relação essa obtida por meio de registro nas respectivas fichas de visita ao imóvel.

5. A única obrigação financeira do contratante para com a contratada é o pagamento de comissão de venda no valor de 5%, caso o imóvel seja efetivamente vendido, conforme previsto na clausula 3 e 4 deste acordo. Nenhum outro valor será devido, incluindo, mas não se limitando a: ressarcimentos, indenizações por prejuízos, ajuda de custo, remuneração por horas trabalhadas, entre outros.

6. Os CONTRATANTES se responsabilizam por todas as informações pessoais e de propriedade aqui prestadas acerca do imóvel objeto da presente Autorização.

7. Para dirimir eventuais dúvidas ou questões oriundas da presente Autorização, que não possam ser resolvidas de comum acordo entre as partes, fica eleito o foro da Comarca do Rio de Janeiro, RJ, com renúncia a qualquer outro, por mais privilegiado que seja.

8. O contratante reserva-se o direito de, unilateralmente de recusar qualquer proposta de venda que não lhe seja conveniente, sem que tal recusa implique em qualquer ônus ou custo adicional.

9. Este documento cancela e substitui a autorização anterior assinada em 3 de Dezembro de 2025

${foro}, ${dateStr}.

_________________________________________________
NOME: ${nome_vendedor || '[Nome]'}
CONTRATANTE(S)
CPF: ${cpf_vendedor || '[CPF]'}

_________________________________________________
CORRETOR: ${user?.name || '[Nome Corretor]'}
CONTRATADO
CRECI: ${contratadoCreci}
`
  }

  const vendedorQualificacao =
    tipo_vendedor === 'pj'
      ? `${nome_vendedor || '[Razão Social]'}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpj_vendedor || '[CNPJ]'}, com sede em ${endereco_vendedor || '[Endereço]'}, neste ato representada legalmente por ${representante_vendedor || '[Representante]'}`
      : `${nome_vendedor || '[Nome]'}, nacionalidade: ${nacionalidade_vendedor || '[Nacionalidade]'}, estado civil: ${estado_civil_vendedor || '[Estado Civil]'}, profissão: ${profissao_vendedor || '[Profissão]'}, portador do RG nº ${rg_vendedor || '[RG]'}, inscrito no CPF sob o nº ${cpf_vendedor || '[CPF]'}, residente e domiciliado em ${endereco_vendedor || '[Endereço]'}`

  const compradorQualificacao =
    tipo_comprador === 'pj'
      ? `${nome_comprador || '[Razão Social]'}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpj_comprador || '[CNPJ]'}, com sede em ${endereco_comprador || '[Endereço]'}, neste ato representada legalmente por ${representante_comprador || '[Representante]'}`
      : `${nome_comprador || '[Nome]'}, nacionalidade: ${nacionalidade_comprador || '[Nacionalidade]'}, estado civil: ${estado_civil_comprador || '[Estado Civil]'}, profissão: ${profissao_comprador || '[Profissão]'}, portador do RG nº ${rg_comprador || '[RG]'}, inscrito no CPF sob o nº ${cpf_comprador || '[CPF]'}, residente e domiciliado em ${endereco_comprador || '[Endereço]'}`

  let pgtoText = `O preço total, certo e ajustado é de ${formatCurrency(valor_total || 0)}, a ser pago da seguinte forma:\n`
  pgtoText += `- Sinal e princípio de pagamento: ${formatCurrency(valor_sinal || 0)}.\n`

  if (tipo === 'a_vista') {
    pgtoText += `- Saldo Restante: ${formatCurrency(valor_saldo || 0)}, com vencimento improrrogável em ${data_pagamento_saldo ? new Date(data_pagamento_saldo).toLocaleDateString('pt-BR') : '[data]'}.\n`
  } else {
    if (valor_reforco) pgtoText += `- Reforço de Sinal: ${formatCurrency(valor_reforco)}.\n`
    if (valor_complemento) pgtoText += `- Complemento: ${formatCurrency(valor_complemento)}.\n`
    pgtoText += `- Valor Financiado: ${formatCurrency(valor_financiado || 0)}${instituicao_financeira ? ` mediante crédito junto ao banco ${instituicao_financeira}` : ''}.\n`
  }
  if (possui_torna && possui_torna > 0)
    pgtoText += `- Valor da Torna (Diferença em Pecúnia): ${formatCurrency(possui_torna)}.\n`

  let baseText = ''
  const titulo =
    tipo_documento === 'promessa_cv'
      ? 'INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA'
      : tipo_documento === 'recibo_sinal'
        ? 'RECIBO DE SINAL E PRINCÍPIO DE PAGAMENTO'
        : 'INSTRUMENTO PARTICULAR DE COMPRA E VENDA DE IMÓVEL'

  baseText = `GODOY PRIME REALTY\nMINUTA DE CONTRATO\n\n`
  baseText += `${titulo}\n\n`
  baseText += `VENDEDOR: ${vendedorQualificacao}\n\n`
  if (vendedor_casado && tipo_vendedor === 'pf') {
    baseText += `ANUENTE: ${nome_conjuge || '[Nome do Cônjuge]'}, qualificando-se e declarando expressa concordância com a presente venda, casados sob o regime de ${regime_bens || '[Regime de Bens]'}.\n\n`
  }
  baseText += `COMPRADOR: ${compradorQualificacao}\n\n`

  baseText += `CLÁUSULA PRIMEIRA - DO OBJETO DO CONTRATO E DESCRIÇÃO DO IMÓVEL\nO objeto do presente contrato é o imóvel situado em ${endereco_imovel || '[Endereço do Imóvel]'}, Matrícula nº ${matricula_imovel || '[Matrícula]'}, registrado no ${cartorio || rgi_imovel || '[RGI]'}, Inscrição Municipal nº ${inscricao_municipal || '[IPTU]'}, possuindo área total de ${area_total || '[Área]'} m² e ${vagas_garagem || '[Vagas]'} vaga(s) de garagem.\n\n`

  let onusText = ''
  if (
    possui_onus ||
    imovel_financiado ||
    imovel_inventario ||
    imovel_locado ||
    situacao_juridica_imovel
  ) {
    onusText = 'O imóvel é prometido à venda na seguinte situação jurídica: '
    const details = []
    if (imovel_financiado) details.push('financiado/alienado')
    if (imovel_inventario) details.push('em processo de inventário')
    if (imovel_locado) details.push('atualmente locado')
    if (data.imovel_desocupado) details.push('desocupado')
    if (possui_onus) details.push('com ônus pendentes informados')
    if (situacao_juridica_imovel) details.push(situacao_juridica_imovel)
    onusText += details.join(', ') + '.\n\n'
  } else {
    onusText =
      'O VENDEDOR declara que o imóvel encontra-se livre e desembaraçado de quaisquer ônus reais, fiscais ou convencionais.\n\n'
  }
  baseText += `Parágrafo Único: ${onusText}`

  baseText += `CLÁUSULA SEGUNDA - DAS CONDIÇÕES DE PAGAMENTO E PREÇO\n${pgtoText}\n`

  let clauseCounter = 3
  const nextOrdinal = () => {
    const ordinals = [
      'TERCEIRA',
      'QUARTA',
      'QUINTA',
      'SEXTA',
      'SÉTIMA',
      'OITAVA',
      'NONA',
      'DÉCIMA',
      'DÉCIMA PRIMEIRA',
      'DÉCIMA SEGUNDA',
      'DÉCIMA TERCEIRA',
      'DÉCIMA QUARTA',
      'DÉCIMA QUINTA',
      'DÉCIMA SEXTA',
      'DÉCIMA SÉTIMA',
      'DÉCIMA OITAVA',
      'DÉCIMA NONA',
      'VIGÉSIMA',
    ]
    return ordinals[clauseCounter++ - 3] || `${clauseCounter}ª`
  }

  // Master Logic Engine
  if (tipo_documento === 'recibo_sinal' || tipo_documento === 'promessa_cv') {
    baseText += `CLÁUSULA ${nextOrdinal()} - DAS ARRAS E SINAL\nFica estipulado que o valor pago a título de sinal constitui Arras, regendo-se pelos artigos 417 ao 420 do Código Civil Brasileiro. Em caso de desistência imotivada do COMPRADOR, este perderá o valor integral do sinal em favor do VENDEDOR. Caso a desistência ocorra por parte do VENDEDOR, este deverá restituir o valor recebido em dobro.\n\n`
  }

  if (possui_financiamento || tipo === 'financiado' || tipo_negociacao === 'financiamento') {
    baseText += `CLÁUSULA ${nextOrdinal()} - DO FINANCIAMENTO BANCÁRIO E PRAZOS\nO COMPRADOR obriga-se a obter a aprovação e liberação do financiamento bancário no prazo máximo de 60 (sessenta) dias. Em caso de negativa de crédito exclusivamente por restrições cadastrais (SPC/Serasa) no nome do COMPRADOR, o presente contrato poderá ser rescindido de pleno direito pelo VENDEDOR.\n\n`
  }

  if (uso_fgts) {
    baseText += `CLÁUSULA ${nextOrdinal()} - DA UTILIZAÇÃO DO FGTS\nFica expressamente autorizada e pactuada a utilização de recursos vinculados à conta do FGTS do COMPRADOR no valor de ${valor_fgts ? formatCurrency(valor_fgts) : '[Valor]'} para composição do pagamento, responsabilizando-se o mesmo pela regularidade e preenchimento dos requisitos da Caixa Econômica Federal.\n\n`
  }

  if (imovel_ocupado) {
    baseText += `CLÁUSULA ${nextOrdinal()} - DA DESOCUPAÇÃO DO IMÓVEL\nO VENDEDOR declara que o imóvel encontra-se atualmente ocupado por ${ocupacao_imovel || 'si ou terceiros'} e compromete-se, de forma irrevogável, a desocupá-lo e entregá-lo totalmente livre de pessoas e coisas até ${prazo_desocupacao ? new Date(prazo_desocupacao).toLocaleDateString('pt-BR') : 'a data da posse'}, sob pena de multa diária.\n\n`
  }

  if (imovel_locado) {
    baseText += `CLÁUSULA ${nextOrdinal()} - DA LOCAÇÃO E PREFERÊNCIA\nO VENDEDOR declara que o imóvel encontra-se locado a terceiros, garantindo ter concedido o direito de preferência ao locatário nos moldes da Lei do Inquilinato (Lei 8.245/91), e que houve renúncia expressa a este direito. A desocupação ocorrerá nos termos acordados com o locatário.\n\n`
  }

  if (imovel_inventario) {
    baseText += `CLÁUSULA ${nextOrdinal()} - DO INVENTÁRIO\nAs partes declaram ciência de que o imóvel é objeto de partilha em processo de inventário. A lavratura da escritura pública definitiva de compra e venda fica condicionada à expedição do formal de partilha e respectivo registro.\n\n`
  }

  if (clausula_arrependimento) {
    baseText += `CLÁUSULA ${nextOrdinal()} - DO DIREITO DE ARREPENDIMENTO\nAs partes estipulam expressamente o direito de arrependimento pelo prazo improrrogável de 7 (sete) dias a contar da assinatura, garantindo a devolução integral e imediata dos valores pagos, sem a incidência de multas ou retenções.\n\n`
  } else {
    baseText += `CLÁUSULA ${nextOrdinal()} - DA IRREVOGABILIDADE E IRRETRATABILIDADE\nRessalvadas as hipóteses de inadimplemento previstas neste instrumento, o presente negócio é celebrado em caráter irrevogável e irretratável, não comportando direito de arrependimento, obrigando as partes e seus herdeiros.\n\n`
  }

  if (tipo_negociacao === 'permuta') {
    baseText += `CLÁUSULA ${nextOrdinal()} - DA DAÇÃO EM PAGAMENTO (PERMUTA)\nA presente negociação envolve, como parte do pagamento, a dação em pagamento (permuta) do(s) seguinte(s) bem(ns): [Descrever bem da permuta]. As partes garantem reciprocamente a propriedade e evicção dos bens permutados.\n\n`
  }

  baseText += `CLÁUSULA ${nextOrdinal()} - DA POSSE E ESCRITURA DEFINITIVA\nA posse direta será transferida ao COMPRADOR na data de ${data_posse ? new Date(data_posse).toLocaleDateString('pt-BR') : '[Data Posse]'}. A escritura definitiva deverá ser outorgada até ${prazo_escritura ? new Date(prazo_escritura).toLocaleDateString('pt-BR') : '[Data Escritura]'}.\n\n`

  baseText += `CLÁUSULA ${nextOrdinal()} - DAS PENALIDADES E MULTAS\nFica estipulada multa penal de ${percentual_multa || 10}% sobre o valor do contrato para a parte que infringir qualquer cláusula.\n\n`

  baseText += `CLÁUSULA ${nextOrdinal()} - DA COMISSÃO DE CORRETAGEM\nFica estipulado que, em caso de desistência imotivada de qualquer das partes após a assinatura deste instrumento, os honorários de intermediação (comissão de corretagem) serão devidos integralmente pela parte que der causa à rescisão, não cabendo restituição dos valores pagos à imobiliária ou corretores intervenientes.\n\n`

  // Mandatory Compliance Clauses
  baseText += `CLÁUSULA ${nextOrdinal()} - DA PREVENÇÃO À LAVAGEM DE DINHEIRO E FINANCIAMENTO AO TERRORISMO (PLD-FT)\nEm estrito atendimento ao Provimento CNJ nº 88/2019, o COMPRADOR declara expressamente que os recursos utilizados para o pagamento do preço têm origem lícita. As partes declaram ciência de que a presente operação poderá ser comunicada ao COAF, isentando os intermediadores de qualquer responsabilidade decorrente deste reporte legal.\n\n`
  baseText += `CLÁUSULA ${nextOrdinal()} - DA CONFORMIDADE COM A LGPD\nAs partes autorizam o tratamento de dados pessoais (coleta, armazenamento e compartilhamento com cartórios e correspondentes) exclusivamente para execução e formalização deste contrato, nos termos da Lei nº 13.709/2018.\n\n`
  baseText += `CLÁUSULA ${nextOrdinal()} - DA ASSINATURA ELETRÔNICA\nAs partes reconhecem como válida, plenamente eficaz e com força de título executivo extrajudicial a assinatura eletrônica do presente instrumento, independentemente de certificação digital ICP-Brasil, nos termos do art. 10, § 2º, da MP 2.200-2/2001.\n\n`
  baseText += `CLÁUSULA ${nextOrdinal()} - DO FORO DE ELEIÇÃO\nFica eleito o foro de ${foro} para dirimir quaisquer dúvidas.\n\n`

  baseText += `E, por estarem justos e contratados, assinam o presente em obediência às normas legais.\n\n${foro}, ${dateNow}.\n\n_________________________________________________\nVENDEDOR(ES)\n\n_________________________________________________\nCOMPRADOR(ES)\n`

  return baseText
}
