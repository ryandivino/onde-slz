import React, { useState } from 'react'
import { Link2, Search, Check, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'
import { extrairCoordenadasDoLink, extrairNomeDoLink, extrairNomeEEnderecoDoLink, ehLinkCurto } from '../utils/linkMapa'

type ResultadoBusca = { display_name: string; lat: string; lon: string }

export function CadastroLocalDuasEtapas({
  textoBotaoFinal = 'Finalizar',
  onConcluir
}: {
  textoBotaoFinal?: string
  onConcluir: (dados: { lat: number; lng: number; nome: string; descricao: string }) => void
}) {
  const [etapa, setEtapa] = useState<'localizacao' | 'detalhes'>('localizacao')

  // Etapa 1 — link
  const [linkColado, setLinkColado] = useState('')
  const [processandoLink, setProcessandoLink] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)

  // Etapa 1 — busca de endereço (alternativa ao link)
  const [termoBusca, setTermoBusca] = useState('')
  const [buscandoEndereco, setBuscandoEndereco] = useState(false)
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  // Resultado (de qualquer uma das duas vias)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  // Etapa 2
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')

  const definirLocalizacao = (novoLat: number, novoLng: number, nomeEncontrado?: string | null) => {
    setLat(novoLat)
    setLng(novoLng)
    if (nomeEncontrado) setNome(nomeEncontrado)
    setErroLink(null)
    setErroBusca(null)
  }

  const processarLink = async () => {
    if (!linkColado.trim()) return
    setErroLink(null)
    setProcessandoLink(true)

    try {
      let coordenadas = extrairCoordenadasDoLink(linkColado)
      let urlParaExtrairNome = linkColado
      let nomeDoTexto: string | null = null

      if (!coordenadas && ehLinkCurto(linkColado)) {
        const { data, error } = await supabase.functions.invoke('resolver-link-mapa', { body: { url: linkColado } })
        if (error || !data?.finalUrl) throw new Error()
        coordenadas = extrairCoordenadasDoLink(data.finalUrl)
        urlParaExtrairNome = data.finalUrl
      }

      // Fallback: o link virou uma busca por texto (nome + rua/número), sem
      // coordenada direta — geocodificamos esse texto via Nominatim (gratuito).
      if (!coordenadas) {
        const infoTexto = extrairNomeEEnderecoDoLink(urlParaExtrairNome)
        if (infoTexto) {
          nomeDoTexto = infoTexto.nome
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(infoTexto.enderecoPrincipal)}&countrycodes=br&limit=1`
          const resp = await fetch(url)
          const dados = await resp.json()
          if (dados.length > 0) {
            coordenadas = { lat: parseFloat(dados[0].lat), lng: parseFloat(dados[0].lon) }
          }
        }
      }

      if (!coordenadas) {
        setErroLink('Não consegui encontrar a localização nesse link. Tenta buscar pelo endereço ali embaixo.')
        setProcessandoLink(false)
        return
      }

      const nomeEncontrado = extrairNomeDoLink(urlParaExtrairNome) || nomeDoTexto
      definirLocalizacao(coordenadas.lat, coordenadas.lng, nomeEncontrado)
    } catch {
      setErroLink('Não consegui ler esse link. Tenta buscar pelo endereço ali embaixo.')
    }

    setProcessandoLink(false)
  }

  const buscarEndereco = async () => {
    if (!termoBusca.trim()) return
    setErroBusca(null)
    setBuscandoEndereco(true)
    setResultados([])

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termoBusca)}&countrycodes=br&limit=5`
      const resp = await fetch(url)
      const dados: ResultadoBusca[] = await resp.json()

      if (dados.length === 0) {
        setErroBusca('Nenhum endereço encontrado. Tenta colar um link do Maps ali em cima.')
      } else {
        setResultados(dados)
      }
    } catch {
      setErroBusca('Não foi possível buscar agora. Tenta colar um link do Maps ali em cima.')
    }

    setBuscandoEndereco(false)
  }

  const escolherResultado = (resultado: ResultadoBusca) => {
    definirLocalizacao(parseFloat(resultado.lat), parseFloat(resultado.lon))
    setResultados([])
    setTermoBusca(resultado.display_name)
  }

  const avancarParaDetalhes = () => setEtapa('detalhes')
  const voltarParaLocalizacao = () => setEtapa('localizacao')

  const finalizar = () => {
    if (!nome.trim() || lat === null || lng === null) return
    onConcluir({ lat, lng, nome: nome.trim(), descricao: descricao.trim() })
  }

  if (etapa === 'localizacao') {
    return (
      <div className="space-y-3">
        <div>
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block mb-1">
            Etapa 1 de 2 — Localização
          </span>
          <p className="text-[10px] text-accent/50">
            Use <strong>uma das duas opções</strong> abaixo — não precisa das duas.
          </p>
        </div>

        {/* Opção 1: link */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-accent/40">OPÇÃO 1 — Colar link</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={linkColado}
              onChange={(e) => setLinkColado(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); processarLink() } }}
              placeholder="Link do Google Maps ou Apple Maps"
              className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <button
              type="button"
              onClick={processarLink}
              disabled={processandoLink || !linkColado.trim()}
              className="flex items-center gap-1.5 bg-accent text-background rounded-lg px-3 text-[10px] font-mono font-bold flex-shrink-0 disabled:opacity-40 active:scale-95"
            >
              {processandoLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              {processandoLink ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {erroLink && <p className="text-[9px] text-red-400">{erroLink}</p>}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-borderRaw" />
          <span className="text-[9px] font-mono text-accent/30">OU</span>
          <div className="flex-1 h-px bg-borderRaw" />
        </div>

        {/* Opção 2: busca de endereço */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-accent/40">OPÇÃO 2 — Buscar endereço</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarEndereco() } }}
              placeholder="Rua, número, bairro"
              className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <button
              type="button"
              onClick={buscarEndereco}
              disabled={buscandoEndereco || !termoBusca.trim()}
              className="flex items-center gap-1.5 bg-accent text-background rounded-lg px-3 text-[10px] font-mono font-bold flex-shrink-0 disabled:opacity-40 active:scale-95"
            >
              {buscandoEndereco ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {buscandoEndereco ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {erroBusca && <p className="text-[9px] text-red-400">{erroBusca}</p>}

          {resultados.length > 0 && (
            <div className="space-y-1 border border-borderRaw rounded-lg overflow-hidden">
              {resultados.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => escolherResultado(r)}
                  className="w-full text-left text-[10px] font-mono px-2 py-2 text-accent/70 hover:bg-background/60 border-b border-borderRaw/20 last:border-b-0"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {lat !== null && lng !== null && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-green-400 flex items-center gap-1.5">
              <Check size={13} /> Localização encontrada{nome ? ` — ${nome}` : ''}
            </p>
            <button
              type="button"
              onClick={avancarParaDetalhes}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold active:scale-95"
            >
              Continuar <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
        Etapa 2 de 2 — Detalhes
      </span>

      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do local"
        className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
      />

      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)"
        className="w-full h-20 bg-background border border-borderRaw rounded-lg p-2 text-xs"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={voltarParaLocalizacao}
          className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={finalizar}
          disabled={!nome.trim()}
          className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold disabled:opacity-40"
        >
          {textoBotaoFinal}
        </button>
      </div>
    </div>
  )
}