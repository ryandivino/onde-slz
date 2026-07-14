import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNotificacoes } from '../hooks/useNotificacoes'
import { useAmizades } from '../hooks/useAmizades'
import { formatarTempoRelativo } from '../utils/tempo'
import { Check, X, Bell, MapPin, Megaphone, Calendar, UserPlus, Sparkles } from 'lucide-react'
import type { Notificacao } from '../hooks/useNotificacoes'

function IconePorTipo({ tipo }: { tipo: Notificacao['tipo'] }) {
  if (tipo === 'evento') return <Calendar size={14} className="text-accent/60" />
  if (tipo === 'atualizacao' || tipo === 'admin') return <Megaphone size={14} className="text-accent/60" />
  if (tipo === 'convite_role') return <UserPlus size={14} className="text-accent/60" />
  if (tipo === 'resumo_semanal') return <Sparkles size={14} className="text-accent/60" />
  return null
}

export function NotificationsPanel({
  onClose,
  onIrParaNoMapa
}: {
  onClose: () => void
  onIrParaNoMapa: (lat: number, lng: number) => void
}) {
  const { notificacoes, marcarTodasComoLidas, carregando } = useNotificacoes()
  const { aceitarPedido, removerOuRejeitar } = useAmizades()

  // Feedback imediato: assim que o usuário clica em aceitar/rejeitar, o card
  // some na hora — sem isso, dava a impressão de que nada tinha acontecido
  // (o usuário ficava clicando várias vezes sem saber se funcionou).
  const [processando, setProcessando] = useState<Set<number>>(new Set())
  const [removidas, setRemovidas] = useState<Set<number>>(new Set())

  useEffect(() => { marcarTodasComoLidas() }, [])

  const apagarNotificacao = async (notifId: number) => {
    await supabase.from('notificacoes').delete().eq('id', notifId)
  }

  const lidarComAceitar = async (notif: Notificacao) => {
    if (processando.has(notif.id) || !notif.referencia_id) return
    setProcessando((s) => new Set(s).add(notif.id))
    await aceitarPedido(notif.referencia_id)
    await apagarNotificacao(notif.id)
    setRemovidas((s) => new Set(s).add(notif.id))
  }

  const lidarComRejeitar = async (notif: Notificacao) => {
    if (processando.has(notif.id) || !notif.referencia_id) return
    setProcessando((s) => new Set(s).add(notif.id))
    await removerOuRejeitar(notif.referencia_id)
    await apagarNotificacao(notif.id)
    setRemovidas((s) => new Set(s).add(notif.id))
  }

  const notificacoesVisiveis = notificacoes.filter((n) => !removidas.has(n.id))

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Bell size={14} /> NOTIFICAÇÕES
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && notificacoesVisiveis.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">Nenhuma notificação por aqui ainda.</p>
        )}

        {notificacoesVisiveis.map((n) => {
          const estaProcessando = processando.has(n.id)
          return (
            <div key={n.id} className="border-b border-borderRaw/10 pb-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono flex items-center gap-1.5">
                  <IconePorTipo tipo={n.tipo} />
                  {n.titulo}
                </span>

                {n.tipo === 'pedido_amizade' && n.referencia_id && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {estaProcessando ? (
                      <span className="text-[9px] text-accent/40">...</span>
                    ) : (
                      <>
                        <button onClick={() => lidarComAceitar(n)} className="text-green-400"><Check size={15} /></button>
                        <button onClick={() => lidarComRejeitar(n)} className="text-red-400"><X size={15} /></button>
                      </>
                    )}
                  </div>
                )}

                {(n.tipo === 'post_amigo' || n.tipo === 'convite_role') && n.lat !== null && n.lng !== null && (
                  <button
                    onClick={() => { onIrParaNoMapa(n.lat!, n.lng!); onClose() }}
                    className="text-accent/50 hover:text-accent flex-shrink-0"
                  >
                    <MapPin size={13} />
                  </button>
                )}
              </div>

              {n.mensagem && <p className="text-[10px] text-accent/60 mt-0.5">{n.mensagem}</p>}
              <span className="text-[9px] text-accent/30 italic">{formatarTempoRelativo(n.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}