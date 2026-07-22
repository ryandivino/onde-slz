import React, { useState } from 'react'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'
import { geocodificarEndereco } from '../utils/geocodificarEndereco'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

type Etapa = 'dados' | 'endereco' | 'mapa'

export function CadastroLocalModerador({
  onClose,
  onConcluir
}: {
  onClose: () => void
  onConcluir: (dados: { lat: number; lng: number; nome: string; categoria: string; descricao: string; endereco: string }) => void
}) {
  const [etapa, setEtapa] = useState<Etapa>('dados')

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [descricao, setDescricao] = useState('')

  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('São Luís')
  const [estado, setEstado] = useState('MA')

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [centroSugerido, setCentroSugerido] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodificando, setGeocodificando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const enderecoCompleto = () => {
    const partes = [rua && numero ? `${rua}, ${numero}` : rua, bairro, cidade, estado].filter(Boolean)
    return partes.join(' - ')
  }

  const irParaEndereco = () => {
    if (!nome.trim()) { setErro('Preencha o nome do local.'); return }
    setErro(null)
    setEtapa('endereco')
  }

  const irParaMapa = async () => {
    if (!rua.trim() || !bairro.trim()) {
      setErro('Preencha ao menos a rua e o bairro do local.')
      return
    }

    setErro(null)
    setEtapa('mapa')
    const endereco = enderecoCompleto()
    setGeocodificando(true)
    const resultado = await geocodificarEndereco(endereco)
    if (resultado) setCentroSugerido(resultado)
    setGeocodificando(false)
  }

  const finalizar = () => {
    if (lat === null || lng === null) { setErro('Posicione o pino no mapa.'); return }
    const categoriaFinal = categoria === 'OUTRO' ? novaCategoria.toUpperCase() : categoria
    onConcluir({ lat, lng, nome: nome.trim(), categoria: categoriaFinal, descricao: descricao.trim(), endereco: enderecoCompleto() })
  }

  const numeroEtapa = { dados: 1, endereco: 2, mapa: 3 }[etapa]

  return (
    <div className="fixed inset-0 bg-background/90 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between">
          <span className="text-[10px] text-amber-500">CADASTRAR LOCAL — {numeroEtapa}/3</span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {etapa === 'dados' && (
          <div className="space-y-3">
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Local *" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map(c => (<option key={c} value={c}>{c}</option>))}
              <option value="OUTRO">+ OUTRO</option>
            </select>
            {categoria === 'OUTRO' && (
              <input type="text" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Nome da nova categoria" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            )}
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs h-20" />

            <button type="button" onClick={irParaEndereco} className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-amber-500 text-background font-bold">
              Continuar <ArrowRight size={13} />
            </button>
          </div>
        )}

        {etapa === 'endereco' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Endereço</span>
            <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
              <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
              <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setEtapa('dados')} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button type="button" onClick={irParaMapa} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-amber-500 text-background font-bold">
                Continuar <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {etapa === 'mapa' && (
          <div className="space-y-3">
            {geocodificando && <p className="text-[10px] text-accent/40">Localizando a região do endereço...</p>}
            <MapaLocalPicker lat={lat} lng={lng} centroSugerido={centroSugerido} onChange={(novoLat, novoLng) => { setLat(novoLat); setLng(novoLng) }} />

            <div className="flex gap-2">
              <button type="button" onClick={() => setEtapa('endereco')} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button type="button" onClick={finalizar} className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-amber-500 text-background font-bold">
                Salvar no Mapa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}