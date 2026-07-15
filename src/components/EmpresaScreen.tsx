import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Store, LocateFixed } from 'lucide-react'
import { LocationPicker } from './LocationPicker'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

export function EmpresaScreen({ onClose }: { onClose: () => void }) {
  const { entrar, cadastrarEmpresa } = useAuth()

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('cadastrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [apelido, setApelido] = useState('')
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0])
  const [descricao, setDescricao] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  const usarLocalizacaoAtual = () => {
    setBuscandoLocal(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setBuscandoLocal(false)
      },
      () => {
        setErro('Não conseguimos acessar sua localização. Ajuste o pino direto no mapa abaixo.')
        setBuscandoLocal(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const lidarComSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    if (modo === 'entrar') {
      const { error } = await entrar(email, senha)
      if (error) setErro(error.message)
      else onClose()
    } else {
      if (!apelido.trim() || !nomeEstabelecimento.trim()) {
        setErro('Preencha o @ e o nome do estabelecimento.')
        setCarregando(false)
        return
      }
      if (lat === null || lng === null) {
        setErro('Ajuste a localização no mapa antes de continuar.')
        setCarregando(false)
        return
      }

      const { error, precisaConfirmarEmail } = await cadastrarEmpresa(
        email, senha, apelido.trim(), nomeEstabelecimento.trim(),
        lat, lng, categoria, descricao
      )
      if (error) setErro(error.message)
      else if (precisaConfirmarEmail) setAguardandoConfirmacao(true)
      else onClose()
    }

    setCarregando(false)
  }

  if (aguardandoConfirmacao) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl text-center">
          <span className="text-[10px] font-mono tracking-widest text-accent block">QUASE LÁ</span>
          <p className="text-xs text-accent/80">
            Enviamos um link de confirmação para <strong>{email}</strong>. Confirme pra ativar a conta e o pin do seu estabelecimento no mapa.
          </p>
          <button onClick={onClose} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
            ENTENDI
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <form onSubmit={lidarComSubmit} className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Store size={14} />
            {modo === 'entrar' ? 'ENTRAR (ESTABELECIMENTO)' : 'CADASTRAR ESTABELECIMENTO'}
          </span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {modo === 'cadastrar' && (
          <>
            <input
              type="text"
              value={nomeEstabelecimento}
              onChange={(e) => setNomeEstabelecimento(e.target.value)}
              placeholder="Nome do estabelecimento"
              required
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />

            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do estabelecimento (opcional)"
              className="w-full h-16 bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />

            <div className="space-y-2">
              <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
                Localização do pin no mapa
              </span>

              <button
                type="button"
                onClick={usarLocalizacaoAtual}
                disabled={buscandoLocal}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2 rounded-lg border border-borderRaw text-accent/70"
              >
                <LocateFixed size={13} />
                {buscandoLocal ? 'Buscando...' : 'Ir pra minha localização atual'}
              </button>

              <LocationPicker lat={lat} lng={lng} onChange={(novoLat, novoLng) => { setLat(novoLat); setLng(novoLng) }} />
            </div>
          </>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          required
          minLength={6}
          className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        {modo === 'cadastrar' && (
          <input
            type="text"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="@ do estabelecimento (ex: bardojoao)"
            required
            className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
        )}

        <button type="submit" disabled={carregando} className="w-full bg-amber-500 text-background font-bold py-3 uppercase rounded-lg text-xs">
          {carregando ? 'AGUARDE...' : modo === 'entrar' ? 'ENTRAR' : 'CADASTRAR ESTABELECIMENTO'}
        </button>

        <button
          type="button"
          onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null) }}
          className="w-full text-[10px] font-mono text-accent/50 text-center underline"
        >
          {modo === 'entrar' ? 'Ainda não tem cadastro? Cadastrar estabelecimento' : 'Já tem conta de estabelecimento? Entrar'}
        </button>
      </form>
    </div>
  )
}