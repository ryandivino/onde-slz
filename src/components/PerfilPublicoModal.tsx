import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { X, Store, Phone, Instagram, Globe, Clock } from 'lucide-react'

type PerfilPublico = {
  apelido: string
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  is_empresa: boolean
}

type EmpresaPublica = {
  nome_estabelecimento: string
  telefone: string | null
  instagram: string | null
  site: string | null
  horario_funcionamento: string | null
}

export function PerfilPublicoModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaPublica | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    const carregar = async () => {
      setCarregando(true)
      const { data: dadosPerfil } = await supabase
        .from('profiles')
        .select('apelido, avatar_url, bio, is_admin, is_empresa')
        .eq('id', userId)
        .single()

      if (cancelado) return
      setPerfil(dadosPerfil || null)

      if (dadosPerfil?.is_empresa) {
        const { data: dadosEmpresa } = await supabase
          .from('empresas')
          .select('nome_estabelecimento, telefone, instagram, site, horario_funcionamento')
          .eq('id', userId)
          .single()
        if (!cancelado) setEmpresa(dadosEmpresa || null)
      }

      if (!cancelado) setCarregando(false)
    }

    carregar()
    return () => { cancelado = true }
  }, [userId])

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregando && <p className="text-[10px] text-accent/40 text-center py-4">Carregando...</p>}

        {!carregando && !perfil && (
          <p className="text-[10px] text-accent/30 text-center py-4">Perfil não encontrado.</p>
        )}

        {!carregando && perfil && (
          <>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full bg-background border-2 border-borderRaw"
                style={perfil.avatar_url ? {
                  backgroundImage: `url('${perfil.avatar_url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              />
              <div className="flex items-center gap-1.5 text-sm font-mono">
                <span>@{perfil.apelido}</span>
                {perfil.is_empresa && (
                  <span className="text-[8px] text-amber-500 border border-amber-500/40 rounded px-1">ESTABELECIMENTO</span>
                )}
              </div>
              {perfil.bio && <p className="text-xs text-accent/60 text-center">{perfil.bio}</p>}
            </div>

            {perfil.is_empresa && empresa && (
              <div className="space-y-2 border-t border-borderRaw/20 pt-4">
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Store size={12} /> {empresa.nome_estabelecimento}
                </span>
                {empresa.horario_funcionamento && (
                  <div className="flex items-center gap-2 text-xs text-accent/70">
                    <Clock size={13} className="flex-shrink-0" /> {empresa.horario_funcionamento}
                  </div>
                )}
                {empresa.telefone && (
                  <div className="flex items-center gap-2 text-xs text-accent/70">
                    <Phone size={13} className="flex-shrink-0" /> {empresa.telefone}
                  </div>
                )}
                {empresa.instagram && (
                  <div className="flex items-center gap-2 text-xs text-accent/70">
                    <Instagram size={13} className="flex-shrink-0" /> {empresa.instagram}
                  </div>
                )}
                {empresa.site && (
                  <div className="flex items-center gap-2 text-xs text-accent/70">
                    <Globe size={13} className="flex-shrink-0" /> {empresa.site}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}