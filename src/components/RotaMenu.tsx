import React from 'react'
import { X, Navigation } from 'lucide-react'

export function RotaMenu({ lat, lng, onClose }: { lat: number; lng: number; onClose: () => void }) {
  const opcoes = [
    { nome: 'Google Maps', url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` },
    { nome: 'Waze', url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
    { nome: 'Apple Maps', url: `https://maps.apple.com/?daddr=${lat},${lng}` }
  ]

  const abrir = (url: string) => {
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Navigation size={14} /> IR ATÉ LÁ
          </span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        <p className="text-[10px] text-accent/50">Abrir a rota em:</p>

        {opcoes.map((o) => (
          <button
            key={o.nome}
            onClick={() => abrir(o.url)}
            className="w-full text-left text-xs font-mono py-2.5 px-3 rounded-lg border border-borderRaw text-accent/80 hover:bg-background/60"
          >
            {o.nome}
          </button>
        ))}
      </div>
    </div>
  )
}