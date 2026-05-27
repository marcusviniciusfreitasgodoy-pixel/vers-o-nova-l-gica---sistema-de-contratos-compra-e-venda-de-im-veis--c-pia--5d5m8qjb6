import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Ban } from 'lucide-react'
import { getRecibosSinal } from '@/services/gp_doc_recibo_sinal'
import { getPromessas } from '@/services/gp_doc_promessa'
import { getForcaEscrituras } from '@/services/gp_doc_contrato_forca_escritura'

export function DistratoAction({
  negociacaoId,
  estagio,
}: {
  negociacaoId: string
  estagio?: string
}) {
  const navigate = useNavigate()
  const [hasDocs, setHasDocs] = useState(false)

  useEffect(() => {
    if (estagio === 'distratado') return
    let mounted = true
    Promise.all([
      getRecibosSinal(negociacaoId),
      getPromessas(negociacaoId),
      getForcaEscrituras(negociacaoId),
    ])
      .then(([recibos, promessas, forcas]) => {
        if (!mounted) return
        if (recibos.length > 0 || promessas.length > 0 || forcas.length > 0) {
          setHasDocs(true)
        }
      })
      .catch(console.error)

    return () => {
      mounted = false
    }
  }, [negociacaoId, estagio])

  if (estagio === 'distratado') return null
  if (!hasDocs) return null

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => navigate(`/negociacao/${negociacaoId}/distrato`)}
    >
      <Ban className="w-4 h-4 mr-2" /> Distratar Negociação
    </Button>
  )
}
