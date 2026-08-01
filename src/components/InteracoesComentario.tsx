import React, { useState } from 'react'
import { Heart, MessageCircle, Send, Trash2, BadgeCheck } from 'lucide-react'
import { useCurtidas } from '../hooks/useCurtidas'
import { useRespostas } from '../hooks/useRespostas'
import { useAuth } from '../hooks/useAuth'
import { formatarTempoRelativo } from '../utils/tempo'

export function InteracoesComentario({ pulsoId }: { pulsoId: number }) {
  const { session, perfil } = useAuth()
  const { total: totalCurtidas, euCurti, alternarCurtida } = useCurtidas(pulsoId)
  const [mostrarRespostas, setMostrarRespostas] = useState(false)
  const { respostas, total: totalRespostas, carregando, enviando, enviarResposta, apagarResposta } = useRespostas(pulsoId, mostrarRespostas)
  const [textoResposta, setTextoResposta] = useState('')

  const enviar = async () => {
    if (!textoResposta.trim()) return
    const { error } = await enviarResposta(textoResposta)
    if (!error) setTextoResposta('')
  }

  const apagar = async (id: number) => {
    if (!confirm('Apagar essa resposta?')) return
    await apagarResposta(id)
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
          {totalRespostas > 0 && totalRespostas}
        </button>
      </div>

      {mostrarRespostas && (
        <div className="space-y-2 pl-3 border-l border-borderRaw/30">
          {carregando && <p className="text-[9px] text-accent/30">Carregando respostas...</p>}
          {!carregando && respostas.length === 0 && <p className="text-[9px] text-accent/30">Nenhuma resposta ainda.</p>}

          {respostas.map((r) => (
            <div key={r.id} className="text-[10px] flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-accent/70 inline-flex items-center gap-0.5">
                  @{r.apelido || 'usuário'}
                  {r.verificado && <BadgeCheck size={10} style={{ color: '#ff14e1' }} />}
                </span>
                <span className="text-accent/60">: {r.texto}</span>
                <span className="text-accent/30 italic ml-1">{formatarTempoRelativo(r.created_at)}</span>
              </div>
              {(session?.user.id === r.user_id || perfil?.is_admin) && (
                <button onClick={() => apagar(r.id)} className="text-accent/30 hover:text-red-500 flex-shrink-0">
                  <Trash2 size={11} />
                </button>
              )}
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