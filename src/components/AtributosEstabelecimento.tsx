import React from 'react'
import { Accessibility, HeartHandshake, Wifi, ParkingCircle, PawPrint } from 'lucide-react'

export const ATRIBUTOS_DISPONIVEIS = [
  { chave: 'acessibilidade', label: 'Acessível para cadeira de rodas', Icone: Accessibility },
  { chave: 'lgbtqia_friendly', label: 'Espaço que apoia a causa LGBTQIA+', Icone: HeartHandshake },
  { chave: 'wifi_gratuito', label: 'Wi-Fi grátis', Icone: Wifi },
  { chave: 'estacionamento', label: 'Estacionamento', Icone: ParkingCircle },
  { chave: 'aceita_pets', label: 'Aceita pets', Icone: PawPrint }
] as const

export type Atributos = Record<string, boolean>

export function AtributosEstabelecimento({
  atributos,
  onChange
}: {
  atributos: Atributos
  onChange: (novos: Atributos) => void
}) {
  const alternar = (chave: string) => {
    onChange({ ...atributos, [chave]: !atributos[chave] })
  }

  return (
    <div className="space-y-2">
      <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
        Informações adicionais (opcional)
      </span>
      {ATRIBUTOS_DISPONIVEIS.map(({ chave, label, Icone }) => (
        <label key={chave} className="flex items-center gap-2 text-[11px] text-accent/70 cursor-pointer">
          <input
            type="checkbox"
            checked={!!atributos[chave]}
            onChange={() => alternar(chave)}
          />
          <Icone size={14} className="flex-shrink-0" />
          {label}
        </label>
      ))}
    </div>
  )
}