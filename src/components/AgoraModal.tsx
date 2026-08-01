import React, { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../hooks/useAuth'
import { CameraCapture } from './CameraCapture'
import { ConfirmarLocalizacaoModal } from './ConfirmarLocalizacaoModal'
import { X, MapPin, Clock, Camera, MessageSquare } from 'lucide-react'

export function AgoraModal({ onClose, onPublicado }: { onClose: () => void; onPublicado: () => void }) {
  const { session, perfil } = useAuth()

  const [etapa, setEtapa] = useState<'inicial' | 'camera' | 'compor'>('inicial')

  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [urlFotoEnviada, setUrlFotoEnviada] = useState<string | null>(null)
  const [coordenadasParaConfirmar, setCoordenadasParaConfirmar] = useState<{ lat: number; lng: number } | null>(null)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)

  const lidarComFoto = (blob: Blob) => {
    setFotoBlob(blob)
    setFotoPreview(URL.createObjectURL(blob))
    setEtapa('compor')
  }

  const obterLocalizacao = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }

  const publicarNoBanco = async (coordenadas: { lat: number; lng: number }, imageUrl: string | null) => {
    const { error: erroInsert } = await supabase.from('pulsos').insert([{
      texto: texto.trim(),
      apelido: perfil?.apelido,
      user_id: session!.user.id,
      lat: coordenadas.lat,
      lng: coordenadas.lng,
      categoria: 'AGORA',
      is_fixed: false,
      image_url: imageUrl,
      anonimo: false,
      visibilidade: 'publico'
    }])
    if (erroInsert) throw erroInsert
  }

  const iniciarPublicacao = async () => {
    if (!fotoBlob && !texto.trim()) { setErro('Escreva algo ou tire uma foto.'); return }
    if (!session?.user) return
    setEnviando(true)
    setErro(null)

    try {
      // O AGORA é sobre "aqui, agora" — localização não é mais opcional,
      // é o que diferencia ele do comentário comum (esse sim sem local).
      const coordenadas = await obterLocalizacao()

      if (!coordenadas) {
        setErro('Não conseguimos acessar sua localização. Ative a permissão de localização pro ONDE e tente de novo.')
        setEnviando(false)
        return
      }

      let imageUrl: string | null = urlFotoEnviada

      if (fotoBlob && !imageUrl) {
        const caminho = `${session.user.id}/${Date.now()}.jpg`
        const { error: erroUpload } = await supabase.storage.from('fotos-agora').upload(caminho, fotoBlob, {
          contentType: 'image/jpeg'
        })
        if (erroUpload) throw erroUpload
        const { data: urlData } = supabase.storage.from('fotos-agora').getPublicUrl(caminho)
        imageUrl = urlData.publicUrl
        setUrlFotoEnviada(imageUrl)
      }

      setCoordenadasParaConfirmar(coordenadas)
      setMostrarConfirmacao(true)
    } catch (err: any) {
      setErro(err.message || 'Erro ao publicar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const confirmarEPublicar = async () => {
    if (!coordenadasParaConfirmar) return
    setEnviando(true)
    setErro(null)

    try {
      await publicarNoBanco(coordenadasParaConfirmar, urlFotoEnviada)
      setMostrarConfirmacao(false)
      onPublicado()
    } catch (err: any) {
      setErro(err.message || 'Erro ao publicar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  if (etapa === 'inicial') {
    return (
      <div className="fixed inset-0 bg-background/95 z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl">
          <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
            <span className="text-[10px] font-mono tracking-widest text-red-400">PUBLICAR UM AGORA</span>
            <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
          </div>

          <button
            onClick={() => setEtapa('camera')}
            className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest py-4 rounded-lg bg-accent text-background font-bold"
          >
            <Camera size={16} /> Tirar uma foto
          </button>

          <button
            onClick={() => setEtapa('compor')}
            className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest py-4 rounded-lg border border-borderRaw text-accent/70"
          >
            <MessageSquare size={16} /> Só escrever um comentário
          </button>
        </div>
      </div>
    )
  }

  if (etapa === 'camera') {
    return <CameraCapture onFotoCapturada={lidarComFoto} onCancelar={() => setEtapa('inicial')} />
  }

  return (
    <div className="fixed inset-0 bg-background/95 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-red-400">PUBLICAR UM AGORA</span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && erro.includes('limite de 10 publicações') ? (
          <div className="flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <Clock size={16} className="flex-shrink-0" />
            <span>Você já publicou 10 AGORA hoje — esse é o limite diário. Volta pra postar mais amanhã!</span>
          </div>
        ) : erro && (
          <div className="text-[10px] text-red-400">{erro}</div>
        )}

        {fotoPreview && <img src={fotoPreview} alt="Prévia" className="w-full rounded-xl border border-borderRaw" />}

        {!fotoBlob && (
          <button
            onClick={() => setEtapa('camera')}
            className="flex items-center gap-1.5 text-[10px] font-mono text-accent/50 hover:text-accent underline w-fit"
          >
            <Camera size={12} /> Registrar o momento
          </button>
        )}

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={fotoBlob ? 'Uma legenda pra esse momento (opcional)' : 'O que está rolando?'}
          className="w-full h-16 bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        <p className="flex items-center gap-2 text-[10px] font-mono text-accent/50">
          <MapPin size={12} />
          Sua localização em tempo real é sempre incluída no AGORA
        </p>

        <button
          onClick={iniciarPublicacao}
          disabled={enviando}
          className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs"
        >
          {enviando ? 'AGUARDE...' : 'PUBLICAR AGORA'}
        </button>
      </div>

      {mostrarConfirmacao && coordenadasParaConfirmar && (
        <ConfirmarLocalizacaoModal
          lat={coordenadasParaConfirmar.lat}
          lng={coordenadasParaConfirmar.lng}
          onChange={(lat, lng) => setCoordenadasParaConfirmar({ lat, lng })}
          textoResumo={texto || undefined}
          onConfirmar={confirmarEPublicar}
          onVoltar={() => setMostrarConfirmacao(false)}
          publicando={enviando}
        />
      )}
    </div>
  )
}