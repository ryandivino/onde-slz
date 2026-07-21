import React, { useEffect, useRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { Beer, UtensilsCrossed, Palette, MapPin, Calendar, Navigation, Flag, Send } from 'lucide-react'
import { formatarTempoRelativo } from '../utils/tempo'

type Foco = { lat: number; lng: number; ts: number } | null

const CENTRO_PADRAO: [number, number] = [-2.5307, -44.3068]
const ZOOM_MINIMO_PARA_NOME = 16

const ICONE_POR_CATEGORIA: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  BARES: Beer,
  RESTAURANTES: UtensilsCrossed,
  CULTURA: Palette
}

function svgComoTexto(Icone: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>, cor: string) {
  return renderToStaticMarkup(<Icone size={15} color={cor} strokeWidth={2.4} />)
}

function svgBotao(Icone: React.ComponentType<{ size?: number; color?: string }>) {
  return renderToStaticMarkup(<Icone size={13} color="#0a0a0a" />)
}

// Monta o conteúdo do popup com os botões de ação mais usados — em vez de
// mandar quem clicou no pin "voltar pro drawer" pra achar o card e agir de
// lá, as ações ficam disponíveis direto onde a pessoa já está.
function montarPopupComAcoes(titulo: string, corpo: string, acoes: { classe: string; icone: string }[]) {
  const botoesHtml = acoes
    .map((a) => `<button class="${a.classe}" style="background:#f5f5f5; border-radius:6px; padding:4px 7px; margin-right:4px; border:none; cursor:pointer;">${a.icone}</button>`)
    .join('')

  return `
    <div class="font-mono text-[10px] text-black" style="min-width:140px;">
      <strong class="block mb-1">${titulo}</strong>
      ${corpo}
      <div style="display:flex; margin-top:6px;">${botoesHtml}</div>
    </div>
  `
}

// Quando vários pins ficam muito próximos (ex: um bar cheio, todo mundo
// dando AGORA ao mesmo tempo), em vez de empilhar um por cima do outro,
// agrupa num círculo com o número — clica ou dá zoom pra abrir e ver
// cada um separado. Visual customizado pra combinar com a marca, em vez
// do azul/laranja padrão do leaflet.markercluster.
function criarIconeCluster(cluster: any) {
  const quantidade = cluster.getChildCount()
  const tamanho = quantidade >= 20 ? 46 : quantidade >= 8 ? 40 : 34

  return L.divIcon({
    className: 'cluster-pin',
    html: `
      <div style="
        width: ${tamanho}px; height: ${tamanho}px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff14e1, #9cff00);
        border: 2px solid white;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff;
        font-family: monospace;
        font-weight: bold;
        font-size: ${tamanho >= 40 ? 14 : 12}px;
        box-shadow: 0 0 12px rgba(255,20,225,0.7);
      ">${quantidade}</div>
    `,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2]
  })
}

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

function criarIconeLocalFixo(nome: string, categoria: string) {
  const Icone = ICONE_POR_CATEGORIA[categoria] || MapPin
  const svg = svgComoTexto(Icone, '#0a0a0a')

  return L.divIcon({
    className: 'local-fixo-pin',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
        <div class="nome-label" style="
          background: rgba(10,10,10,0.85);
          color: #f5f5f5;
          font-family: monospace;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${nome}</div>
        <div style="
          width: 28px; height: 28px;
          background: #f5f5f5;
          border: 2px solid white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 8px rgba(245,245,245,0.6);
        ">${svg}</div>
      </div>
    `,
    iconSize: [28, 46],
    iconAnchor: [14, 28]
  })
}

function criarIconeEvento(titulo: string) {
  const svg = svgComoTexto(Calendar, '#0a0a0a')

  return L.divIcon({
    className: 'evento-pin',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
        <div class="nome-label" style="
          background: rgba(10,10,10,0.85);
          color: #9cff00;
          font-family: monospace;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${titulo}</div>
        <div style="
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #ff14e1, #9cff00);
          border: 2px solid white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 10px rgba(255,20,225,0.6);
        ">${svg}</div>
      </div>
    `,
    iconSize: [28, 46],
    iconAnchor: [14, 28]
  })
}

function criarIconeRole(avatarUrl: string | null, apelido: string) {
  const conteudoAvatar = avatarUrl
    ? `background-image:url('${avatarUrl}'); background-size:cover; background-position:center;`
    : `background:#22c55e; display:flex; align-items:center; justify-content:center; color:white; font-family:monospace; font-size:11px; font-weight:bold;`

  const iniciais = apelido ? apelido.charAt(0).toUpperCase() : '?'

  return L.divIcon({
    className: 'role-pin',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
        <div style="
          background: rgba(10,10,10,0.85);
          color: #22c55e;
          font-family: monospace;
          font-size: 9px;
          font-weight: bold;
          padding: 1px 5px;
          border-radius: 4px;
          white-space: nowrap;
        ">@${apelido}</div>
        <div style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); ${conteudoAvatar}">
          ${avatarUrl ? '' : iniciais}
        </div>
      </div>
    `,
    iconSize: [30, 50],
    iconAnchor: [15, 30]
  })
}

export function Map({
  dados,
  eventos,
  foco,
  mostrarCalor,
  pontosExtras,
  onAbrirRota,
  onDenunciarPulso,
  onDenunciarEvento,
  onConvidar
}: {
  dados: any[]
  eventos?: any[]
  foco?: Foco
  mostrarCalor?: boolean
  pontosExtras?: Array<[number, number, number]>
  onAbrirRota?: (lat: number, lng: number) => void
  onDenunciarPulso?: (id: number) => void
  onDenunciarEvento?: (id: number) => void
  onConvidar?: (pulso: { id: number; texto: string; lat: number | null; lng: number | null }) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<any>(null)
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

      markersLayer.current = (L as any).markerClusterGroup({
        iconCreateFunction: criarIconeCluster,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      }).addTo(mapInstance.current)

      const atualizarClasseZoom = () => {
        if (!mapRef.current || !mapInstance.current) return
        const zoomAtual = mapInstance.current.getZoom()
        mapRef.current.classList.toggle('zoom-perto', zoomAtual >= ZOOM_MINIMO_PARA_NOME)
      }
      mapInstance.current.on('zoomend', atualizarClasseZoom)
      atualizarClasseZoom()
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
      if (relato.lat === null || relato.lng === null) return

      const isAgoraComFoto = relato.categoria === 'AGORA' && relato.image_url

      let pinIcon: L.DivIcon

      if (isAgoraComFoto) {
        pinIcon = L.divIcon({
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
      } else if (relato.is_fixed) {
        pinIcon = criarIconeLocalFixo(relato.nome_local || 'LOCAL', relato.categoria)
      } else {
        pinIcon = criarIconeRole(relato.autor?.avatar_url || null, relato.apelido || 'anonimo')
      }

      L.marker([relato.lat, relato.lng], { icon: pinIcon })
        .addTo(markersLayer.current!)
        .bindPopup(montarPopupComAcoes(
          relato.nome_local || relato.apelido || 'ANÔNIMO',
          `<p>"${relato.texto}"</p>${relato.is_fixed ? '' : `<span class="italic text-gray-500">${formatarTempoRelativo(relato.created_at)}</span>`}`,
          [
            { classe: 'popup-btn-rota', icone: svgBotao(Navigation) },
            { classe: 'popup-btn-denunciar', icone: svgBotao(Flag) },
            ...(!relato.is_fixed ? [{ classe: 'popup-btn-convidar', icone: svgBotao(Send) }] : [])
          ]
        ))
        .on('popupopen', (e) => {
          const el = e.popup.getElement()
          el?.querySelector('.popup-btn-rota')?.addEventListener('click', () => onAbrirRota?.(relato.lat, relato.lng))
          el?.querySelector('.popup-btn-denunciar')?.addEventListener('click', () => onDenunciarPulso?.(relato.id))
          el?.querySelector('.popup-btn-convidar')?.addEventListener('click', () => onConvidar?.({ id: relato.id, texto: relato.texto, lat: relato.lat, lng: relato.lng }))
        })
    })

    ;(eventos || []).forEach((evento) => {
      if (evento.lat === null || evento.lng === null) return

      L.marker([evento.lat, evento.lng], { icon: criarIconeEvento(evento.titulo) })
        .addTo(markersLayer.current!)
        .bindPopup(montarPopupComAcoes(
          evento.titulo,
          `<p>${new Date(evento.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>`,
          [
            { classe: 'popup-btn-rota', icone: svgBotao(Navigation) },
            { classe: 'popup-btn-denunciar', icone: svgBotao(Flag) }
          ]
        ))
        .on('popupopen', (e) => {
          const el = e.popup.getElement()
          el?.querySelector('.popup-btn-rota')?.addEventListener('click', () => onAbrirRota?.(evento.lat, evento.lng))
          el?.querySelector('.popup-btn-denunciar')?.addEventListener('click', () => onDenunciarEvento?.(evento.id))
        })
    })
  }, [dados, eventos, onAbrirRota, onDenunciarPulso, onDenunciarEvento, onConvidar])

  return (
    <>
      <style>{`
        .nome-label { display: none; }
        .zoom-perto .nome-label { display: block; }
      `}</style>
      <div ref={mapRef} className="w-full h-full bg-[#050505]" />
    </>
  )
}