import React from 'react'
import { useDenuncias } from '../hooks/useDenuncias'
import { supabase } from '../supabase'
import { formatarTempoRelativo } from '../utils/tempo'
import { X, Flag, Trash2 } from 'lucide-react'

export function DenunciasManager({ onClose }: { onClose: () => void }) {
  const { resumo, carregando, recarregarResumo } = useDenuncias()

  const deletar = async (tipo: 'pulso' | 'evento', alvoId: number) => {
    if (!confirm('Remover isso definitivamente?')) return
    await supabase.from(tipo === 'pulso' ? 'pulsos' : 'eventos').delete().eq('id', alvoId)
    await recarregarResumo()
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Flag size={14} /> DENÚNCIAS
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && resumo.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">Nenhum post ou evento denunciado por aqui.</p>
        )}

        {resumo.map((r) => (
          <div key={`${r.tipo}-${r.alvo_id}`} className="border border-borderRaw/20 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">
                {r.total_denuncias} {r.total_denuncias === 1 ? 'DENÚNCIA' : 'DENÚNCIAS'} · {r.tipo === 'evento' ? 'EVENTO' : 'POST'}
              </span>
              <button onClick={() => deletar(r.tipo, r.alvo_id)} className="text-red-400 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
            <h2 className="text-xs font-mono">{r.titulo}</h2>
            {r.descricao && <p className="text-xs text-accent/70">"{r.descricao}"</p>}
            <span className="text-[9px] text-accent/30 italic">{formatarTempoRelativo(r.post_created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}