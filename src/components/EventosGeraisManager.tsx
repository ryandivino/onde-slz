import React, { useState } from 'react'
import { useEventosGerais } from '../hooks/useEventosGerais'
import { X, Calendar, Trash2 } from 'lucide-react'

export function EventosGeraisManager({ onClose }: { onClose: () => void }) {
  const { eventos, carregando, removerEvento } = useEventosGerais()
  const [termo, setTermo] = useState('')

  const eventosFiltrados = eventos.filter((e) => e.titulo.toLowerCase().includes(termo.toLowerCase()))

  const apagar = async (id: number, titulo: string) => {
    if (!confirm(`Apagar o evento "${titulo}"?`)) return
    await removerEvento(id)
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Calendar size={14} /> GERENCIAR EVENTOS
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por título..."
          className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && eventosFiltrados.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">Nenhum evento por aqui.</p>
        )}

        {eventosFiltrados.map((evento) => (
          <div key={evento.id} className="flex items-center justify-between gap-2 border border-borderRaw/20 rounded-lg p-3">
            <div className="min-w-0">
              <h2 className="text-xs font-mono truncate">{evento.titulo}</h2>
              <span className="text-[9px] text-accent/40">
                {new Date(evento.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button onClick={() => apagar(evento.id, evento.titulo)} className="text-red-400 hover:text-red-300 flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}