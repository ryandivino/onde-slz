import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Satellite, Map as MapIcon } from 'lucide-react'

const CENTRO_PADRAO: [number, number] = [-2.5307, -44.3068] // São Luís

const TILE_RUAS = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export function MapaLocalPicker({
  lat,
  lng,
  centroSugerido,
  onChange,
  bloqueado
}: {
  lat: number | null
  lng: number | null
  centroSugerido?: { lat: number; lng: number } | null
  onChange: (lat: number, lng: number) => void
  bloqueado?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const marcador = useRef<L.Marker | null>(null)
  const camadaTile = useRef<L.TileLayer | null>(null)

  // Diferente de checar "lat !== null" (que fica true logo de cara, porque
  // a posição padrão já é gravada assim que o mapa monta) — isso aqui só
  // vira true quando o USUÁRIO de fato arrasta ou toca no mapa. Sem essa
  // distinção, a geocodificação do endereço (que chega um pouco depois,
  // é assíncrona) nunca conseguia mover o pino: o código achava que "já
  // tinha uma posição definida" e ignorava a sugestão.
  const ajustadoManualmente = useRef(false)

  const [modoMapa, setModoMapa] = useState<'satelite' | 'ruas'>('satelite')

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const centroInicial: [number, number] =
      lat !== null && lng !== null ? [lat, lng] :
      centroSugerido ? [centroSugerido.lat, centroSugerido.lng] :
      CENTRO_PADRAO

    mapInstance.current = L.map(mapRef.current, {
      center: centroInicial,
      zoom: 18,
      zoomControl: true,
      attributionControl: false
    })

    camadaTile.current = L.tileLayer(TILE_SATELITE, { maxZoom: 20 }).addTo(mapInstance.current)

    const icone = L.divIcon({
      className: 'seletor-pin',
      html: `<div style="width:24px;height:24px;background:#ff14e1;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(255,20,225,0.9);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    marcador.current = L.marker(centroInicial, { icon: icone, draggable: !bloqueado }).addTo(mapInstance.current)

    marcador.current.on('dragend', () => {
      ajustadoManualmente.current = true
      const pos = marcador.current!.getLatLng()
      onChange(pos.lat, pos.lng)
    })

    if (!bloqueado) {
      mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
        ajustadoManualmente.current = true
        marcador.current!.setLatLng(e.latlng)
        onChange(e.latlng.lat, e.latlng.lng)
      })
    }

    if (lat === null || lng === null) {
      onChange(centroInicial[0], centroInicial[1])
    }

    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    if (!centroSugerido || !mapInstance.current || !marcador.current) return
    if (ajustadoManualmente.current) return
    marcador.current.setLatLng([centroSugerido.lat, centroSugerido.lng])
    mapInstance.current.setView([centroSugerido.lat, centroSugerido.lng], 18)
    onChange(centroSugerido.lat, centroSugerido.lng)
  }, [centroSugerido])

  const alternarCamada = () => {
    if (!mapInstance.current || !camadaTile.current) return
    const novoModo = modoMapa === 'satelite' ? 'ruas' : 'satelite'
    mapInstance.current.removeLayer(camadaTile.current)
    camadaTile.current = L.tileLayer(novoModo === 'satelite' ? TILE_SATELITE : TILE_RUAS, { maxZoom: 20 }).addTo(mapInstance.current)
    setModoMapa(novoModo)
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div ref={mapRef} className="w-full h-56 rounded-lg overflow-hidden border border-borderRaw" />

        <button
          type="button"
          onClick={alternarCamada}
          className="absolute top-2 right-2 z-[500] bg-background/90 border border-borderRaw rounded-lg px-2 py-1.5 text-[9px] font-mono text-accent/80 flex items-center gap-1"
        >
          {modoMapa === 'satelite' ? <><MapIcon size={12} /> Mapa</> : <><Satellite size={12} /> Satélite</>}
        </button>

        {modoMapa === 'satelite' && (
          <span className="absolute bottom-1 left-1 z-[500] text-[7px] text-white/50 bg-black/40 px-1 rounded">
            Esri, Maxar, Earthstar Geographics
          </span>
        )}
      </div>
      {!bloqueado && (
        <p className="text-[9px] text-accent/40">Arraste o pino ou toque no mapa pra posicionar exatamente no local desejado.</p>
      )}
    </div>
  )
}