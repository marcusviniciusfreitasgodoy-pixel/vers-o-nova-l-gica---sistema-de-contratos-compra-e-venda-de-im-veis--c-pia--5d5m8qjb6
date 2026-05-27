import { RecordModel } from 'pocketbase'

export interface GpDocContratoForcaEscritura extends RecordModel {
  negociacao_id: string
  credor_fiduciario_id?: string
  valor_total: number
  valor_financiado?: number
  valor_recursos_proprios?: number
  numero_parcelas?: number
  taxa_juros_aa?: number
  indice_correcao?: 'tr' | 'ipca' | 'igpm' | 'outro'
  sistema_amortizacao?: 'sac' | 'price'
  garantia_fiduciaria_valor?: number
  clausula_execucao_extrajudicial?: string
  base_legal_forca_escritura?: string
  seguros_obrigatorios?: any
  despesas_itbi?: string
  despesas_registro?: string
  cartorio_registro?: string
  foro_eleicao?: string
}

export interface GpDocMinutaEscritura extends RecordModel {
  negociacao_id: string
  promessa_origem_id?: string
  valor_transacao: number
  forma_quitacao?: string
  declaracao_quitacao?: boolean
  valor_venal_itbi?: number
  guia_itbi_numero?: string
  tabelionato_destino?: string
  cartorio_registro?: string
  status_minuta?: 'rascunho' | 'revisada' | 'enviada_cartorio'
  certidoes_anexas?: any
}

export interface GpDocTermoChaves extends RecordModel {
  negociacao_id: string
  data_entrega: string
  estado_conservacao?: string
  leitura_agua?: string
  leitura_luz?: string
  leitura_gas?: string
  transferencia_taxas_data?: string
  vistoria_anexa?: any
  itens_entregues?: any
}

export interface GpDocTermoPosse extends RecordModel {
  negociacao_id: string
  data_imissao_posse: string
  tipo_posse?: 'direta_livre' | 'com_locatario'
  imovel_locado?: boolean
  dados_locacao?: any
  responsabilidades_transferidas?: any
}

export interface GpDocDistrato extends RecordModel {
  negociacao_id: string
  contrato_origem_tipo?: 'recibo' | 'preliminar' | 'promessa' | 'forca_escritura'
  contrato_origem_id?: string
  motivo?: string
  valores_pagos?: number
  valor_devolver?: number
  valor_reter?: number
  prazo_devolucao?: string
  quitacao_mutua?: boolean
  foro_eleicao?: string
  base_legal_retencao?: string
}
