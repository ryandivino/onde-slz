import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function Map({ dados }: { dados: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    mapInstance.current = L.map(mapRef.current, {
      center: [-2.5307, -44.3068],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(mapInstance.current)

    markersLayer.current = L.layerGroup().addTo(mapInstance.current)

    // Geolocalização mantida igual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstance.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16)
        }
      )
    }

    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, [])

  // EFEITO QUE DESENHA OS PINS VERDES
  useEffect(() => {
    if (!markersLayer.current) return
    markersLayer.current.clearLayers() // Limpa pins antigos

    dados.forEach((relato) => {
      const greenPin = L.divIcon({
        className: 'custom-green-pin',
        html: `
          <div class="w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
        `,
        iconSize: [16, 16]
      })

      const marker = L.marker([relato.lat, relato.lng], { icon: greenPin })
        .addTo(markersLayer.current!)
        .bindPopup(`
          <div class="font-mono text-[10px] text-black">
            <strong class="block mb-1">${relato.nome_local || relato.apelido || 'ANÔNIMO'}</strong>
            <p>"${relato.texto}"</p>
          </div>
        `)
    })
  }, [dados])

  return <div ref={mapRef} className="w-full h-full bg-[#050505]" />
}