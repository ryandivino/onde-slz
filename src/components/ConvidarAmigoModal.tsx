import React, { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../hooks/useAuth'
import { useAmizades } from '../hooks/useAmizades'
import { X, Send } from 'lucide-react'

type PulsoParaConvite = {
  id: number
  texto: string
  lat: number | null
  lng: number | null
}

export function ConvidarAmigoModal({ pulso, onClose }: { pulso: PulsoParaConvite; onClose: () => void }) {
  const { session, perfil } = useAuth()
  const { amigos } = useAmizades()

  const [enviadosPara, setEnviadosPara] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  const convidar = async (amigoId: string) => {
    if (!session?.user) return
    setErro(null)

    const { error } = await supabase.from('notificacoes').insert([{
      destinatario_id: amigoId,
      tipo: 'convite_role',
      titulo: `@${perfil?.apelido || '???'} te convidou pra um rolê`,
      mensagem: pulso.texto,
      lat: pulso.lat,
      lng: pulso.lng,
      referencia_id: pulso.id,
      criado_por: session.user.id
    }])

    if (error) { setErro(error.message); return }
    setEnviadosPara((s) => new Set(s).add(amigoId))
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Send size={14} /> CONVIDAR PRA ESSE ROLÊ
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {amigos.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">
            Você ainda não tem amigos pra convidar.
          </p>
        )}

        {amigos.map((amigo) => {
          const enviado = enviadosPara.has(amigo.id)
          return (
            <div key={amigo.id} className="flex items-center justify-between text-xs font-mono">
              <span>@{amigo.apelido}</span>
              {enviado ? (
                <span className="text-[9px] text-green-400">CONVIDADO</span>
              ) : (
                <button onClick={() => convidar(amigo.id)} className="text-accent/70 hover:text-accent flex items-center gap-1 text-[9px]">
                  <Send size={13} /> CONVIDAR
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}