import { useFormContext } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

export function RevisaoTab({ tipoDocumento }: { tipoDocumento: string }) {
  const { getValues } = useFormContext()
  const values = getValues()

  const isAutorizacao = tipoDocumento === 'autorizacao_intermediacao'
  const isDistrato = tipoDocumento === 'distrato'
  const isTermos = ['termo_entrega_chaves', 'termo_posse', 'declaracoes_complementares'].includes(
    tipoDocumento,
  )
  const isFichaCadastral = tipoDocumento === 'ficha_cadastral'

  return (
    <div className="space-y-6 animate-in fade-in">
      <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">
        Revisão dos Dados (Apenas Leitura)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isAutorizacao && (
          <Card className="border-[#0C2340]/10 shadow-sm">
            <CardContent className="p-4 space-y-2 text-sm">
              <h4 className="font-bold text-[#D4AF37] mb-2 text-base">Comprador</h4>
              <p>
                <strong>Nome/Razão:</strong> {values.nome_comprador || '-'}
              </p>
              <p>
                <strong>CPF/CNPJ:</strong> {values.cpf_comprador || values.cnpj_comprador || '-'}
              </p>
              <p>
                <strong>E-mail:</strong> {values.email_comprador || '-'}
              </p>
              <p>
                <strong>Estado Civil:</strong> {values.estado_civil_comprador || '-'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#D4AF37]/20 shadow-sm">
          <CardContent className="p-4 space-y-2 text-sm">
            <h4 className="font-bold text-[#D4AF37] mb-2 text-base">
              {isAutorizacao ? 'Vendedor / Proprietário' : 'Vendedor'}
            </h4>
            <p>
              <strong>Nome/Razão:</strong> {values.nome_vendedor || '-'}
            </p>
            <p>
              <strong>CPF/CNPJ:</strong> {values.cpf_vendedor || values.cnpj_vendedor || '-'}
            </p>
            <p>
              <strong>E-mail:</strong> {values.email_vendedor || '-'}
            </p>
            <p>
              <strong>Estado Civil:</strong> {values.estado_civil_vendedor || '-'}
            </p>
          </CardContent>
        </Card>

        {!isDistrato && (
          <Card className="md:col-span-2 border-[#0C2340]/10 shadow-sm">
            <CardContent className="p-4 space-y-2 text-sm">
              <h4 className="font-bold text-[#D4AF37] mb-2 text-base">Imóvel & Negociação</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p>
                    <strong>Matrícula:</strong> {values.matricula_imovel || '-'}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {values.endereco_imovel || '-'},{' '}
                    {values.numero_imovel}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {values.tipo_imovel || '-'}
                  </p>
                </div>
                {!isTermos && !isFichaCadastral && (
                  <div className="space-y-2">
                    <p>
                      <strong>Valor Estimado:</strong>{' '}
                      {formatCurrency(values.valor_total) || 'R$ 0,00'}
                    </p>
                    {!isAutorizacao && (
                      <p>
                        <strong>Sinal:</strong> {formatCurrency(values.valor_sinal) || 'R$ 0,00'}
                      </p>
                    )}
                    {!isAutorizacao && (
                      <p>
                        <strong>Financiamento:</strong>{' '}
                        {formatCurrency(values.valor_financiamento) || 'R$ 0,00'}
                      </p>
                    )}{' '}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2 border-[#D4AF37]/20 shadow-sm bg-[#D4AF37]/5">
          <CardContent className="p-4 space-y-2 text-sm">
            <h4 className="font-bold text-[#D4AF37] mb-2 text-base">Compliance e Assinatura</h4>
            <div className="flex gap-4 flex-wrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${values.clausula_lgpd ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
              >
                LGPD: {values.clausula_lgpd ? 'Aceito' : 'Pendente'}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${values.assinatura_eletronica ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
              >
                Assinatura:{' '}
                {values.assinatura_eletronica
                  ? values.plataforma_assinatura || 'Eletrônica'
                  : 'Física'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
