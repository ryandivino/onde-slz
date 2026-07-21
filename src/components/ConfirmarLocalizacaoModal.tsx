import React from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'

export function ConfirmarLocalizacaoModal({
  lat,
  lng,
  onChange,
  textoResumo,
  onConfirmar,
  onVoltar,
  publicando,
  tituloBotao = 'Confirmar e publicar'
}: {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  textoResumo?: string
  onConfirmar: () => void
  onVoltar: () => void
  publicando: boolean
  tituloBotao?: string
}) {
  return (
    <div className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl">
        <span className="text-[10px] font-mono tracking-widest text-accent block">
          SUA PUBLICAÇÃO VAI APARECER AQUI
        </span>

        {textoResumo && (
          <p className="text-xs text-accent/70 italic border-l-2 border-borderRaw pl-2">"{textoResumo}"</p>
        )}

        <MapaLocalPicker lat={lat} lng={lng} onChange={onChange} bloqueado />
        <p className="text-[9px] text-accent/40">Essa é o local que você se encontra, capturado automaticamente pelo GPS.</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onVoltar}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60"
          >
            <ArrowLeft size={13} /> Voltar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={publicando}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold disabled:opacity-50"
          >
            <Check size={13} /> {publicando ? 'Publicando...' : tituloBotao}
          </button>
        </div>
      </div>
    </div>
  )
}