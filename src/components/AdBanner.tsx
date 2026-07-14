import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAnuncios } from '../hooks/useAnuncios'

const DURACAO_POR_ANUNCIO_MS = 6000

export function AdBanner({ onClose, onAdMostrado }: { onClose: () => void; onAdMostrado?: () => void }) {
  const { anunciosAtivos, carregando } = useAnuncios()
  const [indice, setIndice] = useState(0)
  const jaAvisou = useRef(false)

  // Sem anúncio ativo (ou ainda carregando) -> fecha sozinho, mas só depois
  // que a busca terminar de verdade (evita fechar antes de saber se há anúncios).
  useEffect(() => {
    if (!carregando && anunciosAtivos.length === 0) onClose()
  }, [carregando, anunciosAtivos.length, onClose])

  // Só marca "anúncio mostrado" (pro limite de 1x/dia) quando de fato existe
  // um anúncio pra exibir — evita gastar a cota do dia à toa quando não há nenhum ativo.
  useEffect(() => {
    if (!carregando && anunciosAtivos.length > 0 && !jaAvisou.current) {
      jaAvisou.current = true
      onAdMostrado?.()
    }
  }, [carregando, anunciosAtivos.length, onAdMostrado])

  // Avança pro próximo anúncio automaticamente, em loop, com tempo de leitura
  useEffect(() => {
    if (anunciosAtivos.length <= 1) return
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % anunciosAtivos.length)
    }, DURACAO_POR_ANUNCIO_MS)
    return () => clearInterval(intervalo)
  }, [anunciosAtivos.length])

  if (carregando || anunciosAtivos.length === 0) return null

  const anuncioAtual = anunciosAtivos[indice % anunciosAtivos.length]

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9998] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-3 relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-surface border border-borderRaw rounded-full p-1.5 text-accent/70 hover:text-accent z-10"
        >
          <X size={16} />
        </button>

        <img src={anuncioAtual.image_url} alt="Anúncio" className="w-full rounded-2xl border border-borderRaw shadow-2xl" />

        {anunciosAtivos.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {anunciosAtivos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${i === indice ? 'w-6 bg-accent' : 'w-1.5 bg-accent/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}