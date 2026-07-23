import React, { useState } from 'react'
import { useConexoes } from '../hooks/useConexoes'
import type { PerfilBasico } from '../hooks/useConexoes'
import { UserPlus, UserMinus, X, Users } from 'lucide-react'
import { PerfilPublicoModal } from './PerfilPublicoModal'

export function ConexoesPanel({ onClose }: { onClose: () => void }) {
  const { seguindo, seguidores, ehMutuo, jaSigo, buscarUsuarios, seguir, deixarDeSeguir } = useConexoes()
  const [perfilPublicoAlvo, setPerfilPublicoAlvo] = useState<string | null>(null)

  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<PerfilBasico[]>([])
  const [buscando, setBuscando] = useState(false)
  const [processando, setProcessando] = useState<Set<string>>(new Set())

  const lidarComBusca = async (valor: string) => {
    setTermo(valor)
    if (!valor.trim()) { setResultados([]); return }
    setBuscando(true)
    const r = await buscarUsuarios(valor)
    setResultados(r)
    setBuscando(false)
  }

  const lidarComSeguir = async (id: string) => {
    setProcessando((s) => new Set(s).add(id))
    await seguir(id)
    setProcessando((s) => { const novo = new Set(s); novo.delete(id); return novo })
  }

  const lidarComDeixarDeSeguir = async (id: string, apelido: string) => {
    if (!confirm(`Deixar de seguir @${apelido}?`)) return
    setProcessando((s) => new Set(s).add(id))
    await deixarDeSeguir(id)
    setProcessando((s) => { const novo = new Set(s); novo.delete(id); return novo })
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-5 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Users size={14} /> CONEXÕES
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
              const sigo = jaSigo(r.id)
              return (
                <div key={r.id} className="flex items-center justify-between text-xs font-mono">
                  <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(r.id)}>
                    @{r.apelido} {ehMutuo(r.id) && <span className="text-[8px] text-accent/40 border border-borderRaw rounded px-1 ml-1">MÚTUO</span>}
                  </span>
                  {processando.has(r.id) ? (
                    <span className="text-[9px] text-accent/40">...</span>
                  ) : sigo ? (
                    <button onClick={() => lidarComDeixarDeSeguir(r.id, r.apelido)} className="text-accent/40 hover:text-red-400 flex items-center gap-1 text-[9px]">
                      <UserMinus size={13} /> SEGUINDO
                    </button>
                  ) : (
                    <button onClick={() => lidarComSeguir(r.id)} className="text-accent/70 hover:text-accent flex items-center gap-1 text-[9px]">
                      <UserPlus size={13} /> SEGUIR
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="space-y-2 border-t border-borderRaw/20 pt-3">
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">
            Seguindo {seguindo.length > 0 && `(${seguindo.length})`}
          </span>
          {seguindo.length === 0 && <p className="text-[10px] text-accent/30">Você ainda não segue ninguém.</p>}
          {seguindo.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs font-mono">
              <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(p.id)}>
                @{p.apelido} {ehMutuo(p.id) && <span className="text-[8px] text-accent/40 border border-borderRaw rounded px-1 ml-1">MÚTUO</span>}
              </span>
              {processando.has(p.id) ? (
                <span className="text-[9px] text-accent/40">...</span>
              ) : (
                <button onClick={() => lidarComDeixarDeSeguir(p.id, p.apelido)} className="text-accent/30 hover:text-red-400">
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-borderRaw/20 pt-3">
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">
            Seguidores {seguidores.length > 0 && `(${seguidores.length})`}
          </span>
          {seguidores.length === 0 && <p className="text-[10px] text-accent/30">Ainda ninguém te segue.</p>}
          {seguidores.map((p) => {
            const sigo = jaSigo(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between text-xs font-mono">
                <span className="cursor-pointer hover:underline" onClick={() => setPerfilPublicoAlvo(p.id)}>
                  @{p.apelido} {ehMutuo(p.id) && <span className="text-[8px] text-accent/40 border border-borderRaw rounded px-1 ml-1">MÚTUO</span>}
                </span>
                {processando.has(p.id) ? (
                  <span className="text-[9px] text-accent/40">...</span>
                ) : !sigo ? (
                  <button onClick={() => lidarComSeguir(p.id)} className="text-accent/70 hover:text-accent flex items-center gap-1 text-[9px]">
                    <UserPlus size={13} /> SEGUIR DE VOLTA
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {perfilPublicoAlvo && (
        <PerfilPublicoModal userId={perfilPublicoAlvo} onClose={() => setPerfilPublicoAlvo(null)} />
      )}
    </div>
  )
}