import React, { useState } from 'react'
import { supabase } from '../supabase'
import { X } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'

type LocalParaEditar = {
  id: number
  nome_local: string
  texto: string
  lat: number
  lng: number
  endereco: string | null
}

export function EditarLocalModal({
  local,
  onClose,
  onSalvo
}: {
  local: LocalParaEditar
  onClose: () => void
  onSalvo: () => void
}) {
  const [nome, setNome] = useState(local.nome_local || '')
  const [descricao, setDescricao] = useState(local.texto || '')
  const [endereco, setEndereco] = useState(local.endereco || '')
  const [lat, setLat] = useState<number | null>(local.lat)
  const [lng, setLng] = useState<number | null>(local.lng)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!nome.trim()) { setErro('Preencha o nome do local.'); return }
    if (lat === null || lng === null) { setErro('Posicione o pino no mapa.'); return }

    setErro(null)
    setSalvando(true)

    const { error } = await supabase
      .from('pulsos')
      .update({
        nome_local: nome.trim().toUpperCase(),
        texto: descricao.trim(),
        endereco: endereco.trim() || null,
        lat,
        lng
      })
      .eq('id', local.id)

    setSalvando(false)

    if (error) setErro(error.message)
    else onSalvo()
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between">
          <span className="text-[10px] text-amber-500">EDITAR LOCAL</span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Local" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
        <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs h-20" />

        <MapaLocalPicker lat={lat} lng={lng} onChange={(novoLat, novoLng) => { setLat(novoLat); setLng(novoLng) }} />

        <button type="button" onClick={salvar} disabled={salvando} className="w-full bg-amber-500 text-background py-3 text-xs font-bold uppercase rounded-lg">
          {salvando ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </div>
    </div>
  )
}