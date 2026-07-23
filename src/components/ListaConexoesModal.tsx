import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { X, Users } from 'lucide-react'
import { PerfilPublicoModal } from './PerfilPublicoModal'

type PessoaLista = { id: string; apelido: string; avatar_url: string | null }

export function ListaConexoesModal({
  perfilId,
  tipo,
  onClose
}: {
  perfilId: string
  tipo: 'seguindo' | 'seguidores'
  onClose: () => void
}) {
  const [lista, setLista] = useState<PessoaLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [perfilPublicoAlvo, setPerfilPublicoAlvo] = useState<string | null>(null)

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      const coluna = tipo === 'seguindo' ? 'seguidor_id' : 'seguido_id'
      const colunaAlvo = tipo === 'seguindo' ? 'seguido_id' : 'seguidor_id'

      const { data: linhas } = await supabase.from('seguidores').select(colunaAlvo).eq(coluna, perfilId)
      const ids = (linhas || []).map((l: any) => l[colunaAlvo])

      if (ids.length > 0) {
        const { data: perfis } = await supabase.from('profiles').select('id, apelido, avatar_url').in('id', ids)
        setLista(perfis || [])
      } else {
        setLista([])
      }
      setCarregando(false)
    }
    carregar()
  }, [perfilId, tipo])

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Users size={14} /> {tipo === 'seguindo' ? 'SEGUINDO' : 'SEGUIDORES'}
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}
        {!carregando && lista.length === 0 && (
          <p className="text-[10px] text-accent/30 text-center py-4">
            {tipo === 'seguindo' ? 'Ainda não segue ninguém.' : 'Ainda não tem seguidores.'}
          </p>
        )}

        {lista.map((p) => (
          <button
            key={p.id}
            onClick={() => setPerfilPublicoAlvo(p.id)}
            className="w-full flex items-center gap-2 text-left"
          >
            <div
              className="w-8 h-8 rounded-full bg-background border border-borderRaw flex-shrink-0"
              style={p.avatar_url ? { backgroundImage: `url('${p.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            />
            <span className="text-xs font-mono text-accent/80">@{p.apelido}</span>
          </button>
        ))}
      </div>

      {perfilPublicoAlvo && (
        <PerfilPublicoModal userId={perfilPublicoAlvo} onClose={() => setPerfilPublicoAlvo(null)} />
      )}
    </div>
  )
}