import React, { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { useDenuncias, MOTIVOS_DENUNCIA } from '../hooks/useDenuncias'

export function DenunciaModal({
  pulsoId,
  eventoId,
  onClose
}: {
  pulsoId?: number
  eventoId?: number
  onClose: () => void
}) {
  const { denunciar } = useDenuncias()
  const [motivo, setMotivo] = useState(MOTIVOS_DENUNCIA[0])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const confirmar = async () => {
    setEnviando(true)
    const { error } = await denunciar({ pulsoId, eventoId }, motivo)
    setEnviando(false)
    if (error) setErro(error.message)
    else setEnviado(true)
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-red-400 flex items-center gap-2">
            <Flag size={14} /> {eventoId ? 'DENUNCIAR' : 'DENUNCIAR'}
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {enviado ? (
          <>
            <p className="text-xs text-accent/80">Denúncia enviada. Nossa moderação vai avaliar.</p>
            <button onClick={onClose} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
              FECHAR
            </button>
          </>
        ) : (
          <>
            {erro && <div className="text-[10px] text-red-400">{erro}</div>}

            <div className="space-y-2">
              {MOTIVOS_DENUNCIA.map((m) => (
                <button
                  key={m}
                  onClick={() => setMotivo(m)}
                  className={`w-full text-left text-[10px] font-mono uppercase tracking-widest py-2 px-3 rounded-lg border ${motivo === m ? 'bg-accent text-background border-accent' : 'border-borderRaw text-accent/60'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={confirmar}
              disabled={enviando}
              className="w-full bg-red-500 text-white font-bold py-3 uppercase rounded-lg text-xs"
            >
              {enviando ? 'ENVIANDO...' : 'CONFIRMAR DENÚNCIA'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}