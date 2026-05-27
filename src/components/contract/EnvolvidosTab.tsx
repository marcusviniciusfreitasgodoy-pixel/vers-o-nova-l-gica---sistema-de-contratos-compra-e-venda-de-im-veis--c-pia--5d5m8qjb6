import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormInput, FormMaskedInput, FormSelect } from '@/components/FormInput'
import { ESTADO_CIVIL_OPTIONS, REGIME_BENS_OPTIONS } from '@/lib/constants'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function EnvolvidosTab({ tipoDocumento }: { tipoDocumento: string }) {
  const { watch, control } = useFormContext()
  const tipoComprador = watch('tipo_comprador')
  const estCivilC = watch('estado_civil_comprador')
  const uniaoEstavelC = watch('comprador_uniao_estavel')
  const vendPj = watch('vendedor_pj')
  const estCivilV = watch('estado_civil_vendedor')
  const uniaoEstavelV = watch('vendedor_uniao_estavel')

  const isAutorizacao = tipoDocumento === 'autorizacao_intermediacao'
  const isDistrato = tipoDocumento === 'distrato'

  return (
    <div className="space-y-6 animate-in fade-in">
      {isDistrato && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4 border border-blue-200">
          <strong>Dados Importados:</strong> Como este é um distrato, os dados das partes são
          carregados do contrato original.
        </div>
      )}

      {!isAutorizacao && (
        <Card className="border-[#0C2340]/10 shadow-sm">
          <CardHeader className="bg-[#0C2340]/5 pb-4">
            <CardTitle className="text-[#0C2340] text-lg">1. Comprador</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="tipo_comprador"
                label="Tipo"
                disabled={isDistrato}
                required
                options={[
                  { label: 'Pessoa Física', value: 'pf' },
                  { label: 'Pessoa Jurídica', value: 'pj' },
                ]}
              />
              <FormInput
                name="nome_comprador"
                label={tipoComprador === 'pj' ? 'Razão Social' : 'Nome Completo'}
                disabled={isDistrato}
                required
              />
            </div>
            {tipoComprador === 'pj' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormMaskedInput
                  name="cnpj_comprador"
                  label="CNPJ"
                  maskType="cnpj"
                  disabled={isDistrato}
                  required
                />
                <FormInput
                  name="representante_comprador"
                  label="Representante Legal"
                  disabled={isDistrato}
                />
                <FormInput
                  name="email_comprador"
                  label="E-mail"
                  type="email"
                  disabled={isDistrato}
                  required
                />
                <FormMaskedInput
                  name="telefone_comprador"
                  label="Telefone"
                  maskType="phone"
                  disabled={isDistrato}
                />
                <FormMaskedInput
                  name="cep_comprador"
                  label="CEP"
                  maskType="cep"
                  disabled={isDistrato}
                />
                <FormInput name="endereco_comprador" label="Endereço" disabled={isDistrato} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormMaskedInput
                  name="cpf_comprador"
                  label="CPF"
                  maskType="cpf"
                  disabled={isDistrato}
                  required
                />
                <FormInput name="rg_comprador" label="RG" disabled={isDistrato} />
                <FormInput
                  name="email_comprador"
                  label="E-mail"
                  type="email"
                  disabled={isDistrato}
                  required
                />
                <FormMaskedInput
                  name="telefone_comprador"
                  label="Telefone"
                  maskType="phone"
                  disabled={isDistrato}
                />
                <FormMaskedInput
                  name="cep_comprador"
                  label="CEP"
                  maskType="cep"
                  disabled={isDistrato}
                />
                <FormInput name="endereco_comprador" label="Endereço" disabled={isDistrato} />
                <FormSelect
                  name="estado_civil_comprador"
                  label="Estado Civil"
                  options={ESTADO_CIVIL_OPTIONS}
                  disabled={isDistrato}
                  required
                />
                <FormField
                  control={control}
                  name="comprador_uniao_estavel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 sm:mt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isDistrato}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer text-sm !mt-0">
                        Vive em União Estável?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {(estCivilC === 'Casado' || estCivilC === 'Casada' || uniaoEstavelC) && (
                  <FormSelect
                    name="regime_bens_comprador"
                    label="Regime Bens"
                    options={REGIME_BENS_OPTIONS}
                    disabled={isDistrato}
                  />
                )}
              </div>
            )}
            {(estCivilC === 'Casado' || estCivilC === 'Casada' || uniaoEstavelC) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded bg-slate-50 animate-in slide-in-from-top-2 duration-300">
                <FormInput
                  name="nome_conjuge_comprador"
                  label="Nome do Cônjuge/Companheiro(a)"
                  disabled={isDistrato}
                />
                <FormMaskedInput
                  name="cpf_conjuge_comprador"
                  label="CPF Cônjuge"
                  maskType="cpf"
                  disabled={isDistrato}
                />
                <FormInput name="rg_conjuge_comprador" label="RG Cônjuge" disabled={isDistrato} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[#D4AF37]/20 shadow-sm">
        <CardHeader className="bg-[#D4AF37]/10 pb-4">
          <CardTitle className="text-[#0C2340] text-lg">
            {isAutorizacao ? '1. Vendedor / Proprietário' : '2. Vendedor'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <FormField
            control={control}
            name="vendedor_pj"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isDistrato}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">
                  Vendedor é Pessoa Jurídica (PJ)
                </FormLabel>
              </FormItem>
            )}
          />
          <FormInput
            name="nome_vendedor"
            label={vendPj ? 'Razão Social' : 'Nome Completo'}
            disabled={isDistrato}
            required
          />
          {vendPj ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormMaskedInput
                name="cnpj_vendedor"
                label="CNPJ"
                maskType="cnpj"
                disabled={isDistrato}
                required
              />
              <FormInput
                name="representante_vendedor"
                label="Representante Legal"
                disabled={isDistrato}
              />
              <FormInput
                name="email_vendedor"
                label="E-mail"
                type="email"
                disabled={isDistrato}
                required
              />
              <FormMaskedInput
                name="telefone_vendedor"
                label="Telefone"
                maskType="phone"
                disabled={isDistrato}
              />
              <FormMaskedInput
                name="cep_vendedor"
                label="CEP"
                maskType="cep"
                disabled={isDistrato}
              />
              <FormInput name="endereco_vendedor" label="Endereço" disabled={isDistrato} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormMaskedInput
                name="cpf_vendedor"
                label="CPF"
                maskType="cpf"
                disabled={isDistrato}
                required
              />
              <FormInput name="rg_vendedor" label="RG" disabled={isDistrato} />
              <FormInput
                name="email_vendedor"
                label="E-mail"
                type="email"
                disabled={isDistrato}
                required
              />
              <FormMaskedInput
                name="telefone_vendedor"
                label="Telefone"
                maskType="phone"
                disabled={isDistrato}
              />
              <FormMaskedInput
                name="cep_vendedor"
                label="CEP"
                maskType="cep"
                disabled={isDistrato}
              />
              <FormInput name="endereco_vendedor" label="Endereço" disabled={isDistrato} />
              <FormSelect
                name="estado_civil_vendedor"
                label="Estado Civil"
                options={ESTADO_CIVIL_OPTIONS}
                disabled={isDistrato}
                required
              />
              <FormField
                control={control}
                name="vendedor_uniao_estavel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 sm:mt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isDistrato}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer text-sm !mt-0">
                      Vive em União Estável?
                    </FormLabel>
                  </FormItem>
                )}
              />
              {(estCivilV === 'Casado' || estCivilV === 'Casada' || uniaoEstavelV) && (
                <FormSelect
                  name="regime_bens_vendedor"
                  label="Regime Bens"
                  options={REGIME_BENS_OPTIONS}
                  disabled={isDistrato}
                />
              )}
            </div>
          )}
          {(estCivilV === 'Casado' || estCivilV === 'Casada' || uniaoEstavelV) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded bg-slate-50 animate-in slide-in-from-top-2 duration-300">
              <FormInput
                name="conjuge_vendedor"
                label="Nome do Cônjuge/Companheiro(a)"
                disabled={isDistrato}
              />
              <FormMaskedInput
                name="cpf_conjuge_vendedor"
                label="CPF Cônjuge"
                maskType="cpf"
                disabled={isDistrato}
              />
              <FormInput name="rg_conjuge_vendedor" label="RG Cônjuge" disabled={isDistrato} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 border-t space-y-4">
        <h3 className="font-semibold text-lg text-[#0C2340]">Compliance e Prevenção</h3>
        <FormField
          control={control}
          name="pep"
          render={({ field }) => (
            <FormItem className="flex flex-col border p-4 rounded-md bg-white">
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isDistrato}
                  />
                </FormControl>
                <div className="flex items-center space-x-2 !mt-0">
                  <FormLabel className="cursor-pointer font-medium">
                    Pessoa Politicamente Exposta (PEP)
                  </FormLabel>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="cursor-help"
                    >
                      <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] text-sm p-3">
                      <p>
                        Marque se algum dos envolvidos (comprador, vendedor, sócios ou procuradores)
                        é ou foi nos últimos 5 anos Pessoa Politicamente Exposta. Isso inclui
                        detentores de cargos públicos relevantes e seus familiares próximos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
