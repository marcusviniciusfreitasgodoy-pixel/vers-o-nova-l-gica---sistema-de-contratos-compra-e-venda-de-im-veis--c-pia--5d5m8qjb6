import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  getCategories,
  generateChecklistHTML,
  migrateChecklistCompliance,
} from '@/lib/checklist-generator'
import { updateContractData } from '@/services/contracts'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

export function ChecklistEditor({
  contract,
  onUpdate,
}: {
  contract: any
  onUpdate: (data: any) => void
}) {
  const { user } = useAuth()
  const [compliance, setCompliance] = useState<Record<string, boolean>>(() =>
    migrateChecklistCompliance(contract.checklist_compliance),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const migrated = migrateChecklistCompliance(contract.checklist_compliance)
    if (JSON.stringify(migrated) !== JSON.stringify(contract.checklist_compliance || {})) {
      setCompliance(migrated)
      const newData = { ...contract, checklist_compliance: migrated }
      const newHtml = generateChecklistHTML(newData)
      updateContractData(contract.id, {
        checklist_compliance: migrated,
        minuta_texto: newHtml,
      })
        .then(() => {
          onUpdate({ ...newData, minuta_texto: newHtml })
        })
        .catch(() => {})
    }
  }, [contract.checklist_compliance, contract.id])

  const vendedor = contract?.nome_vendedor || '_______________________'
  const comprador = contract?.nome_comprador || '_______________________'
  const endereco = contract?.endereco_imovel || '_______________________'

  const handleToggle = async (key: string, checked: boolean) => {
    const newCompliance = { ...compliance, [key]: checked }
    setCompliance(newCompliance)

    try {
      setSaving(true)
      const newData = { ...contract, checklist_compliance: newCompliance }
      const newHtml = generateChecklistHTML(newData)
      await updateContractData(contract.id, {
        checklist_compliance: newCompliance,
        minuta_texto: newHtml,
      })
      onUpdate({ ...newData, minuta_texto: newHtml })
    } catch (e) {
      toast.error('Erro ao salvar item do checklist')
      setCompliance(compliance) // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-8 bg-white rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto my-4 relative">
      {saving && (
        <div className="absolute top-4 right-4 bg-white/90 p-1 rounded-full shadow-sm z-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-8">
        {user?.imobiliaria_logo ? (
          <img
            src={pb.files.getUrl(user, user.imobiliaria_logo)}
            alt="Logo Imobiliária"
            className="h-[65px] object-contain mb-6"
          />
        ) : (
          <h2 className="text-2xl font-bold text-[#0C2340] mb-6">
            {user?.imobiliaria_nome || 'GODOY PRIME REALTY'}
          </h2>
        )}
        <h1 className="text-[16pt] font-bold text-[#0C2340] mb-4 uppercase text-center">
          Checklist Documental
        </h1>
        <div className="w-full h-[1px] bg-[#D4AF37] mb-6"></div>
        {user?.header_content && (
          <div className="text-sm font-bold text-slate-500 whitespace-pre-wrap text-center mb-4">
            {user.header_content.replace(/Assessoria Jurídica Imobiliária/gi, '')}
          </div>
        )}
      </div>

      <Tabs defaultValue="completo" className="w-full mb-8">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full mb-6 bg-slate-100 h-auto p-1 gap-1">
          <TabsTrigger
            value="completo"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-sm py-2"
          >
            Completo
          </TabsTrigger>
          <TabsTrigger
            value="vendedor_imovel"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-sm py-2"
          >
            Vendedor e Imóvel
          </TabsTrigger>
          <TabsTrigger
            value="comprador"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-sm py-2"
          >
            Comprador
          </TabsTrigger>
        </TabsList>

        {(['completo', 'vendedor_imovel', 'comprador'] as const).map((segment) => (
          <TabsContent key={segment} value={segment} className="mt-0 outline-none">
            <p className="text-[12pt] text-slate-700 text-justify mb-8 leading-relaxed">
              {segment === 'vendedor_imovel' && (
                <>
                  O presente checklist relaciona a documentação necessária do imóvel localizado em{' '}
                  <strong>{endereco}</strong> e de seu(s) Vendedor(es) <strong>{vendedor}</strong>.
                </>
              )}
              {segment === 'comprador' && (
                <>
                  O presente checklist relaciona a documentação necessária do(s) Comprador(es){' '}
                  <strong>{comprador}</strong>.
                </>
              )}
              {segment === 'completo' && (
                <>
                  O presente checklist tem por finalidade relacionar a documentação necessária para
                  a análise de risco e conformidade jurídica (Due Diligence) na operação de compra e
                  venda do imóvel localizado em <strong>{endereco}</strong>, figurando como
                  Vendedor(a) <strong>{vendedor}</strong> e como Comprador(a){' '}
                  <strong>{comprador}</strong>.
                </>
              )}
            </p>
            {getCategories(contract, segment).map((cat, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-md p-6 mb-6">
                <h3 className="text-[14pt] sm:text-[16pt] font-bold text-[#0C2340] border-b-2 border-[#D4AF37] pb-3 mb-5 uppercase">
                  {cat.title}
                </h3>
                <div className="space-y-4">
                  {cat.items.map((item, j) => {
                    const key = `${cat.title} - ${item.title}`
                    const isChecked = !!compliance[key]
                    return (
                      <label
                        key={j}
                        className="flex items-start space-x-4 cursor-pointer group p-3 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(c) => handleToggle(key, c === true)}
                          className="mt-1 w-5 h-5 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37] data-[state=checked]:text-white"
                        />
                        <div className="flex flex-col flex-1">
                          <span
                            className={`text-[12pt] font-bold leading-tight mb-1 ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[11pt] leading-relaxed ${isChecked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}
                          >
                            {item.desc}
                          </span>
                          {isChecked ? (
                            <span className="text-xs font-bold text-[#D4AF37] mt-2">
                              ✓ COLETADO
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-orange-600 mt-2">
                              ⚠️ PENDENTE
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {user?.footer_content && (
        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 whitespace-pre-wrap">
            {user.footer_content.replace(/Assessoria Jurídica Imobiliária/gi, '')}
          </p>
        </div>
      )}
    </div>
  )
}
