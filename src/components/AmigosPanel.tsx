import React, { useState } from 'react'
import { useAmizades } from '../hooks/useAmizades'
import type { PerfilBasico } from '../hooks/useAmizades'
import { UserPlus, UserMinus, Check, X, Users } from 'lucide-react'
import { PerfilPublicoModal } from './PerfilPublicoModal'

export function AmigosPanel({ onClose }: { onClose: () => void }) {
  const { amigos, pedidosRecebidos, buscarUsuarios, enviarPedido, aceitarPedido, removerOuRejeitar } = useAmizades()
  const [perfilPublicoAlvo, setPerfilPublicoAlvo] = useState<string | null>(null)
  const [desfazendo, setDesfazendo] = useState<Set<number>>(new Set())

  const lidarComDesfazerAmizade = async (amizadeId: number, apelido: string) => {
    if (!confirm(`Desfazer amizade com @${apelido}?`)) return
    setDesfazendo((s) => new Set(s).add(amizadeId))
    await removerOuRejeitar(amizadeId)
  }

  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<PerfilBasico[]>([])
  const [buscando, setBuscando] = useState(false)
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [processandoPedidos, setProcessandoPedidos] = useState<Set<number>>(new Set())

  const lidarComAceitarPedido = async (id: number) => {
    setProcessandoPedidos((s) => new Set(s).add(id))
    await aceitarPedido(id)
  }

  const lidarComRejeitarPedido = async (id: number) => {
    setProcessandoPedidos((s) => new Set(s).add(id))
    await removerOuRejeitar(id)
  }

  const lidarComBusca = async (valor: string) => {
    setTermo(valor)
    if (!valor.trim()) { setResultados([]); return }
    setBuscando(true)
    const r = await buscarUsuarios(valor)
    setResultados(r)
    setBuscando(false)
  }

  const lidarComEnviarPedido = async (id: string) => {
    setEnviados((s) => new Set(s).add(id))
    await enviarPedido(id)
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-5 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Users size={14} /> AMIGOS
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        <input
          type="text"
          value={termo}
          onChange={(e) => lidarComBusca(e.target.value)}
          placeholder="Buscar por @..."
          className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        {termo.trim() && (
          <div className="space-y-2">
            {buscando && <p className="text-[10px] text-accent/40">Buscando...</p>}
            {!buscando && resultados.length === 0 && <p className="text-[10px] text-accent/40">Nenhum @ encontrado.</p>}
            {resultados.map((r) => {
              const jaAmigo = amigos.some((a) => a.id === r.id)
              const jaEnviado = enviados.has(r.id)
              return (
                <div key={r.id} className="flex items-center justify-between text-xs font-mono">
                  <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(r.id)}>@{r.apelido}</span>
                  {jaAmigo ? (
                    <span className="text-[9px] text-green-400">JÁ SÃO AMIGOS</span>
                  ) : jaEnviado ? (
                    <span className="text-[9px] text-accent/40">PEDIDO ENVIADO</span>
                  ) : (
                    <button onClick={() => lidarComEnviarPedido(r.id)} className="text-accent/70 hover:text-accent flex items-center gap-1 text-[9px]">
                      <UserPlus size={13} /> ADICIONAR
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {pedidosRecebidos.length > 0 && (
          <div className="space-y-2 border-t border-borderRaw/20 pt-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">Pedidos recebidos</span>
            {pedidosRecebidos.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs font-mono">
                <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(p.solicitante.id)}>@{p.solicitante.apelido}</span>
                {processandoPedidos.has(p.id) ? (
                  <span className="text-[9px] text-accent/40">...</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => lidarComAceitarPedido(p.id)} className="text-green-400"><Check size={15} /></button>
                    <button onClick={() => lidarComRejeitarPedido(p.id)} className="text-red-400"><X size={15} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-borderRaw/20 pt-3">
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">
            Seus amigos {amigos.length > 0 && `(${amigos.length})`}
          </span>
          {amigos.length === 0 && <p className="text-[10px] text-accent/30">Você ainda não tem amigos por aqui.</p>}
          {amigos.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-xs font-mono">
              <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(a.id)}>@{a.apelido}</span>
              {desfazendo.has(a.amizadeId) ? (
                <span className="text-[9px] text-accent/40">...</span>
              ) : (
                <button onClick={() => lidarComDesfazerAmizade(a.amizadeId, a.apelido)} className="text-accent/30 hover:text-red-400">
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {perfilPublicoAlvo && (
        <PerfilPublicoModal userId={perfilPublicoAlvo} onClose={() => setPerfilPublicoAlvo(null)} />
      )}
    </div>
  )
}