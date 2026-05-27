import pb from '@/lib/pocketbase/client'
import { generateContractDocx, regenerateContract } from '@/services/contracts'

export async function generateMinutaFromNegociacao(negociacaoId: string) {
  const neg = await pb.collection('gp_negociacoes').getOne(negociacaoId, {
    expand: 'imovel_id,case_id',
  })

  const partes = await pb.collection('gp_negociacao_partes').getFullList({
    filter: `negociacao_id = "${negociacaoId}"`,
    expand: 'pessoa_id',
  })

  const propostas = await pb.collection('gp_doc_propostas').getFullList({
    filter: `negociacao_id = "${negociacaoId}" && status = "aceita"`,
    sort: '-created',
  })
  const propostaAceita = propostas[0]

  const promessas = await pb.collection('gp_doc_promessa').getFullList({
    filter: `negociacao_id = "${negociacaoId}"`,
    sort: '-created',
  })
  const promessa = promessas[0]

  const vendedorRecord = partes.find((p) => p.papel === 'vendedor')?.expand?.pessoa_id
  const compradorRecord = partes.find((p) => p.papel === 'comprador')?.expand?.pessoa_id
  const imovel = neg.expand?.imovel_id

  const formatEnd = (end: any) => {
    if (!end) return ''
    return `${end.logradouro || ''}, ${end.numero || ''} ${end.complemento ? '- ' + end.complemento : ''}`.trim()
  }

  const payload = {
    tipo_documento: 'promessa_compra_venda',
    tipo_negociacao: neg.forma_pagamento === 'a_vista' ? 'a_vista' : 'financiamento',
    tipo: neg.forma_pagamento === 'a_vista' ? 'a_vista' : 'financiamento',

    // Comprador
    nome_comprador: compradorRecord?.nome_razao_social || '',
    cpf_comprador: compradorRecord?.cpf_cnpj || '',
    rg_comprador: compradorRecord?.rg_ie || '',
    orgao_emissor_comprador: compradorRecord?.orgao_emissor || '',
    nacionalidade_comprador: compradorRecord?.nacionalidade || 'brasileiro',
    estado_civil_comprador: compradorRecord?.estado_civil || '',
    profissao_comprador: compradorRecord?.profissao || '',
    email_comprador: compradorRecord?.email || '',
    telefone_comprador: compradorRecord?.telefone || '',
    endereco_comprador: formatEnd(compradorRecord?.endereco),
    cep_comprador: compradorRecord?.endereco?.cep || '',

    // Vendedor
    nome_vendedor: vendedorRecord?.nome_razao_social || '',
    cpf_vendedor: vendedorRecord?.cpf_cnpj || '',
    rg_vendedor: vendedorRecord?.rg_ie || '',
    orgao_emissor_vendedor: vendedorRecord?.orgao_emissor || '',
    nacionalidade_vendedor: vendedorRecord?.nacionalidade || 'brasileiro',
    estado_civil_vendedor: vendedorRecord?.estado_civil || '',
    profissao_vendedor: vendedorRecord?.profissao || '',
    email_vendedor: vendedorRecord?.email || '',
    telefone_vendedor: vendedorRecord?.telefone || '',
    endereco_vendedor: formatEnd(vendedorRecord?.endereco),
    cep_vendedor: vendedorRecord?.endereco?.cep || '',

    // Imóvel
    tipo_imovel: imovel?.tipo_imovel || 'apartamento',
    endereco_imovel: formatEnd(imovel?.endereco),
    numero_imovel: imovel?.endereco?.numero || '',
    complemento_imovel: imovel?.endereco?.complemento || '',
    bairro_imovel: imovel?.endereco?.bairro || '',
    cidade_imovel: imovel?.endereco?.cidade || '',
    estado_imovel: imovel?.endereco?.estado || '',
    cep_imovel: imovel?.endereco?.cep || '',
    matricula_imovel: imovel?.matricula_numero || '',
    cartorio_imovel: imovel?.cartorio_ri || '',
    inscricao_iptu: imovel?.inscricao_iptu || '',
    area_privativa: imovel?.area_privativa || 0,
    area_total: imovel?.area_total || 0,
    vagas_garagem: imovel?.vaga_garagem?.quantidade || 0,

    // Financeiro
    valor_total: promessa?.valor_total || propostaAceita?.valor_ofertado || neg.valor_total || 0,
    valor_sinal: promessa?.sinal_valor || propostaAceita?.previsao_sinal?.valor || 0,
    quantidade_parcelas: propostaAceita?.forma_pagamento_proposta?.parcelas || 0,
    valor_parcela: propostaAceita?.forma_pagamento_proposta?.valor_parcela || 0,
    tipo_arras: promessa?.arras_tipo || 'confirmatorias',

    // Configurações Adicionais da Promessa
    clausula_arrependimento: promessa?.direito_arrependimento ?? false,
    posse_data_entrega: promessa?.posse_data_entrega || null,

    // Misc
    clausula_lgpd: true,
    assinatura_eletronica: true,
  }

  const assembleResponse = await regenerateContract('new', payload)
  const docxResponse = await generateContractDocx({
    ...payload,
    minuta_texto: assembleResponse.minuta_texto,
  })

  if (neg.case_id) {
    try {
      const caseRecord = await pb.collection('cases').getOne(neg.case_id)
      if (caseRecord.estado_caso !== 'minuta_gerada' && caseRecord.estado_caso !== 'aprovado') {
        await pb.collection('cases').update(caseRecord.id, { estado_caso: 'minuta_gerada' })
        await pb.collection('case_state_transitions').create({
          case: caseRecord.id,
          user: pb.authStore.record?.id,
          previous_state: caseRecord.estado_caso,
          new_state: 'minuta_gerada',
          user_role: 'system',
        })
      }
    } catch (e) {
      console.error('Failed to update case state to minuta_gerada', e)
    }
  }

  return { assembleResponse, docxResponse }
}

export function downloadDocx(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
