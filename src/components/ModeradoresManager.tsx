import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../hooks/useAuth'
import { X, ShieldCheck, ShieldOff, Search } from 'lucide-react'

type PerfilComAdmin = { id: string; apelido: string; is_admin: boolean; dono: boolean }

export function ModeradoresManager({ onClose }: { onClose: () => void }) {
  const { session, definirAdmin } = useAuth()
  const meuId = session?.user.id

  const [moderadores, setModeradores] = useState<PerfilComAdmin[]>([])
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<PerfilComAdmin[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregarModeradores = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, apelido, is_admin, dono').eq('is_admin', true)
    setModeradores(data || [])
  }, [])

  useEffect(() => { carregarModeradores() }, [carregarModeradores])

  const lidarComBusca = async (valor: string) => {
    setTermo(valor)
    setErro(null)
    if (!valor.trim()) { setResultados([]); return }
    setBuscando(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, apelido, is_admin, dono')
      .ilike('apelido', `%${valor.trim()}%`)
      .neq('id', meuId)
      .limit(10)
    setResultados(data || [])
    setBuscando(false)
  }

  const alternar = async (perfil: PerfilComAdmin) => {
    setErro(null)
    const { error } = await definirAdmin(perfil.id, !perfil.is_admin)
    if (error) { setErro(error.message); return }
    await carregarModeradores()
    setResultados((rs) => rs.map((r) => (r.id === perfil.id ? { ...r, is_admin: !r.is_admin } : r)))
  }

  const removerAMimMesmo = async (perfil: PerfilComAdmin) => {
    setErro(null)
    const { error } = await definirAdmin(perfil.id, false)
    if (error) { setErro(error.message); return }
    await carregarModeradores()
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <ShieldCheck size={14} /> MODERADORES
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-accent/30" />
          <input
            type="text"
            value={termo}
            onChange={(e) => lidarComBusca(e.target.value)}
            placeholder="Buscar por @ para promover..."
            className="w-full bg-background border border-borderRaw rounded-lg p-2 pl-7 text-xs"
          />
        </div>

        {termo.trim() && (
          <div className="space-y-2">
            {buscando && <p className="text-[10px] text-accent/40">Buscando...</p>}
            {!buscando && resultados.length === 0 && <p className="text-[10px] text-accent/40">Nenhum @ encontrado.</p>}
            {resultados.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs font-mono">
                <span>
                  @{r.apelido}
                  {r.dono && <span className="ml-1 text-[8px] text-amber-500 border border-amber-500/40 rounded px-1">PROPRIETÁRIO</span>}
                </span>
                {!r.dono && (
                  <button
                    onClick={() => alternar(r)}
                    className={`flex items-center gap-1 text-[9px] ${r.is_admin ? 'text-red-400' : 'text-accent/70'}`}
                  >
                    {r.is_admin ? <><ShieldOff size={13} /> REMOVER</> : <><ShieldCheck size={13} /> PROMOVER</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-borderRaw/20 pt-3">
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">
            Moderadores atuais ({moderadores.length})
          </span>
          {moderadores.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs font-mono">
              <span>
                @{m.apelido} {m.id === meuId && <span className="text-accent/30">(você)</span>}
                {m.dono && <span className="ml-1 text-[8px] text-amber-500 border border-amber-500/40 rounded px-1">PROPRIETÁRIO</span>}
              </span>
              {!m.dono && m.id !== meuId && (
                <button onClick={() => alternar(m)} className="text-red-400 flex items-center gap-1 text-[9px]">
                  <ShieldOff size={13} /> REMOVER
                </button>
              )}
              {!m.dono && m.id === meuId && (
                <button onClick={() => removerAMimMesmo(m)} className="text-accent/30 flex items-center gap-1 text-[9px]">
                  <ShieldOff size={13} /> REMOVER
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}