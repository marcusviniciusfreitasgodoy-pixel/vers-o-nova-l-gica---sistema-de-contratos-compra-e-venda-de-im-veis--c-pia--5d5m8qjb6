import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Endereco {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
}

export interface RepresentanteProcuracao {
  procurador_id?: string
  escritura_procuracao?: string
  data?: string
}

export interface GPPessoa extends RecordModel {
  tipo_pessoa?: 'fisica' | 'juridica'
  nome_razao_social: string
  cpf_cnpj: string
  rg_ie?: string
  orgao_emissor?: string
  nacionalidade?: string
  estado_civil?: 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo' | 'separado'
  regime_bens?:
    | 'comunhao_parcial'
    | 'comunhao_universal'
    | 'separacao_total'
    | 'participacao_final'
    | 'nao_aplicavel'
  profissao?: string
  email?: string
  telefone?: string
  endereco?: Endereco
  reside_exterior?: boolean
  representante_procuracao?: RepresentanteProcuracao
  case_id?: string
  papel_na_operacao?: string
  possui_representacao?: boolean
  observacoes?: string
}

export const getGPPessoas = () => pb.collection<GPPessoa>('gp_pessoas').getFullList()
export const getGPPessoasByCase = (caseId: string) =>
  pb.collection<GPPessoa>('gp_pessoas').getFullList({ filter: `case_id = "${caseId}"` })
export const getGPPessoa = (id: string) => pb.collection<GPPessoa>('gp_pessoas').getOne(id)
export const createGPPessoa = (data: Partial<GPPessoa>) =>
  pb.collection<GPPessoa>('gp_pessoas').create(data)
export const updateGPPessoa = (id: string, data: Partial<GPPessoa>) =>
  pb.collection<GPPessoa>('gp_pessoas').update(id, data)
export const deleteGPPessoa = (id: string) => pb.collection('gp_pessoas').delete(id)
