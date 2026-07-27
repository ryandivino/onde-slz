import React, { useState } from 'react'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { useCurtidas } from '../hooks/useCurtidas'
import { useRespostas } from '../hooks/useRespostas'
import { formatarTempoRelativo } from '../utils/tempo'

export function InteracoesComentario({ pulsoId }: { pulsoId: number }) {
  const { total: totalCurtidas, euCurti, alternarCurtida } = useCurtidas(pulsoId)
  const [mostrarRespostas, setMostrarRespostas] = useState(false)
  const { respostas, carregando, enviando, enviarResposta } = useRespostas(pulsoId, mostrarRespostas)
  const [textoResposta, setTextoResposta] = useState('')

  const enviar = async () => {
    if (!textoResposta.trim()) return
    const { error } = await enviarResposta(textoResposta)
    if (!error) setTextoResposta('')
  }

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex items-center gap-3">
        <button onClick={alternarCurtida} className={`flex items-center gap-1 text-[10px] font-mono ${euCurti ? 'text-red-500' : 'text-accent/40 hover:text-accent'}`}>
          <Heart size={13} fill={euCurti ? 'currentColor' : 'none'} />
          {totalCurtidas > 0 && totalCurtidas}
        </button>
        <button onClick={() => setMostrarRespostas((v) => !v)} className="flex items-center gap-1 text-[10px] font-mono text-accent/40 hover:text-accent">
          <MessageCircle size={13} />
          {respostas.length > 0 && respostas.length}
        </button>
      </div>

      {mostrarRespostas && (
        <div className="space-y-2 pl-3 border-l border-borderRaw/30">
          {carregando && <p className="text-[9px] text-accent/30">Carregando respostas...</p>}
          {!carregando && respostas.length === 0 && <p className="text-[9px] text-accent/30">Nenhuma resposta ainda.</p>}

          {respostas.map((r) => (
            <div key={r.id} className="text-[10px]">
              <span className="font-mono text-accent/70">@{r.apelido || 'usuário'}</span>
              <span className="text-accent/60"> — {r.texto}</span>
              <span className="text-accent/30 italic ml-1">{formatarTempoRelativo(r.created_at)}</span>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={textoResposta}
              onChange={(e) => setTextoResposta(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }}
              placeholder="Responder..."
              className="flex-1 bg-background border border-borderRaw rounded-lg p-1.5 text-[10px]"
            />
            <button onClick={enviar} disabled={enviando} className="text-accent/50 hover:text-accent flex-shrink-0">
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}