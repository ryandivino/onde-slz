import React, { useState } from 'react'
import { Search, Link2, MapPin } from 'lucide-react'
import { supabase } from '../supabase'
import { extrairCoordenadasDoLink, ehLinkCurto } from '../utils/linkMapa'

type ResultadoBusca = { display_name: string; lat: string; lon: string }

export function LocationPicker({
  lat,
  lng,
  onChange
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const [termoBusca, setTermoBusca] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  const [linkColado, setLinkColado] = useState('')
  const [processandoLink, setProcessandoLink] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)

  const buscarEndereco = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termoBusca.trim()) return
    setBuscando(true)
    setErroBusca(null)
    setResultados([])

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termoBusca)}&countrycodes=br&limit=5`
      const resp = await fetch(url)
      const dados: ResultadoBusca[] = await resp.json()

      if (dados.length === 0) {
        setErroBusca('Nenhum endereço encontrado. Tente colar um link do Maps.')
      } else {
        setResultados(dados)
      }
    } catch {
      setErroBusca('Não foi possível buscar agora. Tente colar um link do Maps.')
    }

    setBuscando(false)
  }

  const irParaResultado = (resultado: ResultadoBusca) => {
    onChange(parseFloat(resultado.lat), parseFloat(resultado.lon))
    setResultados([])
    setTermoBusca(resultado.display_name)
  }

  const lidarComLinkColado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkColado.trim()) return
    setErroLink(null)
    setProcessandoLink(true)

    try {
      const coordenadasDiretas = extrairCoordenadasDoLink(linkColado)
      if (coordenadasDiretas) {
        onChange(coordenadasDiretas.lat, coordenadasDiretas.lng)
        setProcessandoLink(false)
        return
      }

      if (ehLinkCurto(linkColado)) {
        const { data, error } = await supabase.functions.invoke('resolver-link-mapa', { body: { url: linkColado } })
        if (error || !data?.finalUrl) throw new Error()

        const coordenadasResolvidas = extrairCoordenadasDoLink(data.finalUrl)
        if (coordenadasResolvidas) {
          onChange(coordenadasResolvidas.lat, coordenadasResolvidas.lng)
          setProcessandoLink(false)
          return
        }
      }

      setErroLink('Não consegui encontrar a coordenada nesse link. Tenta buscar pelo endereço.')
    } catch {
      setErroLink('Não consegui ler esse link. Tenta buscar pelo endereço.')
    }

    setProcessandoLink(false)
  }

  return (
    <div className="space-y-2">
      <form onSubmit={lidarComLinkColado} className="flex gap-2">
        <input
          type="text"
          value={linkColado}
          onChange={(e) => setLinkColado(e.target.value)}
          placeholder="Colar link do Google Maps ou Apple Maps"
          className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />
        <button type="submit" disabled={processandoLink} className="bg-background border border-borderRaw rounded-lg px-3 text-accent/70 flex-shrink-0">
          <Link2 size={14} />
        </button>
      </form>
      {erroLink && <p className="text-[9px] text-red-400">{erroLink}</p>}

      <form onSubmit={buscarEndereco} className="flex gap-2">
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Ou buscar endereço (rua, número, bairro)"
          className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />
        <button type="submit" disabled={buscando} className="bg-background border border-borderRaw rounded-lg px-3 text-accent/70 flex-shrink-0">
          <Search size={14} />
        </button>
      </form>
      {erroBusca && <p className="text-[9px] text-red-400">{erroBusca}</p>}

      {resultados.length > 0 && (
        <div className="space-y-1 border border-borderRaw rounded-lg overflow-hidden">
          {resultados.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irParaResultado(r)}
              className="w-full text-left text-[10px] font-mono px-2 py-2 text-accent/70 hover:bg-background/60 border-b border-borderRaw/20 last:border-b-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {lat !== null && lng !== null && (
        <p className="text-[10px] text-green-400 flex items-center gap-1.5">
          <MapPin size={12} /> Localização definida ({lat.toFixed(5)}, {lng.toFixed(5)})
        </p>
      )}
    </div>
  )
}