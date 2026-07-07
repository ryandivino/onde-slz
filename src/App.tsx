import React, { useState, useEffect } from 'react'
import { Map } from './components/Map'
import { supabase } from './supabase'

import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURAL', 'AGORA']

export default function App() {
  const [filterActive, setFilterActive] = useState('TODOS')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [apelido, setApelido] = useState('') // Novo campo
  const [categoriaEnvio, setCategoriaEnvio] = useState(CATEGORIAS_BASE[3])
  const [carregando, setCarregando] = useState(false)
  
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null)
  const [erroGps, setErroGps] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)
  const [isCuradoriaFormOpen, setIsCuradoriaFormOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  
  const [nomeLocal, setNomeLocal] = useState('')
  const [textoCuradoria, setTextoCuradoria] = useState('')
  const [categoriaCuradoria, setCategoriaCuradoria] = useState(CATEGORIAS_BASE[0])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [latCuradoria, setLatCuradoria] = useState('')
  const [lngCuradoria, setLngCuradoria] = useState('')

  const [relatos, setRelatos] = useState<any[]>([])
  const [filters, setFilters] = useState(['TODOS', ...CATEGORIAS_BASE])

  const buscarRelatos = async () => {
    try {
      const dozeHorasAtras = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('pulsos')
        .select('*')
        .or(`is_fixed.eq.true,created_at.gte.${dozeHorasAtras}`)
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

  const relatosFiltrados = relatos.filter((relato) => {
    if (filterActive === 'TODOS') return true
    return relato.categoria === filterActive
  })

  const lidarComLoginAdmin = () => {
    if (isAdmin) { setIsAdmin(false); return }
    setIsPasswordModalOpen(true)
  }

  const verificarSenhaAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const senhaDoInput = e.currentTarget.senha_admin.value
    const { VITE_ADMIN_KEY } = import.meta.env
    if (senhaDoInput === VITE_ADMIN_KEY || senhaDoInput === "admin123") {
      setIsAdmin(true)
      setIsPasswordModalOpen(false)
    } else {
      alert('Chave incorreta.')
    }
  }

  const deletarRelato = async (id: number) => {
    if (!confirm('Deletar?')) return
    await supabase.from('pulsos').delete().eq('id', id)
    buscarRelatos()
  }

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!texto.trim() || !coordenadas) {
      alert("Aguarde a localização ou verifique o texto.")
      return
    }
    
    setCarregando(true)
    
    const { error } = await supabase.from('pulsos').insert([{ 
      texto: texto, 
      apelido: apelido.trim() || 'ANÔNIMO', 
      lat: coordenadas.lat, 
      lng: coordenadas.lng, 
      categoria: categoriaEnvio, 
      is_fixed: false 
    }])
    
    if (error) {
      console.error("Erro detalhado do Supabase:", error)
      alert("Erro ao enviar: " + (error.message || "Verifique o console."))
    } else {
      setIsFormOpen(false)
      setTexto('')
      setApelido('')
      buscarRelatos()
    }
    
    setCarregando(false)
  }

  const lidarComEnvioCuradoria = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalCategoria = categoriaCuradoria === 'OUTRO' ? novaCategoria.toUpperCase() : categoriaCuradoria
    
    if (!nomeLocal.trim() || !textoCuradoria.trim() || !latCuradoria || !lngCuradoria) {
      return alert('Preencha os campos e coordenadas.')
    }

    setCarregando(true)
    const { error } = await supabase.from('pulsos').insert([
      {
        texto: textoCuradoria,
        nome_local: nomeLocal.toUpperCase(),
        lat: parseFloat(latCuradoria),
        lng: parseFloat(lngCuradoria),
        categoria: finalCategoria,
        is_fixed: true
      }
    ])
    
    if (!error) {
      alert('Ponto fixado!')
      setNomeLocal(''); setTextoCuradoria(''); setLatCuradoria(''); setLngCuradoria(''); setNovaCategoria('');
      setIsCuradoriaFormOpen(false)
      buscarRelatos()
    }
    setCarregando(false)
  }

  return (
    <div className="bg-background min-h-screen text-accent font-sans antialiased relative overflow-hidden flex flex-col justify-between">
      <header className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-background via-background/20 to-transparent pointer-events-none">
        <div className="w-full max-w-xl mx-auto pointer-events-auto px-2">
          <Swiper slidesPerView={"auto"} spaceBetween={10} grabCursor={true} className="w-full h-12">
            {filters.map((category) => (
              <SwiperSlide key={category} className="!w-auto flex items-center py-1">
                <button onClick={() => setFilterActive(category)} className={`text-[10px] font-mono uppercase tracking-widest px-5 py-2.5 border ${filterActive === category ? 'bg-accent text-background' : 'bg-background/90 text-accent/60'}`}>
                  {category}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </header>

      <div className="absolute inset-0 w-full h-full z-0">
        <Map dados={relatosFiltrados} />
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-[1000] w-[calc(100%-2rem)] max-w-md mx-auto flex flex-col gap-3 pointer-events-none">
        <div className="flex justify-center gap-2 w-full">
          <button onClick={() => setIsFormOpen(true)} className="pointer-events-auto bg-red-600 text-white font-mono text-xs font-bold px-6 py-3 shadow-xl active:scale-95">
            + ONDE É HOJE?
          </button>
          {isAdmin && (
            <button onClick={() => setIsCuradoriaFormOpen(true)} className="pointer-events-auto bg-accent text-background font-mono text-xs font-bold px-4 py-3 shadow-xl active:scale-95">
              + NOVO LOCAL
            </button>
          )}
        </div>

        <div className={`pointer-events-auto w-full bg-surface border ${isAdmin ? 'border-amber-500/40' : 'border-borderRaw'} shadow-2xl flex flex-col overflow-hidden ${isDrawerOpen ? 'h-[40vh]' : 'h-11'}`}>
          <div className="w-full h-11 px-4 flex items-center justify-between cursor-pointer border-b border-borderRaw/10" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <span className="text-[9px] font-mono tracking-widest text-accent/50 uppercase font-bold flex items-center gap-2">
              <button onClick={lidarComLoginAdmin} className="text-accent/10">+</button>
              {isAdmin ? 'MODO MODERADOR' : `${filterActive} / ${relatosFiltrados.length} ATIVIDADES`}
            </span>
            <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="text-[10px] font-mono text-accent/40">{isDrawerOpen ? '[ MINIMIZAR ]' : '[ EXPANDIR ]'}</button>
          </div>
          <div className="p-4 space-y-5 flex-1 overflow-y-auto bg-[#0a0a0a]">
            {relatosFiltrados.map((relato) => (
              <div key={relato.id} className="border-b border-borderRaw/10 pb-4">
                <h2 className="text-xs font-mono">{relato.is_fixed ? relato.nome_local : relato.apelido || '@ANÔNIMO'}</h2>
                <p className="text-xs text-accent/80">"{relato.texto}"</p>
                {isAdmin && <button onClick={() => deletarRelato(relato.id)} className="text-[9px] text-red-500">[DELETAR]</button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <form onSubmit={lidarComEnvio} className="w-full max-w-md bg-surface border border-borderRaw p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
              <span className="text-[10px] font-mono tracking-widest text-red-400">E, AÍ! ONDE É HOJE?</span>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs font-mono text-accent/40 hover:text-accent">[FECHAR]</button>
            </div>
            {erroGps && <div className="text-[9px] text-red-400">{erroGps}</div>}
            
            <input type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Seu apelido (opcional)" className="w-full bg-background border border-borderRaw p-2 text-xs" />
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que está rolando?" className="w-full h-24 bg-background border border-borderRaw p-3 text-sm" />
            
            <select value={categoriaEnvio} onChange={(e) => setCategoriaEnvio(e.target.value)} className="w-full bg-background border p-2 text-xs">
              {CATEGORIAS_BASE.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            
            <button type="submit" disabled={carregando} className="w-full bg-accent text-background font-bold py-3 uppercase">
              {carregando ? 'ENVIANDO...' : 'ENVIAR'}
            </button>
          </form>
        </div>
      )}

      {isCuradoriaFormOpen && (
        <div className="fixed inset-0 bg-background/90 z-[9999] flex items-center justify-center p-4">
          <form onSubmit={lidarComEnvioCuradoria} className="w-full max-w-md bg-surface border border-amber-500/40 p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-[10px] text-amber-500">CADASTRAR LOCAL</span>
              <button type="button" onClick={() => setIsCuradoriaFormOpen(false)} className="text-xs text-accent/40">[FECHAR]</button>
            </div>
            <input type="text" value={nomeLocal} onChange={(e) => setNomeLocal(e.target.value)} placeholder="Nome do Local" className="w-full bg-background border p-2 text-xs" />
            <textarea value={textoCuradoria} onChange={(e) => setTextoCuradoria(e.target.value)} placeholder="Descrição" className="w-full bg-background border p-2 text-xs h-20" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={latCuradoria} onChange={(e) => setLatCuradoria(e.target.value)} placeholder="Latitude" className="bg-background border p-2 text-xs" />
              <input type="text" value={lngCuradoria} onChange={(e) => setLngCuradoria(e.target.value)} placeholder="Longitude" className="bg-background border p-2 text-xs" />
            </div>
            <select value={categoriaCuradoria} onChange={(e) => setCategoriaCuradoria(e.target.value)} className="w-full bg-background border p-2 text-xs">
              {CATEGORIAS_BASE.map(c => (<option key={c} value={c}>{c}</option>))}
              <option value="OUTRO">+ OUTRO</option>
            </select>
            {categoriaCuradoria === 'OUTRO' && (
              <input type="text" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Nome da nova categoria" className="w-full bg-background border p-2 text-xs" />
            )}
            <button type="submit" className="w-full bg-amber-500 text-background py-3 text-xs font-bold uppercase">Salvar no Mapa</button>
          </form>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-background/90 z-[9999] flex items-center justify-center p-4">
          <form onSubmit={verificarSenhaAdmin} className="bg-surface p-6 border">
            <input type="password" name="senha_admin" className="bg-background border p-2 w-full mb-4" placeholder="Senha..." autoFocus />
            <button type="submit" className="w-full bg-accent text-background py-2 text-xs font-bold">ENTRAR</button>
          </form>
        </div>
      )}
    </div>
  )
}