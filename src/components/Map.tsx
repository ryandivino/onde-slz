import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { formatarTempoRelativo } from '../utils/tempo'

type Foco = { lat: number; lng: number; ts: number } | null

const CENTRO_PADRAO: [number, number] = [-2.5307, -44.3068] // fallback: São Luís

const iconeMeuLocal = L.divIcon({
  className: 'meu-local-pin',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="
        position: absolute; inset: 0;
        background: #f97316;
        opacity: 0.35;
        border-radius: 50%;
        animation: pulso-onde 1.8s infinite ease-out;
      "></div>
      <div style="
        position: absolute; top: 4px; left: 4px;
        width: 12px; height: 12px;
        background: #f97316;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(249,115,22,0.9);
      "></div>
    </div>
    <style>
      @keyframes pulso-onde {
        0% { transform: scale(0.6); opacity: 0.5; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

export function Map({ dados, foco, mostrarCalor, pontosExtras }: { dados: any[]; foco?: Foco; mostrarCalor?: boolean; pontosExtras?: Array<[number, number, number]> }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)
  const meuMarcador = useRef<L.Marker | null>(null)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const iniciarMapa = (centro: [number, number], zoomInicial: number) => {
      if (!mapRef.current || mapInstance.current) return

      mapInstance.current = L.map(mapRef.current, {
        center: centro,
        zoom: zoomInicial,
        zoomControl: false,
        attributionControl: false
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapInstance.current)

      markersLayer.current = L.layerGroup().addTo(mapInstance.current)
    }

    if (!navigator.geolocation) {
      iniciarMapa(CENTRO_PADRAO, 14)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        iniciarMapa([pos.coords.latitude, pos.coords.longitude], 15)
        atualizarMeuMarcador(pos.coords.latitude, pos.coords.longitude)
      },
      () => iniciarMapa(CENTRO_PADRAO, 14),
      { enableHighAccuracy: true, timeout: 8000 }
    )

    // Terceiro tipo de ponto: posição do usuário em tempo real — acompanha o
    // GPS continuamente (não é só a posição inicial, atualiza conforme a pessoa se move).
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => atualizarMeuMarcador(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error('Erro ao acompanhar localização:', err),
      { enableHighAccuracy: true }
    )

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  const atualizarMeuMarcador = (lat: number, lng: number) => {
    if (!mapInstance.current) return
    if (meuMarcador.current) {
      meuMarcador.current.setLatLng([lat, lng])
    } else {
      meuMarcador.current = L.marker([lat, lng], { icon: iconeMeuLocal, zIndexOffset: 1000 }).addTo(mapInstance.current)
    }
  }

  useEffect(() => {
    if (!foco || !mapInstance.current) return
    mapInstance.current.flyTo([foco.lat, foco.lng], 17)
  }, [foco?.ts])

  // Mapa de calor: densidade de atividades recentes (só rolês, não pontos fixos —
  // isso é sobre "onde tá rolando agora", os fixos já têm pin próprio permanente).
  // Post mais recente pesa mais que um perto do fim da janela de 24h.
  useEffect(() => {
    if (!mapInstance.current) return

    if (!mostrarCalor) {
      if (heatLayerRef.current) {
        mapInstance.current.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      return
    }

    const agora = Date.now()
    const pontos: Array<[number, number, number]> = dados
      .filter((r) => !r.is_fixed && r.lat !== null && r.lng !== null)
      .map((r) => {
        const idadeHoras = (agora - new Date(r.created_at).getTime()) / (1000 * 60 * 60)
        const peso = Math.max(0.2, 1 - idadeHoras / 24)
        return [r.lat, r.lng, peso]
      })

    // Check-ins de lotação também esquentam o mapa — são um sinal ainda mais
    // forte que um post (é gente confirmando presença de verdade, agora).
    if (pontosExtras) pontos.push(...pontosExtras)

    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current)
    }
    heatLayerRef.current = L.heatLayer(pontos, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.2: '#22c55e', 0.5: '#f97316', 1.0: '#ef4444' }
    }).addTo(mapInstance.current)
  }, [dados, mostrarCalor, pontosExtras])

  useEffect(() => {
    if (!markersLayer.current) return
    markersLayer.current.clearLayers()

    dados.forEach((relato) => {
      // Posts sem localização (ex: AGORA com localização desmarcada) não têm pin no mapa
      if (relato.lat === null || relato.lng === null) return

      const isAgoraComFoto = relato.categoria === 'AGORA' && relato.image_url
      const cor = relato.is_fixed ? '#f5f5f5' : '#22c55e'

      const pinIcon = isAgoraComFoto
        ? L.divIcon({
            className: 'agora-pin',
            html: `
              <div style="
                width: 34px; height: 34px;
                border-radius: 50%;
                background-image: url('${relato.image_url}');
                background-size: cover;
                background-position: center;
                border: 2px solid #f97316;
                box-shadow: 0 0 10px rgba(249,115,22,0.7);
              "></div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        : L.divIcon({
            className: 'custom-pin',
            html: `
              <div style="
                width: 16px; height: 16px;
                background: ${cor};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px ${cor}CC;
              "></div>
            `,
            iconSize: [16, 16]
          })

      const marker = L.marker([relato.lat, relato.lng], { icon: pinIcon })
        .addTo(markersLayer.current!)
        .bindPopup(`
          <div class="font-mono text-[10px] text-black">
            <strong class="block mb-1">${relato.nome_local || relato.apelido || 'ANÔNIMO'}</strong>
            <p>"${relato.texto}"</p>
            <span class="italic text-gray-500">${formatarTempoRelativo(relato.created_at)}</span>
          </div>
        `)
    })
  }, [dados])

  return <div ref={mapRef} className="w-full h-full bg-[#050505]" />
}