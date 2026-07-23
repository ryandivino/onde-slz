import React, { useEffect, useState } from 'react'
import { formatarTempoRelativo } from '../utils/tempo'
import { Bell, MapPin, Megaphone, Calendar, UserPlus, Sparkles, UserCheck, X } from 'lucide-react'
import type { Notificacao } from '../hooks/useNotificacoes'
import { PerfilPublicoModal } from './PerfilPublicoModal'

function IconePorTipo({ tipo }: { tipo: Notificacao['tipo'] }) {
  if (tipo === 'evento') return <Calendar size={14} className="text-accent/60" />
  if (tipo === 'atualizacao' || tipo === 'admin') return <Megaphone size={14} className="text-accent/60" />
  if (tipo === 'convite_role') return <UserPlus size={14} className="text-accent/60" />
  if (tipo === 'resumo_semanal') return <Sparkles size={14} className="text-accent/60" />
  if (tipo === 'seguidor') return <UserCheck size={14} className="text-accent/60" />
  return null
}

export function NotificationsPanel({
  notificacoes,
  marcarTodasComoLidas,
  carregando,
  onClose,
  onIrParaNoMapa
}: {
  notificacoes: Notificacao[]
  marcarTodasComoLidas: () => void
  carregando: boolean
  onClose: () => void
  onIrParaNoMapa: (lat: number, lng: number) => void
}) {
  const [perfilPublicoAlvo, setPerfilPublicoAlvo] = useState<string | null>(null)

  // Marca como lida assim que o painel abre — o estado já é compartilhado
  // com o sino no header (ambos vêm do mesmo useNotificacoes no App.tsx),
  // então o número some na hora, sem precisar recarregar a página.
  useEffect(() => { marcarTodasComoLidas() }, [])

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-1 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2 mb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Bell size={14} /> NOTIFICAÇÕES
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && notificacoes.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">Nenhuma notificação por aqui ainda.</p>
        )}

        {notificacoes.map((n) => (
          <div
            key={n.id}
            onClick={() => { if (n.criado_por) setPerfilPublicoAlvo(n.criado_por) }}
            className={`border-b border-borderRaw/10 py-3 ${n.criado_por ? 'cursor-pointer hover:bg-background/40 rounded-lg px-1' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-mono flex items-center gap-1.5">
                <IconePorTipo tipo={n.tipo} />
                {n.titulo}
              </span>

              {(n.tipo === 'post_amigo' || n.tipo === 'convite_role' || n.tipo === 'evento') && n.lat !== null && n.lng !== null && (
                <button
                  onClick={(e) => { e.stopPropagation(); onIrParaNoMapa(n.lat!, n.lng!); onClose() }}
                  className="text-accent/50 hover:text-accent flex-shrink-0"
                >
                  <MapPin size={13} />
                </button>
              )}
            </div>

            {n.mensagem && <p className="text-[10px] text-accent/60 mt-0.5">{n.mensagem}</p>}
            <span className="text-[9px] text-accent/30 italic">{formatarTempoRelativo(n.created_at)}</span>
          </div>
        ))}
      </div>

      {perfilPublicoAlvo && (
        <PerfilPublicoModal userId={perfilPublicoAlvo} onClose={() => setPerfilPublicoAlvo(null)} />
      )}
    </div>
  )
}