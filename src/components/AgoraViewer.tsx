import React, { useEffect, useState } from 'react'
import { X, MapPin, Heart, Eye } from 'lucide-react'
import { formatarTempoRelativo } from '../utils/tempo'
import { useAgoraVistos } from '../hooks/useAgoraVistos'
import { useCurtidas } from '../hooks/useCurtidas'
import { useVisualizacoesAgora } from '../hooks/useVisualizacoesAgora'
import { useAuth } from '../hooks/useAuth'
import { VisualizacoesAgoraModal } from './VisualizacoesAgoraModal'
import type { PostAgora } from './AgoraStories'

const DURACAO_MS = 5000

export function AgoraViewer({
  posts,
  indiceInicial,
  onClose,
  onIrParaNoMapa
}: {
  posts: PostAgora[]
  indiceInicial: number
  onClose: () => void
  onIrParaNoMapa: (lat: number, lng: number) => void
}) {
  const [indice, setIndice] = useState(indiceInicial)
  const [progresso, setProgresso] = useState(0)
  const [animarCurtida, setAnimarCurtida] = useState(false)
  const [mostrarVisualizacoes, setMostrarVisualizacoes] = useState(false)
  const { marcarComoVisto } = useAgoraVistos()
  const { registrarVisualizacao } = useVisualizacoesAgora()
  const { session } = useAuth()

  useEffect(() => {
    setProgresso(0)
    const postAtual = posts[indice]
    if (postAtual) {
      marcarComoVisto(postAtual.id)
      registrarVisualizacao(postAtual.id, postAtual.user_id)
    }

    const passoMs = 50
    const intervalo = setInterval(() => {
      setProgresso((p) => {
        const novo = p + (passoMs / DURACAO_MS) * 100
        if (novo >= 100) {
          avancar()
          return 0
        }
        return novo
      })
    }, passoMs)
    return () => clearInterval(intervalo)
  }, [indice])

  const avancar = () => {
    if (indice + 1 >= posts.length) { onClose(); return }
    setIndice((i) => i + 1)
  }

  const voltar = () => {
    if (indice - 1 < 0) return
    setIndice((i) => i - 1)
  }

  const post = posts[indice]
  const { total: totalCurtidas, euCurti, alternarCurtida } = useCurtidas(post?.id ?? null)
  if (!post) return null

  return (
    <div className="fixed inset-0 bg-black z-[10001] flex flex-col">
      <div className="flex gap-1 p-2 flex-shrink-0">
        {posts.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${i < indice ? 100 : i === indice ? progresso : 0}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
        <span className="text-xs font-mono text-white">
          @{post.apelido || 'ANÔNIMO'} <span className="text-white/40 italic">{formatarTempoRelativo(post.created_at)}</span>
        </span>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <img src={post.image_url} alt="" className="w-full h-full object-cover" />

        {/* Zonas de toque: esquerda volta, direita avança */}
        <button onClick={voltar} className="absolute left-0 top-0 w-1/2 h-full" />
        <button onClick={avancar} className="absolute right-0 top-0 w-1/2 h-full" />

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between gap-2">
          {post.texto && <p className="text-white text-sm flex-1">{post.texto}</p>}
          <div className="flex items-center gap-2 flex-shrink-0">
            {session?.user.id === post.user_id && (
              <button
                onClick={(e) => { e.stopPropagation(); setMostrarVisualizacoes(true) }}
                className="flex items-center gap-1 rounded-full p-2 bg-white/10 text-white/80 hover:text-white"
              >
                <Eye size={16} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setAnimarCurtida(true); setTimeout(() => setAnimarCurtida(false), 200); alternarCurtida() }}
              className={`flex items-center gap-1 rounded-full p-2 bg-white/10 transition-transform duration-150 ${euCurti ? 'text-red-500' : 'text-white/80 hover:text-white'} ${animarCurtida ? 'scale-[1.4]' : 'scale-100'}`}
            >
              <Heart size={16} fill={euCurti ? 'currentColor' : 'none'} />
              {totalCurtidas > 0 && <span className="text-[10px] font-mono">{totalCurtidas}</span>}
            </button>
            {post.lat !== null && post.lng !== null && (
              <button
                onClick={() => { onIrParaNoMapa(post.lat!, post.lng!); onClose() }}
                className="text-white/80 hover:text-white bg-white/10 rounded-full p-2"
              >
                <MapPin size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {mostrarVisualizacoes && (
        <VisualizacoesAgoraModal pulsoId={post.id} onClose={() => setMostrarVisualizacoes(false)} />
      )}
    </div>
  )
}