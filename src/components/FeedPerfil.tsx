import React from 'react'
import { usePostsDoPerfil } from '../hooks/usePostsDoPerfil'
import { useAuth } from '../hooks/useAuth'
import { InteracoesComentario } from './InteracoesComentario'
import { formatarTempoRelativo } from '../utils/tempo'
import { Zap, Trash2 } from 'lucide-react'
import { supabase } from '../supabase'

export function FeedPerfil({ perfilId }: { perfilId: string }) {
  const { session, perfil } = useAuth()
  const { posts, carregando, recarregar } = usePostsDoPerfil(perfilId)

  const podeApagar = (post: any) => session?.user.id === post.user_id || perfil?.is_admin

  const apagar = async (id: number) => {
    if (!confirm('Apagar essa postagem?')) return
    await supabase.from('pulsos').delete().eq('id', id)
    recarregar()
  }

  return (
    <div className="space-y-4">
      <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
        Postagens {posts.length > 0 && `(${posts.length})`}
      </span>

      {carregando && <p className="text-[10px] text-accent/30 text-center py-4">Carregando...</p>}
      {!carregando && posts.length === 0 && (
        <p className="text-[10px] text-accent/30 text-center py-4">Nenhuma postagem ainda.</p>
      )}

      {posts.map((post) => (
        <div key={post.id} className="border-b border-borderRaw/10 pb-3">
          <div className="flex items-center justify-between">
            {post.categoria === 'AGORA' && (
              <span className="flex items-center gap-0.5 text-[8px] text-orange-500 border border-orange-500/40 rounded px-1">
                <Zap size={9} /> AGORA
              </span>
            )}
            {podeApagar(post) && (
              <button onClick={() => apagar(post.id)} className="text-accent/30 hover:text-red-500 ml-auto">
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {post.categoria === 'AGORA' && post.image_url && (
            <img src={post.image_url} alt="" className="w-full max-h-48 object-cover rounded-lg my-2" />
          )}

          {post.texto && <p className="text-xs text-accent/80 mt-1">"{post.texto}"</p>}
          <span className="text-[9px] text-accent/40 italic">{formatarTempoRelativo(post.created_at)}</span>

          <InteracoesComentario pulsoId={post.id} />
        </div>
      ))}
    </div>
  )
}