import React, { useMemo } from 'react'
import { useAgoraVistos } from '../hooks/useAgoraVistos'

export type PostAgora = {
  id: number
  image_url: string
  apelido: string | null
  texto: string
  created_at: string
  lat: number | null
  lng: number | null
  user_id: string | null
  anonimo: boolean
}

type GrupoAgora = {
  chave: string
  apelido: string
  thumbnail: string
  posts: PostAgora[]
  temNaoVisto: boolean
}

export function AgoraStories({ posts, onAbrirGrupo }: { posts: PostAgora[]; onAbrirGrupo: (postsDoGrupo: PostAgora[]) => void }) {
  const { vistos } = useAgoraVistos()

  // Agrupa por usuário — um círculo só, mesmo se a pessoa postou vários
  // AGORA. Posts anônimos ficam de fora do agrupamento de propósito: juntar
  // dois anônimos no mesmo círculo revelaria que são da mesma conta, o que
  // quebraria a proteção de anonimato que o app já garante em outro lugar.
  const grupos = useMemo<GrupoAgora[]>(() => {
    const mapa = new Map<string, PostAgora[]>()

    posts.forEach((post) => {
      const chave = post.anonimo || !post.user_id ? `individual-${post.id}` : post.user_id
      const lista = mapa.get(chave) || []
      lista.push(post)
      mapa.set(chave, lista)
    })

    return Array.from(mapa.entries()).map(([chave, postsDoGrupo]) => ({
      chave,
      apelido: postsDoGrupo[0].apelido || 'ANÔNIMO',
      thumbnail: postsDoGrupo[0].image_url,
      posts: postsDoGrupo,
      temNaoVisto: postsDoGrupo.some((p) => !vistos.has(p.id))
    }))
  }, [posts, vistos])

  if (grupos.length === 0) return null

  return (
    <div
      className="absolute left-0 w-full z-[999] pointer-events-none"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
    >
      <div className="flex gap-3 overflow-x-auto px-4 py-1 pointer-events-auto no-scrollbar">
        {grupos.map((grupo) => (
          <button
            key={grupo.chave}
            onClick={() => onAbrirGrupo(grupo.posts)}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-14"
          >
            <div
              className="w-14 h-14 rounded-full flex-shrink-0"
              style={{
                backgroundImage: grupo.temNaoVisto ? 'linear-gradient(135deg, #ff14e1, #9cff00)' : undefined,
                backgroundColor: !grupo.temNaoVisto ? '#3a3a3a' : undefined,
                padding: 2
              }}
            >
              <div
                className="w-full h-full rounded-full bg-background border-2 border-background relative"
                style={{
                  backgroundImage: `url('${grupo.thumbnail}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {grupo.posts.length > 1 && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-accent text-background text-[7px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center border border-background">
                    {grupo.posts.length}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[8px] font-mono text-accent/70 truncate w-full text-center">
              {grupo.apelido}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}