import React, { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../hooks/useAuth'
import { CameraCapture } from './CameraCapture'
import { X, MapPin } from 'lucide-react'

export function AgoraModal({ onClose, onPublicado }: { onClose: () => void; onPublicado: () => void }) {
  const { session, perfil } = useAuth()

  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [apelidoManual, setApelidoManual] = useState('')
  const [postarAnonimo, setPostarAnonimo] = useState(false)
  const [incluirLocalizacao, setIncluirLocalizacao] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const lidarComFoto = (blob: Blob) => {
    setFotoBlob(blob)
    setFotoPreview(URL.createObjectURL(blob))
  }

  const obterLocalizacao = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!incluirLocalizacao || !navigator.geolocation) {
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

  const publicar = async () => {
    if (!fotoBlob || !session?.user) return
    setEnviando(true)
    setErro(null)

    try {
      const caminho = `${session.user.id}/${Date.now()}.jpg`
      const { error: erroUpload } = await supabase.storage.from('fotos-agora').upload(caminho, fotoBlob, {
        contentType: 'image/jpeg'
      })
      if (erroUpload) throw erroUpload

      const { data: urlData } = supabase.storage.from('fotos-agora').getPublicUrl(caminho)
      const coordenadas = await obterLocalizacao()

      const { error: erroInsert } = await supabase.from('pulsos').insert([{
        texto: texto.trim(),
        apelido: postarAnonimo ? (apelidoManual.trim() || 'ANÔNIMO') : perfil?.apelido,
        user_id: session.user.id,
        lat: coordenadas?.lat ?? null,
        lng: coordenadas?.lng ?? null,
        categoria: 'AGORA',
        is_fixed: false,
        image_url: urlData.publicUrl
      }])
      if (erroInsert) throw erroInsert

      onPublicado()
    } catch (err: any) {
      setErro(err.message || 'Erro ao publicar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  // Etapa 1: câmera (sem opção de galeria)
  if (!fotoBlob) {
    return <CameraCapture onFotoCapturada={lidarComFoto} onCancelar={onClose} />
  }

  // Etapa 2: legenda + localização opcional + publicar
  return (
    <div className="fixed inset-0 bg-background/95 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-red-400">PUBLICAR UM AGORA</span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {fotoPreview && <img src={fotoPreview} alt="Prévia" className="w-full rounded-xl border border-borderRaw" />}

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Uma legenda pra esse momento (opcional)"
          className="w-full h-16 bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        <label className="flex items-center gap-2 text-[10px] font-mono text-accent/70">
          <input type="checkbox" checked={postarAnonimo} onChange={(e) => setPostarAnonimo(e.target.checked)} />
          Postar anônimo (em vez de @{perfil?.apelido})
        </label>

        {postarAnonimo && (
          <input
            type="text"
            value={apelidoManual}
            onChange={(e) => setApelidoManual(e.target.value)}
            placeholder="Apelido para esse post (opcional)"
            className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
        )}

        <label className="flex items-center gap-2 text-[10px] font-mono text-accent/70">
          <input type="checkbox" checked={incluirLocalizacao} onChange={(e) => setIncluirLocalizacao(e.target.checked)} />
          <MapPin size={12} />
          Incluir minha localização em tempo real
        </label>

        <button
          onClick={publicar}
          disabled={enviando}
          className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs"
        >
          {enviando ? 'PUBLICANDO...' : 'PUBLICAR AGORA'}
        </button>
      </div>
    </div>
  )
}