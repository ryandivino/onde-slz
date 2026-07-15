import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Link2, Satellite, Map as MapIcon, Check, Pencil } from 'lucide-react'
import { supabase } from '../supabase'
import { extrairCoordenadasDoLink, ehLinkCurto } from '../utils/linkMapa'

const CENTRO_PADRAO: [number, number] = [-2.5307, -44.3068] // São Luís

const TILE_RUAS = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

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
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const marcador = useRef<L.Marker | null>(null)
  const camadaTile = useRef<L.TileLayer | null>(null)

  const [termoBusca, setTermoBusca] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  const [linkColado, setLinkColado] = useState('')
  const [processandoLink, setProcessandoLink] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)

  const [modoMapa, setModoMapa] = useState<'ruas' | 'satelite'>('ruas')
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const centroInicial: [number, number] = lat !== null && lng !== null ? [lat, lng] : CENTRO_PADRAO

    mapInstance.current = L.map(mapRef.current, {
      center: centroInicial,
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    })

    camadaTile.current = L.tileLayer(TILE_RUAS, { maxZoom: 20 }).addTo(mapInstance.current)

    const icone = L.divIcon({
      className: 'seletor-pin',
      html: `<div style="width:22px;height:22px;background:#5e25ff;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(94,37,255,0.8);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    })

    marcador.current = L.marker(centroInicial, { icon: icone, draggable: true }).addTo(mapInstance.current)

    marcador.current.on('dragend', () => {
      const pos = marcador.current!.getLatLng()
      onChange(pos.lat, pos.lng)
      setConfirmado(false)
    })

    mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
      marcador.current!.setLatLng(e.latlng)
      onChange(e.latlng.lat, e.latlng.lng)
      setConfirmado(false)
    })

    if (lat === null || lng === null) {
      onChange(centroInicial[0], centroInicial[1])
    }

    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    if (lat === null || lng === null || !marcador.current || !mapInstance.current) return
    marcador.current.setLatLng([lat, lng])
    mapInstance.current.setView([lat, lng])
  }, [lat, lng])

  const alternarCamada = (modo: 'ruas' | 'satelite') => {
    if (!mapInstance.current || !camadaTile.current) return
    mapInstance.current.removeLayer(camadaTile.current)
    camadaTile.current = L.tileLayer(modo === 'ruas' ? TILE_RUAS : TILE_SATELITE, { maxZoom: 20 }).addTo(mapInstance.current)
    setModoMapa(modo)
  }

  const moverPara = (novoLat: number, novoLng: number, zoom = 17) => {
    onChange(novoLat, novoLng)
    mapInstance.current?.setView([novoLat, novoLng], zoom)
    setConfirmado(false)
  }

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
        setErroBusca('Nenhum endereço encontrado. Tente colar um link do Maps, ou ajuste o pino direto no mapa.')
      } else {
        setResultados(dados)
      }
    } catch {
      setErroBusca('Não foi possível buscar agora. Ajuste o pino direto no mapa.')
    }

    setBuscando(false)
  }

  const irParaResultado = (resultado: ResultadoBusca) => {
    moverPara(parseFloat(resultado.lat), parseFloat(resultado.lon))
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
        moverPara(coordenadasDiretas.lat, coordenadasDiretas.lng)
        setProcessandoLink(false)
        return
      }

      if (ehLinkCurto(linkColado)) {
        const { data, error } = await supabase.functions.invoke('resolver-link-mapa', { body: { url: linkColado } })
        if (error || !data?.finalUrl) throw new Error()

        const coordenadasResolvidas = extrairCoordenadasDoLink(data.finalUrl)
        if (coordenadasResolvidas) {
          moverPara(coordenadasResolvidas.lat, coordenadasResolvidas.lng)
          setProcessandoLink(false)
          return
        }
      }

      setErroLink('Não consegui encontrar a coordenada nesse link. Tenta buscar pelo endereço ou ajustar o pino direto no mapa.')
    } catch {
      setErroLink('Não consegui ler esse link. Tenta buscar pelo endereço ou ajustar o pino direto no mapa.')
    }

    setProcessandoLink(false)
  }

  return (
    <div className="space-y-2">
      {/* Colar link do Google Maps / Apple Maps */}
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

      {/* Busca por endereço, como alternativa */}
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

      <div className="relative">
        <div ref={mapRef} className="w-full h-52 rounded-lg overflow-hidden border border-borderRaw" />

        {/* Toggle mapa/satélite */}
        <button
          type="button"
          onClick={() => alternarCamada(modoMapa === 'ruas' ? 'satelite' : 'ruas')}
          className="absolute top-2 right-2 z-[500] bg-background/90 border border-borderRaw rounded-lg px-2 py-1.5 text-[9px] font-mono text-accent/80 flex items-center gap-1"
        >
          {modoMapa === 'ruas' ? <><Satellite size={12} /> Satélite</> : <><MapIcon size={12} /> Mapa</>}
        </button>

        {modoMapa === 'satelite' && (
          <span className="absolute bottom-1 left-1 z-[500] text-[7px] text-white/50 bg-black/40 px-1 rounded">
            Esri, Maxar, Earthstar Geographics
          </span>
        )}
      </div>

      {/* Confirmação estilo Uber/99 */}
      {!confirmado ? (
        <button
          type="button"
          onClick={() => setConfirmado(true)}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold"
        >
          <Check size={14} /> É aqui? Confirmar local.
        </button>
      ) : (
        <div className="w-full flex items-center justify-between text-[10px] font-mono py-2 px-3 rounded-lg border border-green-500/40 text-green-400">
          <span className="flex items-center gap-2"><Check size={13} /> Local confirmado</span>
          <button type="button" onClick={() => setConfirmado(false)} className="flex items-center gap-1 text-accent/50 hover:text-accent">
            <Pencil size={12} /> Ajustar
          </button>
        </div>
      )}

      <p className="text-[9px] text-accent/40">Cole um link do Maps, busque o endereço, ou arraste o pino/toque no mapa pra afinar.</p>
    </div>
  )
}