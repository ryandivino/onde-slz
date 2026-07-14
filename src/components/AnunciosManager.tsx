import React, { useRef, useState } from 'react'
import { useAnuncios } from '../hooks/useAnuncios'
import type { Anuncio } from '../hooks/useAnuncios'
import { X, Upload, Trash2, EyeOff, Eye } from 'lucide-react'

export function AnunciosManager({ onClose }: { onClose: () => void }) {
  const { anuncios, carregando, publicarAnuncio, removerAnuncio, alternarAtivo } = useAnuncios()
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const lidarComArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (arquivo.type !== 'image/png') {
      setErro('Só é permitido enviar imagens .png por enquanto.')
      return
    }

    setErro(null)
    setEnviando(true)
    const { error } = await publicarAnuncio(arquivo)
    setEnviando(false)
    if (error) setErro(error.message)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500">GERENCIAR ANÚNCIOS</span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <input ref={inputRef} type="file" accept="image/png" onChange={lidarComArquivo} className="hidden" id="upload-anuncio" />
        <label
          htmlFor="upload-anuncio"
          className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-3 rounded-lg border border-dashed border-borderRaw text-accent/70 cursor-pointer"
        >
          <Upload size={14} />
          {enviando ? 'Enviando...' : 'Publicar novo anúncio (.png)'}
        </label>

        <div className="space-y-2">
          {carregando && <p className="text-[10px] text-accent/40">Carregando...</p>}
          {!carregando && anuncios.length === 0 && <p className="text-[10px] text-accent/30">Nenhum anúncio publicado ainda.</p>}

          {anuncios.map((a: Anuncio) => (
            <div key={a.id} className="flex items-center gap-3 border border-borderRaw/20 rounded-lg p-2">
              <img src={a.image_url} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={`text-[9px] font-mono ${a.ativo ? 'text-green-400' : 'text-accent/40'}`}>
                  {a.ativo ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <button onClick={() => alternarAtivo(a)} className="text-accent/50 hover:text-accent flex-shrink-0">
                {a.ativo ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => { if (confirm('Remover esse anúncio?')) removerAnuncio(a) }} className="text-red-400 flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}