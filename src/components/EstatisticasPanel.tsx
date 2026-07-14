import React from 'react'
import { useEstatisticas } from '../hooks/useMetricas'
import { X, BarChart3 } from 'lucide-react'

export function EstatisticasPanel({ onClose }: { onClose: () => void }) {
  const { estatisticas, carregando } = useEstatisticas()

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <BarChart3 size={14} /> ESTATÍSTICAS
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}

        {estatisticas && (
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-borderRaw/20 rounded-lg p-3 text-center">
              <div className="text-lg font-mono font-bold">{estatisticas.hoje}</div>
              <div className="text-[9px] text-accent/40 uppercase tracking-widest">Hoje</div>
            </div>
            <div className="border border-borderRaw/20 rounded-lg p-3 text-center">
              <div className="text-lg font-mono font-bold">{estatisticas.ultimos7Dias}</div>
              <div className="text-[9px] text-accent/40 uppercase tracking-widest">Últimos 7 dias</div>
            </div>
            <div className="border border-borderRaw/20 rounded-lg p-3 text-center">
              <div className="text-lg font-mono font-bold">{estatisticas.usuariosUnicos7Dias}</div>
              <div className="text-[9px] text-accent/40 uppercase tracking-widest">Usuários únicos (7d)</div>
            </div>
            <div className="border border-borderRaw/20 rounded-lg p-3 text-center">
              <div className="text-lg font-mono font-bold">{estatisticas.totalGeral}</div>
              <div className="text-[9px] text-accent/40 uppercase tracking-widest">Total geral</div>
            </div>
          </div>
        )}

        <p className="text-[9px] text-accent/30">
          "Aberturas" contam toda vez que alguém abre o app numa aba nova — não é o mesmo que usuários únicos.
        </p>
      </div>
    </div>
  )
}