import React, { useState, useEffect, useRef } from 'react'
import { Map } from './components/Map'
import { supabase } from './supabase'
import { formatarTempoRelativo } from './utils/tempo'
import { useAuth } from './hooks/useAuth'
import { useAmizades } from './hooks/useAmizades'
import { useNotificacoes } from './hooks/useNotificacoes'
import { LoginScreen } from './components/LoginScreen'
import { EmpresaScreen } from './components/EmpresaScreen'
import { MenuPanel } from './components/MenuPanel'
import { PerfilScreen } from './components/PerfilScreen'
import { AmigosPanel } from './components/AmigosPanel'
import { NotificationsPanel } from './components/NotificationsPanel'
import { DenunciaModal } from './components/DenunciaModal'
import { DenunciasManager } from './components/DenunciasManager'
import { AgoraModal } from './components/AgoraModal'
import { AgoraStories } from './components/AgoraStories'
import { AgoraViewer } from './components/AgoraViewer'
import { RotaMenu } from './components/RotaMenu'
import { ConvidarAmigoModal } from './components/ConvidarAmigoModal'
import { useEventos } from './hooks/useEventos'
import { useResumoSemanal } from './hooks/useResumoSemanal'
import { useRegistrarAbertura } from './hooks/useMetricas'
import { EstatisticasPanel } from './components/EstatisticasPanel'
import { InstallPrompt } from './components/InstallPrompt'
import { PerfilPublicoModal } from './components/PerfilPublicoModal'
import { CadastroLocalModerador } from './components/CadastroLocalModerador'
import { EventoModal } from './components/EventoModal'
import { useEventosGerais } from './hooks/useEventosGerais'
import { EditarLocalModal } from './components/EditarLocalModal'
import { ConfirmarLocalizacaoModal } from './components/ConfirmarLocalizacaoModal'
import { useLotacao } from './hooks/useLotacao'
import { EventosManager } from './components/EventosManager'
import { AnunciosManager } from './components/AnunciosManager'
import { ModeradoresManager } from './components/ModeradoresManager'
import { LoadingScreen } from './components/LoadingScreen'
import { PoliticasModal, politicasJaAceitas } from './components/PoliticasModal'
import { AdBanner } from './components/AdBanner'
import { NovaSenhaScreen } from './components/NovaSenhaScreen'
import { Menu, Bell, MapPin, Plus, Camera, Users, X, Flag, Search, Navigation, Send, Calendar, Flame, Pencil, Beer, UtensilsCrossed, Palette, Trash2 } from 'lucide-react'
import logo from './assets/logo.png'

import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

const ICONE_POR_FILTRO: Record<string, React.ComponentType<{ size?: number }>> = {
  BARES: Beer,
  RESTAURANTES: UtensilsCrossed,
  CULTURA: Palette,
  OUTROS: MapPin,
  AMIGOS: Users
}

export default function App() {
  const { usuarioLogado, perfil, session, emRecuperacaoSenha } = useAuth()
  const { amigosIds } = useAmizades()
  const { totalNaoLidas } = useNotificacoes()
  const [isNotificacoesOpen, setIsNotificacoesOpen] = useState(false)
  const [isAnunciosManagerOpen, setIsAnunciosManagerOpen] = useState(false)
  const [isModeradoresOpen, setIsModeradoresOpen] = useState(false)
  const [isDenunciasOpen, setIsDenunciasOpen] = useState(false)
  const [isPerfilOpen, setIsPerfilOpen] = useState(false)
  const [isEstatisticasOpen, setIsEstatisticasOpen] = useState(false)
  const [isAgoraOpen, setIsAgoraOpen] = useState(false)
  const [agoraViewerIndice, setAgoraViewerIndice] = useState<number | null>(null)
  const [rotaAlvo, setRotaAlvo] = useState<{ lat: number; lng: number } | null>(null)
  const { eventos, eventosPorLocal } = useEventos()
  const { checkins, resumoPorLocal, meuVotoPorLocal, votar } = useLotacao()
  const [pulsoParaConvidar, setPulsoParaConvidar] = useState<{ id: number; texto: string; lat: number | null; lng: number | null } | null>(null)
  const [localParaEventos, setLocalParaEventos] = useState<{ id: number; nome: string } | null>(null)
  const [localParaEditar, setLocalParaEditar] = useState<{ id: number; nome_local: string; texto: string; lat: number; lng: number; endereco: string | null } | null>(null)
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false)
  const { eventos: eventosGerais, removerEvento, recarregar: recarregarEventosGerais } = useEventosGerais()
  const [mostrarCalor, setMostrarCalor] = useState(false)
  const [pulsoParaDenunciar, setPulsoParaDenunciar] = useState<number | null>(null)
  const [eventoParaDenunciar, setEventoParaDenunciar] = useState<number | null>(null)
  const [perfilPublicoAlvo, setPerfilPublicoAlvo] = useState<string | null>(null)

  // Fluxo de abertura do app: loading -> políticas (se ainda não aceitas) -> anúncio (no máx. 1x por dia)
  const [mostrarLoading, setMostrarLoading] = useState(true)
  const [politicasAceitas, setPoliticasAceitas] = useState(politicasJaAceitas())
  const [mostrarAd, setMostrarAd] = useState(false)

  const CHAVE_ULTIMO_AD = 'onde_ultimo_anuncio_mostrado'
  const UM_DIA_MS = 24 * 60 * 60 * 1000

  const devoMostrarAd = () => {
    const ultimo = localStorage.getItem(CHAVE_ULTIMO_AD)
    if (!ultimo) return true
    return Date.now() - parseInt(ultimo, 10) > UM_DIA_MS
  }

  const marcarAdComoMostrado = () => {
    localStorage.setItem(CHAVE_ULTIMO_AD, String(Date.now()))
  }

  const iniciarApp = () => {
    setMostrarLoading(false)
    if (politicasAceitas && devoMostrarAd()) setMostrarAd(true)
  }

  const aceitarPoliticas = () => {
    setPoliticasAceitas(true)
    if (devoMostrarAd()) setMostrarAd(true)
  }
  const [isAmigosOpen, setIsAmigosOpen] = useState(false)

  const [filterActive, setFilterActive] = useState('TODOS')
  const [abaDrawer, setAbaDrawer] = useState<'atividades' | 'onde_ir' | 'eventos'>('atividades')
  const [termoBusca, setTermoBusca] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [apelidoManual, setApelidoManual] = useState('') // usado só quando postando anônimo
  const [postarAnonimo, setPostarAnonimo] = useState(false)
  const [categoriaEnvio, setCategoriaEnvio] = useState(CATEGORIAS_BASE[0])
  const [carregando, setCarregando] = useState(false)

  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null)
  const [mostrarConfirmacaoPublicacao, setMostrarConfirmacaoPublicacao] = useState(false)
  const [erroGps, setErroGps] = useState<string | null>(null)

  // Modo moderador: só existe de fato se perfil.is_admin === true (ver MenuPanel)
  const [modoModerador, setModoModerador] = useState(false)
  const isAdmin = !!perfil?.is_admin && modoModerador

  const [isCuradoriaFormOpen, setIsCuradoriaFormOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isEmpresaOpen, setIsEmpresaOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [relatos, setRelatos] = useState<any[]>([])
  const [filters, setFilters] = useState(['TODOS', 'AMIGOS', ...CATEGORIAS_BASE])

  const [foco, setFoco] = useState<{ lat: number; lng: number; ts: number } | null>(null)

  const [drawerY, setDrawerY] = useState(0)
  const dragStartY = useRef<number | null>(null)
  const dragStartValue = useRef(0)
  const distanciaPercorrida = useRef(0)

  const ALTURA_MINIMA = 44
  const ALTURA_MAXIMA_VH = 0.55
  const DISTANCIA_ARRASTO_PX = 160

  const iniciarArrasto = (clientY: number) => {
    dragStartY.current = clientY
    dragStartValue.current = drawerY
    distanciaPercorrida.current = 0
  }

  const moverArrasto = (clientY: number) => {
    if (dragStartY.current === null) return
    const delta = dragStartY.current - clientY
    distanciaPercorrida.current = Math.abs(delta)
    const novoValor = dragStartValue.current + delta / DISTANCIA_ARRASTO_PX
    setDrawerY(Math.min(1, Math.max(0, novoValor)))
  }

  const finalizarArrasto = () => {
    if (dragStartY.current === null) return
    dragStartY.current = null

    if (distanciaPercorrida.current < 8) {
      setDrawerY((v) => (v > 0.5 ? 0 : 1))
      return
    }

    setDrawerY((v) => (v > 0.2 ? 1 : 0))
  }

  const onMouseMoveWindow = (e: MouseEvent) => moverArrasto(e.clientY)
  const onMouseUpWindow = () => {
    finalizarArrasto()
    window.removeEventListener('mousemove', onMouseMoveWindow)
    window.removeEventListener('mouseup', onMouseUpWindow)
  }
  const onTouchMoveWindow = (e: TouchEvent) => moverArrasto(e.touches[0].clientY)
  const onTouchEndWindow = () => {
    finalizarArrasto()
    window.removeEventListener('touchmove', onTouchMoveWindow)
    window.removeEventListener('touchend', onTouchEndWindow)
  }

  const iniciarArrastoMouse = (clientY: number) => {
    iniciarArrasto(clientY)
    window.addEventListener('mousemove', onMouseMoveWindow)
    window.addEventListener('mouseup', onMouseUpWindow)
  }

  const iniciarArrastoTouch = (clientY: number) => {
    iniciarArrasto(clientY)
    window.addEventListener('touchmove', onTouchMoveWindow, { passive: false })
    window.addEventListener('touchend', onTouchEndWindow)
  }

  const buscarRelatos = async () => {
    try {
      const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('pulsos')
        .select('*, autor:profiles(avatar_url)')
        .or(`is_fixed.eq.true,created_at.gte.${vinteQuatroHorasAtras}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setRelatos(data)
    } catch (err) {
      console.error('Erro ao buscar relatos:', err)
    }
  }

  useEffect(() => {
    buscarRelatos()
    const intervalo = setInterval(buscarRelatos, 120000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!isFormOpen) return
    setErroGps(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordenadas({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      () => setErroGps('Não conseguimos acessar seu GPS.'),
      { enableHighAccuracy: true }
    )
  }, [isFormOpen])

  // Sem admin logado, "modo moderador" nunca fica ativo por acidente
  useEffect(() => {
    if (!perfil?.is_admin) setModoModerador(false)
  }, [perfil])

  const agoraPosts = relatos
    .filter((r) => r.categoria === 'AGORA' && r.image_url)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  useResumoSemanal(amigosIds, relatos, eventos.length)
  useRegistrarAbertura()

  // Check-in de lotação pesa mais que um post — é presença confirmada, não relato.
  // CHEIO esquenta forte, MODERADO médio, TRANQUILO quase não conta.
  const PESO_POR_STATUS: Record<string, number> = { CHEIO: 1, MODERADO: 0.6, TRANQUILO: 0.15 }
  const pontosCalorLotacao: Array<[number, number, number]> = checkins
    .map((c) => {
      const local = relatos.find((r) => r.id === c.pulso_id)
      if (!local || local.lat === null || local.lng === null) return null
      return [local.lat, local.lng, PESO_POR_STATUS[c.status] ?? 0.3] as [number, number, number]
    })
    .filter((p): p is [number, number, number] => p !== null)

  const relatosFiltrados = relatos.filter((relato) => {
    if (filterActive === 'TODOS') return true
    if (filterActive === 'AMIGOS') return amigosIds.includes(relato.user_id)
    return relato.categoria === filterActive
  })

  const lidarComCliqueFiltro = (category: string) => {
    if (category === 'AMIGOS' && !usuarioLogado) {
      setIsLoginOpen(true)
      return
    }
    setFilterActive(category)
  }

  const locaisFixos = relatosFiltrados.filter((r) => r.is_fixed)
  const atividadesUsuarios = relatosFiltrados.filter((r) => !r.is_fixed)
  const listaAtual = (abaDrawer === 'onde_ir' ? locaisFixos : atividadesUsuarios).filter((r) => {
    if (!termoBusca.trim()) return true
    const termo = termoBusca.trim().toLowerCase()
    return (
      r.nome_local?.toLowerCase().includes(termo) ||
      r.texto?.toLowerCase().includes(termo) ||
      r.apelido?.toLowerCase().includes(termo)
    )
  })

  const deletarRelato = async (id: number) => {
    if (!confirm('Deletar?')) return
    await supabase.from('pulsos').delete().eq('id', id)
    buscarRelatos()
  }

  const irParaNoMapa = (lat: number, lng: number) => {
    setFoco({ lat, lng, ts: Date.now() })
    setDrawerY(0)
  }

  const abrirFormularioNormal = () => {
    if (!usuarioLogado) { setIsLoginOpen(true); return }
    setCategoriaEnvio(CATEGORIAS_BASE[0])
    setIsFormOpen(true)
  }

  const abrirAgora = () => {
    if (!usuarioLogado) { setIsLoginOpen(true); return }
    setIsAgoraOpen(true)
  }

  const lidarComEnvio = (e: React.FormEvent) => {
    e.preventDefault()

    if (!texto.trim() || !coordenadas) {
      alert("Aguarde a localização ou verifique o texto.")
      return
    }

    // Antes de publicar de verdade, mostra onde o pino vai cair — a
    // localização é capturada silenciosamente pelo GPS, então a pessoa
    // nunca tinha visto isso antes de confirmar.
    setMostrarConfirmacaoPublicacao(true)
  }

  const confirmarEPublicar = async () => {
    if (!texto.trim() || !coordenadas) return

    setCarregando(true)

    // Login já é obrigatório pra publicar, então o user_id é sempre gravado
    // (rastreabilidade/segurança) — o toggle "anônimo" só controla o que é
    // exibido publicamente (apelido do perfil ou um apelido digitado na hora).
    const payload = {
      texto: texto,
      apelido: postarAnonimo ? (apelidoManual.trim() || 'ANÔNIMO') : perfil!.apelido,
      user_id: session!.user.id,
      lat: coordenadas.lat,
      lng: coordenadas.lng,
      categoria: categoriaEnvio,
      is_fixed: false,
      anonimo: postarAnonimo
    }

    const { error } = await supabase.from('pulsos').insert([payload])

    if (error) {
      console.error("Erro detalhado do Supabase:", error)
      alert("Erro ao enviar: " + (error.message || "Verifique o console."))
    } else {
      setMostrarConfirmacaoPublicacao(false)
      setIsFormOpen(false)
      setTexto('')
      setApelidoManual('')
      buscarRelatos()
    }

    setCarregando(false)
  }

  const lidarComEnvioCuradoria = async (dados: { lat: number; lng: number; nome: string; categoria: string; descricao: string; endereco: string }) => {
    setCarregando(true)
    const { error } = await supabase.from('pulsos').insert([
      {
        texto: dados.descricao,
        nome_local: dados.nome.toUpperCase(),
        lat: dados.lat,
        lng: dados.lng,
        categoria: dados.categoria,
        endereco: dados.endereco || null,
        is_fixed: true
      }
    ])

    if (!error) {
      alert('Ponto fixado!')
      setIsCuradoriaFormOpen(false)
      buscarRelatos()
    }
    setCarregando(false)
  }

  const alturaDrawer = ALTURA_MINIMA + drawerY * (typeof window !== 'undefined' ? window.innerHeight * ALTURA_MAXIMA_VH - ALTURA_MINIMA : 0)

  return (
    <div className="bg-background fixed inset-0 text-accent font-sans antialiased overflow-hidden flex flex-col justify-between">
      <header
        className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-background via-background/20 to-transparent pointer-events-none"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="w-full flex items-center gap-3 pointer-events-auto px-2">
          <img src={logo} alt="ONDE" className="w-8 h-8 flex-shrink-0" />

          <div className="flex-1 min-w-0 relative">
            <Swiper
              slidesPerView={"auto"}
              spaceBetween={10}
              grabCursor={true}
              className="w-full h-12"
              onSwiper={(swiper) => {
                // Pequeno "empurrãozinho" pra mostrar que dá pra arrastar a
                // lista — roda toda vez que a página carrega/recarrega.
                setTimeout(() => {
                  swiper.slideTo(1, 350)
                  setTimeout(() => swiper.slideTo(0, 350), 550)
                }, 900)
              }}
            >
              {filters.map((category) => {
                const IconeFiltro = ICONE_POR_FILTRO[category]
                return (
                  <SwiperSlide key={category} className="!w-auto flex items-center py-1">
                    <button onClick={() => lidarComCliqueFiltro(category)} className={`flex items-center gap-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest px-5 py-2.5 border ${filterActive === category ? 'bg-accent text-background' : 'bg-background/90 text-accent/60'}`}>
                      {IconeFiltro && <IconeFiltro size={11} />}
                      {category}
                    </button>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>

          <button
            onClick={() => (usuarioLogado ? setIsAmigosOpen(true) : setIsLoginOpen(true))}
            className="flex-shrink-0 text-accent p-2 relative"
          >
            <Users size={20} />
          </button>

          <button
            onClick={() => {
              if (!usuarioLogado) { setIsLoginOpen(true); return }
              setIsNotificacoesOpen(true)
            }}
            className="flex-shrink-0 text-accent p-2 relative"
          >
            <Bell size={20} />
            {totalNaoLidas > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-[3px] bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center leading-none">
                {totalNaoLidas}
              </span>
            )}
          </button>

          <button onClick={() => setIsMenuOpen(true)} className="flex-shrink-0 text-accent p-2 relative">
            <Menu size={22} />
            {perfil?.is_admin && modoModerador && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>
      </header>

      <AgoraStories posts={agoraPosts} onAbrir={(i) => setAgoraViewerIndice(i)} />

      <div className="absolute inset-0 w-full h-full z-0">
        <Map
          dados={relatosFiltrados}
          eventos={eventosGerais}
          foco={foco}
          mostrarCalor={mostrarCalor}
          pontosExtras={pontosCalorLotacao}
          onAbrirRota={(lat, lng) => setRotaAlvo({ lat, lng })}
          onDenunciarPulso={(id) => setPulsoParaDenunciar(id)}
          onDenunciarEvento={(id) => setEventoParaDenunciar(id)}
          onConvidar={(pulso) => setPulsoParaConvidar(pulso)}
        />
      </div>

      <button
        onClick={() => setMostrarCalor((v) => !v)}
        className={`absolute top-32 right-4 z-[999] p-2.5 rounded-full border shadow-lg ${mostrarCalor ? 'bg-red-500 border-red-500 text-white' : 'bg-surface/80 border-borderRaw text-accent/70'}`}
      >
        <Flame size={18} />
      </button>

      <div
        className="fixed bottom-4 left-0 right-0 z-[1000] w-[calc(100%-2rem)] max-w-md mx-auto flex flex-col gap-3 pointer-events-none"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center gap-2 w-full">
          <button
            onClick={abrirFormularioNormal}
            style={{ backgroundColor: '#ff14e1' }}
            className="pointer-events-auto rounded-xl text-white font-mono text-xs font-bold px-6 py-3 shadow-xl active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={3} />
            ONDE É HOJE?
          </button>

          <button
            onClick={abrirAgora}
            style={{ backgroundImage: 'linear-gradient(to bottom right, #ff14e1, #9cff00)' }}
            className="pointer-events-auto rounded-xl text-white font-mono text-xs font-bold px-6 py-3 shadow-xl active:scale-95 flex items-center gap-1.5"
          >
            <Camera size={14} strokeWidth={2.5} />
            AGORA
          </button>

          {isAdmin && (
            <button onClick={() => setIsCuradoriaFormOpen(true)} className="pointer-events-auto rounded-xl bg-accent text-background font-mono text-xs font-bold px-4 py-3 shadow-xl active:scale-95 flex items-center gap-1.5">
              <Plus size={14} strokeWidth={3} />
              NOVO LOCAL
            </button>
          )}
        </div>

        <div
          className={`pointer-events-auto w-full bg-surface/80 backdrop-blur-md border ${isAdmin ? 'border-amber-500/40' : 'border-borderRaw'} shadow-2xl flex flex-col overflow-hidden transition-[height] duration-150 ease-out rounded-t-2xl`}
          style={{ height: `${alturaDrawer}px` }}
        >
          <div
            className="w-full h-11 px-4 flex items-center justify-between border-b border-borderRaw/10 flex-shrink-0 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onMouseDown={(e) => iniciarArrastoMouse(e.clientY)}
            onTouchStart={(e) => iniciarArrastoTouch(e.touches[0].clientY)}
          >
            <span className="text-[9px] font-mono tracking-widest text-accent/50 uppercase font-bold">
              {isAdmin ? 'MODO MODERADOR' : `${listaAtual.length} ${abaDrawer === 'onde_ir' ? 'LOCAIS' : 'ATIVIDADES'}`}
            </span>
            <div className="w-8 h-1 bg-accent/20 rounded-full" />
          </div>

          <div className="w-full flex border-b border-borderRaw/10 flex-shrink-0">
            <button
              onClick={() => setAbaDrawer('atividades')}
              className={`flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 ${abaDrawer === 'atividades' ? 'bg-accent text-background' : 'text-accent/50'}`}
            >
              Atividades
            </button>
            <button
              onClick={() => setAbaDrawer('onde_ir')}
              className={`flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 ${abaDrawer === 'onde_ir' ? 'bg-accent text-background' : 'text-accent/50'}`}
            >
              Onde Ir
            </button>
            <button
              onClick={() => setAbaDrawer('eventos')}
              className={`flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 ${abaDrawer === 'eventos' ? 'bg-accent text-background' : 'text-accent/50'}`}
            >
              Eventos
            </button>
          </div>

          {abaDrawer !== 'eventos' && (
            <div className="px-4 py-2 border-b border-borderRaw/10 flex-shrink-0 relative">
              <Search size={13} className="absolute left-7 top-1/2 -translate-y-1/2 text-accent/30" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder={abaDrawer === 'onde_ir' ? 'Buscar local...' : 'Buscar atividade...'}
                className="w-full bg-background/60 border border-borderRaw rounded-lg py-1.5 pl-7 pr-2 text-[10px] font-mono"
              />
            </div>
          )}

          <div className="p-4 space-y-5 flex-1 overflow-y-auto">
            {abaDrawer !== 'eventos' && listaAtual.length === 0 && (
              <p className="text-[10px] text-accent/30 text-center pt-4">
                {termoBusca.trim()
                  ? 'Nenhum resultado encontrado.'
                  : abaDrawer === 'onde_ir' ? 'Nenhum local fixado ainda.' : 'Nenhuma atividade recente.'}
              </p>
            )}

            {abaDrawer === 'onde_ir' && listaAtual.map((relato) => (
              <div key={relato.id} className="rounded-xl border border-borderRaw/20 bg-background/40 p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-accent/40 uppercase tracking-widest">{relato.categoria}</span>
                    {relato.user_id ? (
                      <h2
                        className="text-xs font-mono font-bold cursor-pointer hover:underline w-fit"
                        onClick={() => setPerfilPublicoAlvo(relato.user_id)}
                      >
                        {relato.nome_local}
                      </h2>
                    ) : (
                      <h2 className="text-xs font-mono font-bold">{relato.nome_local}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setPulsoParaDenunciar(relato.id)} className="text-accent/40 hover:text-red-400">
                      <Flag size={13} />
                    </button>
                    <button onClick={() => irParaNoMapa(relato.lat, relato.lng)} className="text-accent/50 hover:text-accent">
                      <MapPin size={14} />
                    </button>
                    <button onClick={() => setRotaAlvo({ lat: relato.lat, lng: relato.lng })} className="text-accent/50 hover:text-accent">
                      <Navigation size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-accent/70">"{relato.texto}"</p>

                {(() => {
                  const resumo = resumoPorLocal(relato.id)
                  const meuVoto = meuVotoPorLocal(relato.id)
                  const corPorStatus: Record<string, string> = {
                    CHEIO: 'text-red-400 border-red-400/40',
                    MODERADO: 'text-amber-400 border-amber-400/40',
                    TRANQUILO: 'text-green-400 border-green-400/40'
                  }
                  return (
                    <div className="mt-1.5 space-y-1.5">
                      {resumo ? (
                        <span className={`inline-block text-[9px] font-mono uppercase tracking-widest border rounded px-1.5 py-0.5 ${corPorStatus[resumo.status]}`}>
                          {resumo.status} · {resumo.totalVotos} check-in{resumo.totalVotos > 1 ? 's' : ''} · {formatarTempoRelativo(resumo.atualizadoEm)}
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-mono text-accent/30 uppercase tracking-widest">
                          Sem informação de lotação recente
                        </span>
                      )}

                      <div className="flex gap-1.5">
                        {(['TRANQUILO', 'MODERADO', 'CHEIO'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => usuarioLogado ? votar(relato.id, status) : setIsLoginOpen(true)}
                            className={`flex-1 text-[8px] font-mono uppercase py-1 rounded border ${meuVoto === status ? corPorStatus[status] : 'border-borderRaw/40 text-accent/40'}`}
                          >
                            {status === 'TRANQUILO' ? 'Tranquilo' : status === 'MODERADO' ? 'Moderado' : 'Cheio'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {eventosPorLocal(relato.id).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-1.5 text-[9px] text-accent/50 mt-1">
                    <Calendar size={11} />
                    <span><strong>{ev.titulo}</strong> — {ev.recorrencia}{ev.horario ? ` · ${ev.horario}` : ''}</span>
                  </div>
                ))}

                {(isAdmin || perfil?.id === relato.user_id) && (
                  <button
                    onClick={() => setLocalParaEventos({ id: relato.id, nome: relato.nome_local })}
                    className="text-[9px] font-mono text-accent/40 hover:text-accent flex items-center gap-1 mt-1"
                  >
                    <Calendar size={11} /> Gerenciar eventos
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setLocalParaEditar({ id: relato.id, nome_local: relato.nome_local, texto: relato.texto, lat: relato.lat, lng: relato.lng, endereco: relato.endereco })}
                    className="text-[9px] font-mono text-accent/40 hover:text-accent flex items-center gap-1 mt-1"
                  >
                    <Pencil size={11} /> Editar local
                  </button>
                )}

                {isAdmin && <button onClick={() => deletarRelato(relato.id)} className="text-[9px] text-red-500">[DELETAR]</button>}
              </div>
            ))}

            {abaDrawer === 'atividades' && listaAtual.map((relato) => (
              <div key={relato.id} className="border-b border-borderRaw/10 pb-4">
                <div className="flex items-start justify-between gap-2">
                  {!relato.anonimo && relato.user_id ? (
                    <h2
                      className="text-xs font-mono cursor-pointer hover:underline"
                      onClick={() => setPerfilPublicoAlvo(relato.user_id)}
                    >
                      {relato.apelido || '@ANÔNIMO'}
                    </h2>
                  ) : (
                    <h2 className="text-xs font-mono">{relato.apelido || '@ANÔNIMO'}</h2>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setPulsoParaDenunciar(relato.id)} className="text-accent/40 hover:text-red-400">
                      <Flag size={13} />
                    </button>
                    {relato.lat !== null && relato.lng !== null && (
                      <>
                        <button onClick={() => irParaNoMapa(relato.lat, relato.lng)} className="text-accent/50 hover:text-accent">
                          <MapPin size={14} />
                        </button>
                        <button onClick={() => setRotaAlvo({ lat: relato.lat, lng: relato.lng })} className="text-accent/50 hover:text-accent">
                          <Navigation size={13} />
                        </button>
                      </>
                    )}
                    {usuarioLogado && (
                      <button
                        onClick={() => setPulsoParaConvidar({ id: relato.id, texto: relato.texto, lat: relato.lat, lng: relato.lng })}
                        className="text-accent/50 hover:text-accent"
                        title="Convidar amigo pra esse rolê"
                      >
                        <Send size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {relato.categoria === 'AGORA' && relato.image_url && (
                  <img src={relato.image_url} alt="" className="w-full max-h-48 object-cover rounded-lg my-2" />
                )}
                <p className="text-xs text-accent/80">"{relato.texto}"</p>
                <span className="text-[9px] text-accent/40 italic">{formatarTempoRelativo(relato.created_at)}</span>
                {isAdmin && <button onClick={() => deletarRelato(relato.id)} className="text-[9px] text-red-500 ml-2">[DELETAR]</button>}
              </div>
            ))}

            {abaDrawer === 'eventos' && (
              <>
                <button
                  onClick={() => (usuarioLogado ? setIsEventoModalOpen(true) : setIsLoginOpen(true))}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold"
                >
                  <Plus size={14} /> Criar evento
                </button>

                {eventosGerais.length === 0 && (
                  <p className="text-[10px] text-accent/30 text-center pt-4">Nenhum evento marcado ainda. Seja o primeiro a divulgar um!</p>
                )}

                {eventosGerais.map((evento) => (
                  <div key={evento.id} className="rounded-xl border border-borderRaw/20 bg-background/40 p-3 space-y-1.5">
                    {evento.image_url && (
                      <img src={evento.image_url} alt="" className="w-full max-h-40 object-cover rounded-lg" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[8px] font-mono text-accent/40 uppercase tracking-widest">{evento.categoria}</span>
                        <h2 className="text-xs font-mono font-bold">{evento.titulo}</h2>
                        <span className="text-[10px] text-accent/60">
                          {new Date(evento.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setEventoParaDenunciar(evento.id)} className="text-accent/40 hover:text-red-400">
                          <Flag size={13} />
                        </button>
                        <button onClick={() => irParaNoMapa(evento.lat, evento.lng)} className="text-accent/50 hover:text-accent">
                          <MapPin size={14} />
                        </button>
                        <button onClick={() => setRotaAlvo({ lat: evento.lat, lng: evento.lng })} className="text-accent/50 hover:text-accent">
                          <Navigation size={13} />
                        </button>
                        {(isAdmin || perfil?.id === evento.user_id) && (
                          <button onClick={() => removerEvento(evento.id)} className="text-accent/40 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {evento.descricao && <p className="text-xs text-accent/70">{evento.descricao}</p>}
                    {evento.link_ingresso && (
                      <a href={evento.link_ingresso} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] font-mono uppercase text-background bg-accent rounded-lg px-3 py-1.5 mt-1">
                        Comprar ingresso
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {isEventoModalOpen && (
        <EventoModal
          onClose={() => setIsEventoModalOpen(false)}
          onPublicado={() => { setIsEventoModalOpen(false); recarregarEventosGerais() }}
        />
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <form onSubmit={lidarComEnvio} className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
              <span className="text-[10px] font-mono tracking-widest text-red-400">E, AÍ! ONDE É HOJE?</span>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-accent/40 hover:text-accent"><X size={16} /></button>
            </div>
            {erroGps && <div className="text-[9px] text-red-400">{erroGps}</div>}

            <label className="flex items-center gap-2 text-[10px] font-mono text-accent/70">
              <input type="checkbox" checked={postarAnonimo} onChange={(e) => setPostarAnonimo(e.target.checked)} />
              Postar anônimo (em vez de @{perfil?.apelido})
            </label>

            {postarAnonimo && (
              <input type="text" value={apelidoManual} onChange={(e) => setApelidoManual(e.target.value)} placeholder="Apelido para esse post (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            )}

            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que está rolando bem aqui, agora?" className="w-full h-24 bg-background border border-borderRaw rounded-lg p-3 text-sm" />

            <select value={categoriaEnvio} onChange={(e) => setCategoriaEnvio(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>

            <button type="submit" disabled={carregando} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg">
              {carregando ? 'ENVIANDO...' : 'ENVIAR'}
            </button>
          </form>
        </div>
      )}

      {isCuradoriaFormOpen && (
        <CadastroLocalModerador
          onClose={() => setIsCuradoriaFormOpen(false)}
          onConcluir={lidarComEnvioCuradoria}
        />
      )}

      {isMenuOpen && (
        <MenuPanel
          onClose={() => setIsMenuOpen(false)}
          onAbrirLogin={() => { setIsMenuOpen(false); setIsLoginOpen(true) }}
          onAbrirEmpresa={() => { setIsMenuOpen(false); setIsEmpresaOpen(true) }}
          onAbrirAnuncios={() => { setIsMenuOpen(false); setIsAnunciosManagerOpen(true) }}
          onAbrirModeradores={() => { setIsMenuOpen(false); setIsModeradoresOpen(true) }}
          onAbrirDenuncias={() => { setIsMenuOpen(false); setIsDenunciasOpen(true) }}
          onAbrirPerfil={() => { setIsMenuOpen(false); setIsPerfilOpen(true) }}
          onAbrirEstatisticas={() => { setIsMenuOpen(false); setIsEstatisticasOpen(true) }}
          modoModerador={modoModerador}
          onToggleModerador={() => setModoModerador((v) => !v)}
        />
      )}

      {isLoginOpen && (
        <LoginScreen onClose={() => setIsLoginOpen(false)} />
      )}

      {isEmpresaOpen && (
        <EmpresaScreen onClose={() => setIsEmpresaOpen(false)} />
      )}

      {isAmigosOpen && (
        <AmigosPanel onClose={() => setIsAmigosOpen(false)} />
      )}

      {isNotificacoesOpen && (
        <NotificationsPanel
          onClose={() => setIsNotificacoesOpen(false)}
          onIrParaNoMapa={(lat, lng) => { irParaNoMapa(lat, lng); setIsNotificacoesOpen(false) }}
        />
      )}

      {mostrarLoading && <LoadingScreen onIniciar={iniciarApp} />}

      {!mostrarLoading && !politicasAceitas && (
        <PoliticasModal onAceitar={aceitarPoliticas} />
      )}

      {!mostrarLoading && politicasAceitas && mostrarAd && (
        <AdBanner onClose={() => setMostrarAd(false)} onAdMostrado={marcarAdComoMostrado} />
      )}

      {emRecuperacaoSenha && <NovaSenhaScreen />}

      {isAnunciosManagerOpen && (
        <AnunciosManager onClose={() => setIsAnunciosManagerOpen(false)} />
      )}

      {isModeradoresOpen && (
        <ModeradoresManager onClose={() => setIsModeradoresOpen(false)} />
      )}

      {pulsoParaDenunciar !== null && (
        <DenunciaModal pulsoId={pulsoParaDenunciar} onClose={() => setPulsoParaDenunciar(null)} />
      )}

      {eventoParaDenunciar !== null && (
        <DenunciaModal eventoId={eventoParaDenunciar} onClose={() => setEventoParaDenunciar(null)} />
      )}

      {isDenunciasOpen && (
        <DenunciasManager onClose={() => setIsDenunciasOpen(false)} />
      )}

      {isPerfilOpen && (
        <PerfilScreen onClose={() => setIsPerfilOpen(false)} />
      )}

      {isEstatisticasOpen && (
        <EstatisticasPanel onClose={() => setIsEstatisticasOpen(false)} />
      )}

      {isAgoraOpen && (
        <AgoraModal
          onClose={() => setIsAgoraOpen(false)}
          onPublicado={() => { setIsAgoraOpen(false); buscarRelatos() }}
        />
      )}

      {agoraViewerIndice !== null && (
        <AgoraViewer
          posts={agoraPosts}
          indiceInicial={agoraViewerIndice}
          onClose={() => setAgoraViewerIndice(null)}
          onIrParaNoMapa={(lat, lng) => { irParaNoMapa(lat, lng); setAgoraViewerIndice(null) }}
        />
      )}

      {rotaAlvo && (
        <RotaMenu lat={rotaAlvo.lat} lng={rotaAlvo.lng} onClose={() => setRotaAlvo(null)} />
      )}

      {pulsoParaConvidar && (
        <ConvidarAmigoModal pulso={pulsoParaConvidar} onClose={() => setPulsoParaConvidar(null)} />
      )}

      {localParaEventos && (
        <EventosManager
          pulsoId={localParaEventos.id}
          nomeLocal={localParaEventos.nome}
          onClose={() => setLocalParaEventos(null)}
        />
      )}

      <InstallPrompt />

      {perfilPublicoAlvo && (
        <PerfilPublicoModal userId={perfilPublicoAlvo} onClose={() => setPerfilPublicoAlvo(null)} />
      )}

      {localParaEditar && (
        <EditarLocalModal
          local={localParaEditar}
          onClose={() => setLocalParaEditar(null)}
          onSalvo={() => { setLocalParaEditar(null); buscarRelatos() }}
        />
      )}

      {mostrarConfirmacaoPublicacao && coordenadas && (
        <ConfirmarLocalizacaoModal
          lat={coordenadas.lat}
          lng={coordenadas.lng}
          onChange={(lat, lng) => setCoordenadas({ lat, lng })}
          textoResumo={texto}
          onConfirmar={confirmarEPublicar}
          onVoltar={() => setMostrarConfirmacaoPublicacao(false)}
          publicando={carregando}
        />
      )}
    </div>
  )
}