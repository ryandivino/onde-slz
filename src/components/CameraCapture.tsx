import React, { useEffect, useRef, useState } from 'react'
import { Camera, RotateCcw, Check, X, SwitchCamera } from 'lucide-react'

export function CameraCapture({
  onFotoCapturada,
  onCancelar
}: {
  onFotoCapturada: (blob: Blob) => void
  onCancelar: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [modoCamera, setModoCamera] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    iniciarCamera()
    return () => pararCamera()
  }, [modoCamera])

  const iniciarCamera = async () => {
    pararCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: modoCamera },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setErro(null)
    } catch (err) {
      setErro('Não conseguimos acessar sua câmera. Verifique a permissão do navegador.')
    }
  }

  const trocarCamera = () => {
    setModoCamera((m) => (m === 'environment' ? 'user' : 'environment'))
  }

  const pararCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const capturar = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      setFotoBlob(blob)
      setFotoPreview(URL.createObjectURL(blob))
      pararCamera() // não precisa mais do stream ao vivo depois de capturar
    }, 'image/jpeg', 0.9)
  }

  const tirarDeNovo = () => {
    setFotoPreview(null)
    setFotoBlob(null)
    iniciarCamera()
  }

  const confirmar = () => {
    if (fotoBlob) onFotoCapturada(fotoBlob)
  }

  return (
    <div className="fixed inset-0 bg-black z-[10001] flex flex-col">
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {erro && (
          <div className="p-6 text-center">
            <p className="text-xs text-red-400">{erro}</p>
          </div>
        )}

        {!erro && !fotoPreview && (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}

        {fotoPreview && (
          <img src={fotoPreview} alt="Foto capturada" className="w-full h-full object-cover" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        <button
          onClick={onCancelar}
          className="absolute top-4 right-4 bg-background/60 rounded-full p-2 text-white"
        >
          <X size={20} />
        </button>

        {!fotoPreview && !erro && (
          <button
            onClick={trocarCamera}
            className="absolute top-4 left-4 bg-background/60 rounded-full p-2 text-white"
          >
            <SwitchCamera size={20} />
          </button>
        )}
      </div>

      <div className="p-6 flex items-center justify-center gap-8 bg-black">
        {!fotoPreview ? (
          <button
            onClick={capturar}
            disabled={!!erro}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30"
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        ) : (
          <>
            <button onClick={tirarDeNovo} className="flex flex-col items-center gap-1 text-white/70 text-[10px] font-mono uppercase">
              <RotateCcw size={22} />
              Tirar de novo
            </button>
            <button onClick={confirmar} className="flex flex-col items-center gap-1 text-white text-[10px] font-mono uppercase">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <Check size={24} className="text-background" />
              </div>
              Usar foto
            </button>
          </>
        )}
      </div>
    </div>
  )
}