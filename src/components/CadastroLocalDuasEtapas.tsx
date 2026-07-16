import React, { useState } from 'react'
import { Link2, Check, ArrowRight } from 'lucide-react'
import { supabase } from '../supabase'
import { extrairCoordenadasDoLink, extrairNomeDoLink, ehLinkCurto } from '../utils/linkMapa'

export function CadastroLocalDuasEtapas({
  textoBotaoFinal = 'Finalizar',
  onConcluir
}: {
  textoBotaoFinal?: string
  onConcluir: (dados: { lat: number; lng: number; nome: string; descricao: string }) => void
}) {
  const [etapa, setEtapa] = useState<'localizacao' | 'detalhes'>('localizacao')

  // Etapa 1
  const [linkColado, setLinkColado] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  // Etapa 2
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')

  const processarLink = async () => {
    if (!linkColado.trim()) return
    setErro(null)
    setProcessando(true)

    try {
      let coordenadas = extrairCoordenadasDoLink(linkColado)
      let urlParaExtrairNome = linkColado

      if (!coordenadas && ehLinkCurto(linkColado)) {
        const { data, error } = await supabase.functions.invoke('resolver-link-mapa', { body: { url: linkColado } })
        console.log('[ONDE] Resposta da Edge Function:', { data, error })

        if (error || !data?.finalUrl) throw new Error()
        coordenadas = extrairCoordenadasDoLink(data.finalUrl)
        urlParaExtrairNome = data.finalUrl
        console.log('[ONDE] URL final resolvida:', data.finalUrl)
        console.log('[ONDE] Coordenadas extraídas dessa URL:', coordenadas)
      }

      if (!coordenadas) {
        setErro('Não consegui encontrar a localização nesse link. Confere se é um link de um lugar específico do Google Maps ou Apple Maps.')
        setProcessando(false)
        return
      }

      setLat(coordenadas.lat)
      setLng(coordenadas.lng)

      const nomeEncontrado = extrairNomeDoLink(urlParaExtrairNome)
      setNome(nomeEncontrado || '')
    } catch (erroCapturado) {
      console.log('[ONDE] Erro ao processar o link:', erroCapturado)
      setErro('Não consegui ler esse link. Confere se copiou certinho.')
    }

    setProcessando(false)
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
        <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
          Etapa 1 de 2 — Localização
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={linkColado}
            onChange={(e) => setLinkColado(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); processarLink() } }}
            placeholder="Colar link do Google Maps ou Apple Maps"
            className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
          <button
            type="button"
            onClick={processarLink}
            disabled={processando}
            className="bg-accent text-background rounded-lg px-3 flex-shrink-0"
          >
            <Link2 size={14} />
          </button>
        </div>

        {erro && <p className="text-[10px] text-red-400">{erro}</p>}

        {lat !== null && lng !== null && (
          <div className="space-y-2">
            <p className="text-[11px] text-green-400 flex items-center gap-1.5">
              <Check size={13} /> Localização encontrada{nome ? ` — ${nome}` : ''}
            </p>
            <button
              type="button"
              onClick={avancarParaDetalhes}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold"
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