import React, { useRef, useState } from 'react'
import { Expand } from 'lucide-react'

export function FotoDeslizavel({ src, aspecto = '4/3', className = '' }: { src: string; aspecto?: string; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [dimensaoImagem, setDimensaoImagem] = useState<{ largura: number; altura: number } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)
  const [moveuBastante, setMoveuBastante] = useState(false)
  const [mostrarCompleta, setMostrarCompleta] = useState(false)
  const inicioArrasto = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  const lidarComCarregamento = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setDimensaoImagem({ largura: img.naturalWidth, altura: img.naturalHeight })
    setOffset({ x: 0, y: 0 })
  }

  const calcularEstiloImagem = () => {
    if (!dimensaoImagem || !frameRef.current) return {}
    const frame = frameRef.current.getBoundingClientRect()
    const escala = Math.max(frame.width / dimensaoImagem.largura, frame.height / dimensaoImagem.altura)
    const larguraFinal = dimensaoImagem.largura * escala
    const alturaFinal = dimensaoImagem.altura * escala
    return {
      width: `${larguraFinal}px`,
      height: `${alturaFinal}px`,
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      maxWidth: 'none'
    }
  }

  const limitarOffset = (x: number, y: number) => {
    if (!dimensaoImagem || !frameRef.current) return { x: 0, y: 0 }
    const frame = frameRef.current.getBoundingClientRect()
    const escala = Math.max(frame.width / dimensaoImagem.largura, frame.height / dimensaoImagem.altura)
    const larguraFinal = dimensaoImagem.largura * escala
    const alturaFinal = dimensaoImagem.altura * escala
    const limiteX = Math.max(0, (larguraFinal - frame.width) / 2)
    const limiteY = Math.max(0, (alturaFinal - frame.height) / 2)
    return {
      x: Math.min(limiteX, Math.max(-limiteX, x)),
      y: Math.min(limiteY, Math.max(-limiteY, y))
    }
  }

  const iniciarArrasto = (clientX: number, clientY: number) => {
    setArrastando(true)
    setMoveuBastante(false)
    inicioArrasto.current = { x: clientX, y: clientY, offsetX: offset.x, offsetY: offset.y }
  }

  const moverArrasto = (clientX: number, clientY: number) => {
    if (!arrastando) return
    const deltaX = clientX - inicioArrasto.current.x
    const deltaY = clientY - inicioArrasto.current.y
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) setMoveuBastante(true)
    setOffset(limitarOffset(inicioArrasto.current.offsetX + deltaX, inicioArrasto.current.offsetY + deltaY))
  }

  const finalizarArrasto = () => {
    setArrastando(false)
    if (!moveuBastante) setMostrarCompleta(true)
  }

  return (
    <>
      <div
        ref={frameRef}
        className={`relative overflow-hidden bg-black/30 cursor-grab active:cursor-grabbing select-none ${className}`}
        style={{ aspectRatio: aspecto }}
        onMouseDown={(e) => iniciarArrasto(e.clientX, e.clientY)}
        onMouseMove={(e) => moverArrasto(e.clientX, e.clientY)}
        onMouseUp={finalizarArrasto}
        onMouseLeave={() => arrastando && finalizarArrasto()}
        onTouchStart={(e) => iniciarArrasto(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moverArrasto(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={finalizarArrasto}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onLoad={lidarComCarregamento}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={calcularEstiloImagem()}
        />
        <div className="absolute bottom-1.5 right-1.5 bg-background/70 rounded-full p-1">
          <Expand size={11} className="text-accent/80" />
        </div>
      </div>

      {mostrarCompleta && (
        <div
          className="fixed inset-0 bg-black/90 z-[10002] flex items-center justify-center p-4"
          onClick={() => setMostrarCompleta(false)}
        >
          <img src={src} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  )
}