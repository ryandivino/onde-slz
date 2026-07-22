import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../hooks/useAuth'
import { X, Calendar, Camera, MapPin } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'
import { geocodificarEndereco } from '../utils/geocodificarEndereco'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

function agoraFormatadoParaInput() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}

export function EventoModal({ onClose, onPublicado }: { onClose: () => void; onPublicado: () => void }) {
  const { session } = useAuth()

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0])
  const [dataHora, setDataHora] = useState(agoraFormatadoParaInput())
  const [descricao, setDescricao] = useState('')
  const [linkIngresso, setLinkIngresso] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('São Luís')
  const [estado, setEstado] = useState('MA')
  const [centroSugerido, setCentroSugerido] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodificando, setGeocodificando] = useState(false)

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude) },
      () => {},
      { enableHighAccuracy: true }
    )
  }, [])

  const enderecoCompleto = () => {
    const partes = [rua && numero ? `${rua}, ${numero}` : rua, bairro, cidade, estado].filter(Boolean)
    return partes.join(' - ')
  }

  const buscarEnderecoNoMapa = async () => {
    const endereco = enderecoCompleto()
    if (!endereco) return
    setGeocodificando(true)
    const resultado = await geocodificarEndereco(endereco)
    if (resultado) setCentroSugerido(resultado)
    setGeocodificando(false)
  }

  const lidarComFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setFoto(arquivo)
    setFotoPreview(URL.createObjectURL(arquivo))
  }

  const publicar = async () => {
    if (!titulo.trim()) { setErro('Preencha o título do evento.'); return }
    if (!rua.trim() || !bairro.trim()) { setErro('Preencha ao menos a rua e o bairro do evento.'); return }
    if (!dataHora) { setErro('Escolha a data e hora do evento.'); return }
    if (lat === null || lng === null) { setErro('Posicione o local do evento no mapa.'); return }
    if (!session?.user) return

    setErro(null)
    setEnviando(true)

    try {
      let imageUrl: string | null = null

      if (foto) {
        const caminho = `${session.user.id}/${Date.now()}.jpg`
        const { error: erroUpload } = await supabase.storage.from('fotos-eventos').upload(caminho, foto)
        if (erroUpload) throw erroUpload
        const { data: urlData } = supabase.storage.from('fotos-eventos').getPublicUrl(caminho)
        imageUrl = urlData.publicUrl
      }

      const { error: erroInsert } = await supabase.from('eventos').insert([{
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria,
        data_hora: new Date(dataHora).toISOString(),
        lat,
        lng,
        endereco: enderecoCompleto() || null,
        link_ingresso: linkIngresso.trim() || null,
        image_url: imageUrl,
        user_id: session.user.id
      }])

      if (erroInsert) throw erroInsert
      onPublicado()
    } catch (err: any) {
      setErro(err.message || 'Erro ao publicar o evento. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/95 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Calendar size={14} /> CRIAR EVENTO
          </span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do evento *" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
          {CATEGORIAS_BASE.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>

        <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar size={11} /> Data e horário do evento *
        </span>
        <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="w-full h-16 bg-background border border-borderRaw rounded-lg p-2 text-xs" />

        <input type="text" value={linkIngresso} onChange={(e) => setLinkIngresso(e.target.value)} placeholder="Link de ingressos (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

        <label className="flex items-center gap-2 text-[10px] font-mono text-accent/60 cursor-pointer">
          <Camera size={14} />
          {foto ? 'Foto selecionada — trocar' : 'Adicionar foto (opcional)'}
          <input type="file" accept="image/*" onChange={lidarComFoto} className="hidden" />
        </label>
        {fotoPreview && <img src={fotoPreview} alt="Prévia" className="w-full rounded-lg border border-borderRaw max-h-32 object-cover" />}

        <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest flex items-center gap-1.5">
          <MapPin size={11} /> Endereço do evento *
        </span>
        <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
          <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
          <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado" className="bg-background border border-borderRaw rounded-lg p-2 text-xs" />
        </div>
        <button
          type="button"
          onClick={buscarEnderecoNoMapa}
          disabled={geocodificando || !rua.trim()}
          className="w-full text-[10px] font-mono uppercase tracking-widest py-2 rounded-lg border border-borderRaw text-accent/70 disabled:opacity-40"
        >
          {geocodificando ? 'Localizando...' : 'Levar o pino pra esse endereço'}
        </button>

        <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest flex items-center gap-1.5">
          <MapPin size={11} /> Local do evento *
        </span>
        <MapaLocalPicker lat={lat} lng={lng} centroSugerido={centroSugerido} onChange={(novoLat, novoLng) => { setLat(novoLat); setLng(novoLng) }} />

        <button type="button" onClick={publicar} disabled={enviando} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
          {enviando ? 'PUBLICANDO...' : 'PUBLICAR EVENTO'}
        </button>
      </div>
    </div>
  )
}