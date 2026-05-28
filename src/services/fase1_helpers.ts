import pb from '@/lib/pocketbase/client'

export async function fetchStep1Data(negociacaoId: string) {
  const neg = await pb.collection('gp_negociacoes').getOne(negociacaoId)

  let autorizacao: any = null
  try {
    autorizacao = await pb
      .collection('gp_doc_autorizacao')
      .getFirstListItem(`negociacao_id="${negociacaoId}"`)
  } catch {
    /* intentionally ignored */
  }

  const partes = await pb
    .collection('gp_negociacao_partes')
    .getFullList({ filter: `negociacao_id="${negociacaoId}"` })

  const vendParte = partes.find((p) => p.papel === 'vendedor')
  let vendedor: any = null
  if (vendParte?.pessoa_id) {
    try {
      vendedor = await pb.collection('gp_pessoas').getOne(vendParte.pessoa_id)
    } catch {
      /* intentionally ignored */
    }
  }

  const conjParte = partes.find((p) => p.papel === 'conjuge_vendedor')
  let conjuge: any = null
  if (conjParte?.pessoa_id) {
    try {
      conjuge = await pb.collection('gp_pessoas').getOne(conjParte.pessoa_id)
    } catch {
      /* intentionally ignored */
    }
  }

  let imovel: any = null
  if (neg.imovel_id) {
    try {
      imovel = await pb.collection('gp_imoveis').getOne(neg.imovel_id)
    } catch {
      /* intentionally ignored */
    }
  }

  return { negociacao: neg, autorizacao, vendedor, conjuge, imovel }
}

export async function saveStep1Data(negociacaoId: string, formData: any, existing: any) {
  let caseId = formData.case_id || existing.negociacao?.case_id

  if (!caseId) {
    try {
      const authUser = pb.authStore.record
      let filter = ''
      if (authUser?.company) {
        filter = `company="${authUser.company}"`
      }
      const firstCase = await pb.collection('cases').getFirstListItem(filter, { sort: '-created' })
      caseId = firstCase.id

      await pb.collection('gp_negociacoes').update(negociacaoId, { case_id: caseId })
    } catch {
      throw new Error(
        'Não foi possível associar um Caso (Case) automaticamente à negociação. Crie um caso primeiro.',
      )
    }
  }

  let vendId = existing.vendedor?.id
  const vendData = {
    nome_razao_social: formData.vendedor_nome,
    cpf_cnpj: formData.vendedor_cpf,
    estado_civil: formData.vendedor_estado_civil,
    tipo_pessoa: 'fisica',
    case_id: caseId,
    papel_na_operacao: 'vendedor',
  }
  if (vendId) {
    await pb.collection('gp_pessoas').update(vendId, vendData)
  } else {
    const v = await pb.collection('gp_pessoas').create(vendData)
    vendId = v.id
    await pb
      .collection('gp_negociacao_partes')
      .create({ negociacao_id: negociacaoId, pessoa_id: vendId, papel: 'vendedor' })
  }

  if (
    formData.vendedor_estado_civil === 'casado' ||
    formData.vendedor_estado_civil === 'uniao_estavel'
  ) {
    let conjId = existing.conjuge?.id
    const conjData = {
      nome_razao_social: formData.conjuge_nome,
      cpf_cnpj: formData.conjuge_cpf,
      tipo_pessoa: 'fisica',
      case_id: caseId,
      papel_na_operacao: 'outro',
    }
    if (conjId) {
      await pb.collection('gp_pessoas').update(conjId, conjData)
    } else {
      const c = await pb.collection('gp_pessoas').create(conjData)
      await pb
        .collection('gp_negociacao_partes')
        .create({ negociacao_id: negociacaoId, pessoa_id: c.id, papel: 'conjuge_vendedor' })
    }
  }

  let imovId = existing.imovel?.id
  const imovData = {
    tipo_imovel: formData.imovel_tipo,
    endereco: {
      logradouro: formData.imovel_endereco,
      cidade: formData.imovel_cidade,
      uf: formData.imovel_estado,
    },
    case_id: caseId,
  }
  if (imovId) {
    await pb.collection('gp_imoveis').update(imovId, imovData)
  } else {
    const i = await pb.collection('gp_imoveis').create(imovData)
    imovId = i.id
    await pb
      .collection('gp_negociacoes')
      .update(negociacaoId, { imovel_id: imovId, case_id: caseId })
  }

  const autData = {
    negociacao_id: negociacaoId,
    tipo_autorizacao: formData.tipo_autorizacao,
    prazo_vigencia_dias: Number(formData.prazo_vigencia_dias),
    comissao_percentual: Number(formData.comissao_percentual || 0),
    comissao_valor_fixo: Number(formData.comissao_valor_fixo || 0),
    responsavel_comissao: formData.responsavel_comissao,
    momento_pagamento: formData.momento_pagamento,
    valor_pretendido_imovel: Number(formData.valor_pretendido_imovel),
  }
  if (existing.autorizacao?.id) {
    await pb.collection('gp_doc_autorizacao').update(existing.autorizacao.id, autData)
  } else {
    await pb.collection('gp_doc_autorizacao').create(autData)
  }
}

export async function fetchStep2Data(negociacaoId: string) {
  const data = await fetchStep1Data(negociacaoId)
  let ficha: any = null
  try {
    ficha = await pb
      .collection('gp_doc_ficha_cadastral')
      .getFirstListItem(`negociacao_id="${negociacaoId}"`)
  } catch {
    /* intentionally ignored */
  }
  return { ...data, ficha }
}

export async function saveStep2Data(negociacaoId: string, formData: any, existing: any) {
  if (existing.vendedor?.id) {
    await pb.collection('gp_pessoas').update(existing.vendedor.id, {
      regime_bens: formData.regime_bens,
      rg_ie: formData.rg_ie,
      orgao_emissor: formData.orgao_emissor,
      nacionalidade: formData.nacionalidade,
      profissao: formData.profissao,
    })
  }
  if (existing.imovel?.id) {
    let onus = []
    try {
      if (formData.onus_gravames) onus = JSON.parse(formData.onus_gravames)
    } catch (e) {
      onus = [{ tipo: 'texto', descricao: formData.onus_gravames }]
    }

    await pb.collection('gp_imoveis').update(existing.imovel.id, {
      condominio_nome: formData.condominio_nome,
      area_privativa: Number(formData.area_privativa || 0),
      area_total: Number(formData.area_total || 0),
      fracao_ideal: Number(formData.fracao_ideal || 0),
      inscricao_iptu: formData.inscricao_iptu,
      onus_gravames: onus,
    })
  }
  const fichaData = { negociacao_id: negociacaoId, status_ficha: 'completa' }
  if (existing.ficha?.id) {
    await pb.collection('gp_doc_ficha_cadastral').update(existing.ficha.id, fichaData)
  } else {
    await pb.collection('gp_doc_ficha_cadastral').create(fichaData)
  }
}

export async function fetchStep3Data(negociacaoId: string) {
  let checklist: any = null
  try {
    checklist = await pb
      .collection('gp_doc_checklist')
      .getFirstListItem(`negociacao_id="${negociacaoId}" && momento_exigencia="viabilidade_fase1"`)
  } catch {
    /* intentionally ignored */
  }

  if (!checklist) {
    checklist = await pb.collection('gp_doc_checklist').create({
      negociacao_id: negociacaoId,
      momento_exigencia: 'viabilidade_fase1',
      itens: [
        {
          descricao: 'Matrícula atualizada do imóvel',
          categoria_parte: 'imovel',
          status: 'pendente',
          obrigatorio: true,
        },
        {
          descricao: 'Certidão de ônus reais',
          categoria_parte: 'imovel',
          status: 'pendente',
          obrigatorio: true,
        },
      ],
    })
  }
  return { checklist }
}

export async function finishPhase1(negociacaoId: string) {
  const neg = await pb.collection('gp_negociacoes').getOne(negociacaoId)
  await pb.collection('gp_negociacoes').update(negociacaoId, {
    estagio: 'proposta',
    case_id: neg.case_id,
  })
}
