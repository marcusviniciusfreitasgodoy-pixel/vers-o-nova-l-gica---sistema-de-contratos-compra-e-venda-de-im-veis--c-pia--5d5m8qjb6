import { useFormContext } from 'react-hook-form'
import { Info, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { FormSelect, FormInput, FormCurrencyInput } from '@/components/FormInput'
import { PLATAFORMA_OPTIONS } from '@/lib/constants'

export function JuridicoTab({ tipoDocumento }: { tipoDocumento: string }) {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext()
  const tipoNegociacao = watch('tipo_negociacao')
  const isPermutaDacao = tipoNegociacao === 'permuta' || tipoNegociacao === 'dacao'
  const isAutorizacao = tipoDocumento === 'autorizacao_intermediacao'
  const isDistrato = tipoDocumento === 'distrato'
  const isTermos = ['termo_entrega_chaves', 'termo_posse'].includes(tipoDocumento)

  return (
    <div className="space-y-6 animate-in fade-in">
      {isTermos && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">Datas e Entrega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="data_posse"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormLabel
                      className={tipoDocumento === 'termo_posse' ? 'text-red-600 font-bold' : ''}
                    >
                      Data da Imissão na Posse
                      {tipoDocumento === 'termo_posse' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
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
                          A partir desta data os impostos (IPTU) e taxas serão divididos{' '}
                          <i>pro rata</i>, transferindo a responsabilidade tributária ao adquirente
                          conforme Art. 130 do CTN.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="entrega_chaves"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={
                      tipoDocumento === 'termo_entrega_chaves' ? 'text-red-600 font-bold' : ''
                    }
                  >
                    Data da Entrega de Chaves
                    {tipoDocumento === 'termo_entrega_chaves' && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="data_assinatura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Assinatura do Termo</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {!isDistrato && !isTermos && (
        <>
          <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">
            Termos Legais e Específicos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isAutorizacao && (
              <div className="flex flex-col gap-3 md:col-span-2">
                <div className="md:w-1/2 pr-2">
                  <FormSelect
                    name="tipo_negociacao"
                    label="Tipo de Negociação"
                    required
                    options={[
                      { label: 'À Vista', value: 'a_vista' },
                      { label: 'Financiamento', value: 'financiamento' },
                      { label: 'Investidor', value: 'investidor' },
                      { label: 'Alto Padrão', value: 'alto_padrao' },
                      { label: 'Permuta', value: 'permuta' },
                      { label: 'Dação em Pagamento', value: 'dacao' },
                    ]}
                  />
                </div>
                {tipoNegociacao === 'investidor' && (
                  <Alert className="bg-blue-50 text-blue-900 border-blue-200 mt-1">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Foco em Investidor</AlertTitle>
                    <AlertDescription>
                      O contrato priorizará a segurança do investimento, cessão de direitos e
                      conformidade com normas PLD-FT (Prevenção à Lavagem de Dinheiro e
                      Financiamento ao Terrorismo).
                    </AlertDescription>
                  </Alert>
                )}
                {tipoNegociacao === 'alto_padrao' && (
                  <Alert className="bg-amber-50 text-amber-900 border-amber-200 mt-1">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Foco em Alto Padrão</AlertTitle>
                    <AlertDescription>
                      O contrato terá foco em descrições técnicas detalhadas, especificações de
                      acabamento e cronogramas rigorosos de entrega.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {isAutorizacao && (
              <FormSelect
                name="gestao_exclusiva"
                label="Gestão Exclusiva"
                required
                options={[
                  { label: 'Com Exclusividade', value: 'com_exclusiva' },
                  { label: 'Sem Exclusividade', value: 'sem_exclusiva' },
                ]}
              />
            )}
          </div>

          {isPermutaDacao && (
            <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-semibold text-lg pb-2 text-[#0C2340]">
                {tipoNegociacao === 'dacao'
                  ? 'Dados do Bem / Imóvel em Dação'
                  : 'Dados do Imóvel de Permuta'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  name="permuta_imovel_endereco"
                  label={
                    tipoNegociacao === 'dacao'
                      ? 'Descrição / Endereço Completo do Bem'
                      : 'Endereço Completo do Imóvel'
                  }
                  required
                />
                <FormInput
                  name="permuta_imovel_matricula"
                  label={
                    tipoNegociacao === 'dacao'
                      ? 'Matrícula / Registro / Documento'
                      : 'Matrícula / RGI'
                  }
                  required
                />
                <FormCurrencyInput
                  name="permuta_imovel_valor"
                  label="Valor de Avaliação (R$)"
                  required
                />
                <FormCurrencyInput name="possui_torna" label="Valor da Torna / Diferença (R$)" />
                <div className="sm:col-span-2">
                  <FormField
                    control={control}
                    name="permuta_imovel_detalhes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Adicionais</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {!isAutorizacao && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="clausula_arrependimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col border p-4 rounded-md bg-white">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer font-medium">
                        Incluir Cláusula de Arrependimento
                      </FormLabel>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 ml-6">
                      Permite que as partes desistam do negócio sob condições legais específicas,
                      normalmente envolvendo a perda ou devolução do sinal (arras).
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="posse_imediata"
                render={({ field }) => (
                  <FormItem className="flex flex-col border p-4 rounded-md bg-white">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex items-center space-x-2 !mt-0">
                        <FormLabel className="cursor-pointer font-medium">
                          Posse Imediata na Assinatura
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
                              Impacta diretamente a responsabilidade civil e tributária (divisão pro
                              rata). O comprador assume os riscos e despesas do imóvel (IPTU,
                              condomínio) a partir da imissão na posse, mesmo antes do registro da
                              escritura no RGI.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 ml-6">
                      O comprador recebe as chaves e o direito de usar o imóvel imediatamente após a
                      assinatura.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="responsabilidade_pro_rata"
                render={({ field }) => (
                  <FormItem className="flex flex-col border p-4 rounded-md bg-white sm:col-span-2">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex items-center space-x-2 !mt-0">
                        <FormLabel className="cursor-pointer font-medium">
                          Responsabilidade Pro Rata (IPTU/Condomínio)
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
                              Cláusula expressa definindo que as despesas e tributos do imóvel serão
                              rateados proporcionalmente entre as partes até a exata data de entrega
                              das chaves e imissão na posse (Art. 130, CTN).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          {!isAutorizacao && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">
                Assinatura e Resolução de Conflitos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={control}
                  name="assinatura_eletronica"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 mt-8">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Assinatura Eletrônica</FormLabel>
                    </FormItem>
                  )}
                />
                <FormSelect
                  name="plataforma_assinatura"
                  label="Plataforma de Assinatura"
                  options={PLATAFORMA_OPTIONS}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={control}
                  name="arbitragem"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 border p-4 rounded-md flex-1 bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex items-center space-x-2 !mt-0">
                        <FormLabel className="cursor-pointer font-medium">
                          Cláusula de Arbitragem
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
                              Método privado de resolução de conflitos onde um terceiro imparcial
                              (árbitro) toma uma decisão final. Diferencia-se do Judiciário
                              tradicional pela maior celeridade, confidencialidade e especialidade
                              técnica, embora possa envolver custos iniciais maiores.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="mediacao"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 border p-4 rounded-md flex-1 bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex items-center space-x-2 !mt-0">
                        <FormLabel className="cursor-pointer font-medium">
                          Cláusula de Mediação
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
                              Processo colaborativo focado em acordo voluntário. É mais rápido e
                              menos custoso que o Judiciário tradicional, preservando
                              relacionamentos e focando em soluções mutuamente benéficas sem
                              imposição de decisão.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </>
      )}

      {isDistrato && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">
            Detalhes do Distrato
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField
              control={control}
              name="data_distrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Efetiva do Distrato</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="motivo_distrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Rescisão</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descreva o motivo pelo qual o contrato está sendo rescindido"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">Compliance</h3>
        <FormField
          control={control}
          name="clausula_lgpd"
          render={({ field }) => (
            <FormItem
              className={`flex items-center space-x-2 p-4 rounded-lg border ${errors.clausula_lgpd ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-200'}`}
            >
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className={`data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white ${errors.clausula_lgpd ? 'border-red-500' : ''}`}
                />
              </FormControl>
              <div className="flex flex-col space-y-1 !mt-0">
                <FormLabel
                  className={`cursor-pointer font-medium leading-tight ${errors.clausula_lgpd ? 'text-red-700' : 'text-emerald-900'}`}
                >
                  Consentimento LGPD (Obrigatório)
                </FormLabel>
                {errors.clausula_lgpd && (
                  <p className="text-[0.8rem] font-medium text-red-500">
                    {errors.clausula_lgpd.message as string}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
