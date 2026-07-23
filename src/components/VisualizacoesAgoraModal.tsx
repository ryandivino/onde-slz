import React, { useEffect, useState } from 'react'
import { X, Heart, Eye } from 'lucide-react'
import { useVisualizacoesAgora } from '../hooks/useVisualizacoesAgora'
import type { Visualizacao } from '../hooks/useVisualizacoesAgora'

export function VisualizacoesAgoraModal({ pulsoId, onClose }: { pulsoId: number; onClose: () => void }) {
  const { buscarVisualizacoes } = useVisualizacoesAgora()
  const [lista, setLista] = useState<Visualizacao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarVisualizacoes(pulsoId).then((dados) => {
      setLista(dados)
      setCarregando(false)
    })
  }, [pulsoId])

  return (
    <div className="fixed inset-0 bg-black/60 z-[10002] flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface rounded-t-2xl p-5 space-y-3 max-h-[60vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Eye size={14} /> {lista.length} VISUALIZAÇÃO{lista.length !== 1 ? 'ÕES' : ''}
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && lista.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">Ninguém viu esse AGORA ainda.</p>
        )}

        {lista.map((v) => (
          <div key={v.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-background border border-borderRaw flex-shrink-0"
                style={v.avatarUrl ? { backgroundImage: `url('${v.avatarUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              />
              <span className="text-xs font-mono text-accent/80">@{v.apelido}</span>
            </div>
            {v.curtiu && <Heart size={14} className="text-red-500" fill="currentColor" />}
          </div>
        ))}
      </div>
    </div>
  )
}