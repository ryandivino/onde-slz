import React, { useState } from 'react'
import { useEventos } from '../hooks/useEventos'
import { X, Calendar, Trash2, Plus } from 'lucide-react'

export function EventosManager({ pulsoId, nomeLocal, onClose }: { pulsoId: number; nomeLocal: string; onClose: () => void }) {
  const { eventosPorLocal, criarEvento, removerEvento } = useEventos()
  const eventos = eventosPorLocal(pulsoId)

  const [formAberto, setFormAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [recorrencia, setRecorrencia] = useState('')
  const [horario, setHorario] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!titulo.trim() || !recorrencia.trim()) {
      setErro('Preencha ao menos o título e a recorrência (ex: "Toda quinta").')
      return
    }
    setSalvando(true)
    const { error } = await criarEvento(pulsoId, titulo, recorrencia, horario, descricao)
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setTitulo(''); setRecorrencia(''); setHorario(''); setDescricao(''); setFormAberto(false)
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Calendar size={14} /> EVENTOS — {nomeLocal.toUpperCase()}
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {eventos.length === 0 && !formAberto && (
          <p className="text-[10px] text-accent/30 text-center py-2">Nenhum evento recorrente ainda.</p>
        )}

        {eventos.map((ev) => (
          <div key={ev.id} className="flex items-start justify-between gap-2 border border-borderRaw/20 rounded-lg p-2">
            <div>
              <h3 className="text-xs font-mono font-bold">{ev.titulo}</h3>
              <p className="text-[10px] text-accent/60">{ev.recorrencia}{ev.horario ? ` · ${ev.horario}` : ''}</p>
              {ev.descricao && <p className="text-[9px] text-accent/40 mt-0.5">{ev.descricao}</p>}
            </div>
            <button onClick={() => removerEvento(ev.id)} className="text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
          </div>
        ))}

        {formAberto ? (
          <div className="space-y-2 border-t border-borderRaw/20 pt-3">
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex: Samba ao vivo)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)} placeholder="Recorrência (ex: Toda quinta)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Horário (ex: A partir das 20h)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="w-full h-14 bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <div className="flex gap-2">
              <button onClick={() => setFormAberto(false)} className="flex-1 text-[10px] font-mono py-2 rounded-lg border border-borderRaw text-accent/60">CANCELAR</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 text-[10px] font-mono py-2 rounded-lg bg-accent text-background font-bold">
                {salvando ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFormAberto(true)}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-dashed border-borderRaw text-accent/70"
          >
            <Plus size={13} /> Novo evento recorrente
          </button>
        )}
      </div>
    </div>
  )
}