import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { FormInput, FormSelect, FormFileInput } from '@/components/FormInput'

export function ImovelTab({ tipoDocumento }: { tipoDocumento?: string }) {
  const { control, watch } = useFormContext()
  const inventario = watch('imovel_inventario')
  const locado = watch('imovel_locado')
  const isTermos = ['termo_entrega_chaves', 'termo_posse'].includes(tipoDocumento || '')

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormSelect
          name="tipo_imovel"
          label="Tipo de Imóvel"
          required
          options={[
            { label: 'Apartamento', value: 'Apartamento' },
            { label: 'Casa', value: 'Casa' },
            { label: 'Terreno', value: 'Terreno' },
            { label: 'Comercial', value: 'Comercial' },
            { label: 'Cobertura', value: 'Cobertura' },
            { label: 'Sala Comercial', value: 'Sala Comercial' },
          ]}
        />
        <FormInput
          name="matricula_imovel"
          label="Nº da Matrícula"
          required={
            ![
              'autorizacao_intermediacao',
              'distrato',
              'checklist_documental',
              'ficha_cadastral',
            ].includes(tipoDocumento || '')
          }
        />
        <FormInput name="cartorio_imovel" label="Cartório (RGI)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="endereco_imovel"
          label="Logradouro"
          required={tipoDocumento !== 'distrato'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <FormInput name="numero_imovel" label="Número" required={tipoDocumento !== 'distrato'} />
          <FormInput name="complemento_imovel" label="Complemento" />
          <FormInput name="cep_imovel" label="CEP" required={tipoDocumento !== 'distrato'} />
        </div>
        <FormInput name="bairro_imovel" label="Bairro" required={tipoDocumento !== 'distrato'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormInput name="cidade_imovel" label="Cidade" required={tipoDocumento !== 'distrato'} />
          <FormInput name="estado_imovel" label="UF" required={tipoDocumento !== 'distrato'} />
        </div>
      </div>

      <div className="pt-4 border-t space-y-4">
        <h3 className="font-semibold text-lg text-[#0C2340]">Situação e Características</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <FormInput name="area_privativa" label="Área Priv. (m²)" type="number" />
          <FormInput name="area_total" label="Área Total (m²)" type="number" />
          <FormInput name="quartos" label="Quartos" type="number" />
          <FormInput name="vagas_garagem" label="Vagas" type="number" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'imovel_inventario', label: 'Em Inventário' },
            { name: 'imovel_locado', label: 'Imóvel Locado' },
            { name: 'imovel_ocupado', label: 'Imóvel Ocupado' },
            { name: 'imovel_desocupado', label: 'Imóvel Desocupado' },
          ].map((fieldData) => (
            <FormField
              key={fieldData.name}
              control={control}
              name={fieldData.name}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">{fieldData.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
        {inventario && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded bg-amber-50 border-amber-200">
            <FormInput name="numero_processo_inventario" label="Nº Processo" />
            <FormInput name="inventariante" label="Inventariante" />
          </div>
        )}
        {locado && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded bg-blue-50 border-blue-200">
            <FormInput name="prazo_locacao" label="Prazo da Locação" />
            <FormField
              control={control}
              name="preferencia_locatario"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 mt-8">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Locatário renunciou preferência?
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {isTermos && (
        <div className="pt-4 border-t space-y-4 animate-in slide-in-from-bottom-2">
          <h3 className="font-semibold text-lg text-[#0C2340]">Detalhes da Vistoria e Entrega</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <FormInput
                name="estado_conservacao"
                label="Estado de Conservação"
                placeholder="Ex: Imóvel entregue com pintura nova, piso em bom estado..."
                required={tipoDocumento === 'termo_posse'}
              />
              <p className="text-xs text-slate-500">
                Obrigatório para Termo de Posse. Fundamental para atestar as condições físicas no
                momento da entrega das chaves.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              name="leitura_agua"
              label="Leitura do Hidrômetro (Água)"
              placeholder="Ex: 1234 m³"
            />
            <FormInput
              name="leitura_luz"
              label="Leitura do Relógio (Luz)"
              placeholder="Ex: 5678 kWh"
            />
            <FormInput name="leitura_gas" label="Leitura do Gás" placeholder="Ex: 910 m³" />
          </div>
        </div>
      )}

      <div className="pt-4 border-t space-y-4">
        <h3 className="font-semibold text-lg text-[#0C2340]">Documentação (Uploads Opcionais)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormFileInput name="matricula_file" label="Matrícula Atualizada" accept=".pdf,image/*" />
          <FormFileInput name="iptu_file" label="Capa do IPTU" accept=".pdf,image/*" />
        </div>
      </div>
    </div>
  )
}
