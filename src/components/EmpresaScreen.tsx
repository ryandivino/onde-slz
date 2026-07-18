import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Store, ArrowRight, ArrowLeft } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'
import { AtributosEstabelecimento } from './AtributosEstabelecimento'
import type { Atributos } from './AtributosEstabelecimento'
import { geocodificarEndereco } from '../utils/geocodificarEndereco'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

type Etapa = 'dados' | 'endereco' | 'mapa' | 'conta'

export function EmpresaScreen({ onClose }: { onClose: () => void }) {
  const { entrar, cadastrarEmpresa } = useAuth()

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('cadastrar')
  const [etapa, setEtapa] = useState<Etapa>('dados')

  // Etapa 1 — dados
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0])
  const [telefone, setTelefone] = useState('')
  const [site, setSite] = useState('')
  const [horario, setHorario] = useState('')
  const [atributos, setAtributos] = useState<Atributos>({})

  // Etapa 2 — endereço
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('São Luís')
  const [estado, setEstado] = useState('MA')

  // Etapa 3 — mapa
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [centroSugerido, setCentroSugerido] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodificando, setGeocodificando] = useState(false)

  // Etapa 4 — conta
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [apelido, setApelido] = useState('')

  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  const enderecoCompleto = () => {
    const partes = [rua && numero ? `${rua}, ${numero}` : rua, bairro, cidade, estado].filter(Boolean)
    return partes.join(' - ')
  }

  const handleEntrar = async () => {
    setErro(null)
    setCarregando(true)
    const { error } = await entrar(email, senha)
    if (error) setErro(error.message)
    else onClose()
    setCarregando(false)
  }

  const irParaEndereco = () => {
    if (!nomeEstabelecimento.trim()) { setErro('Preencha o nome do estabelecimento.'); return }
    setErro(null)
    setEtapa('endereco')
  }

  const irParaMapa = async () => {
    setErro(null)
    setEtapa('mapa')
    const endereco = enderecoCompleto()
    if (endereco) {
      setGeocodificando(true)
      const resultado = await geocodificarEndereco(endereco)
      if (resultado) setCentroSugerido(resultado)
      setGeocodificando(false)
    }
  }

  const irParaConta = () => {
    if (lat === null || lng === null) { setErro('Posicione o pino no mapa.'); return }
    setErro(null)
    setEtapa('conta')
  }

  const finalizarCadastro = async () => {
    if (!apelido.trim()) { setErro('Preencha o @ do estabelecimento.'); return }
    if (!email.trim() || !senha.trim()) { setErro('Preencha e-mail e senha.'); return }
    if (lat === null || lng === null) return

    setErro(null)
    setCarregando(true)

    const { error, precisaConfirmarEmail } = await cadastrarEmpresa(
      email, senha, apelido.trim(), nomeEstabelecimento.trim(),
      lat, lng, categoria, '',
      { telefone, site, horarioFuncionamento: horario, endereco: enderecoCompleto(), atributos }
    )

    if (error) setErro(error.message)
    else if (precisaConfirmarEmail) setAguardandoConfirmacao(true)
    else onClose()

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

  const numeroEtapa = { dados: 1, endereco: 2, mapa: 3, conta: 4 }[etapa]

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Store size={14} />
            {modo === 'entrar' ? 'ENTRAR (ESTABELECIMENTO)' : `CADASTRAR ESTABELECIMENTO — ${numeroEtapa}/4`}
          </span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {modo === 'entrar' && (
          <>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <button type="button" onClick={handleEntrar} disabled={carregando} className="w-full bg-amber-500 text-background font-bold py-3 uppercase rounded-lg text-xs">
              {carregando ? 'AGUARDE...' : 'ENTRAR'}
            </button>
          </>
        )}

        {modo === 'cadastrar' && etapa === 'dados' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 1 — Dados do estabelecimento</span>
            <input type="text" value={nomeEstabelecimento} onChange={(e) => setNomeEstabelecimento(e.target.value)} placeholder="Nome do estabelecimento *" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Horário de funcionamento (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

            <AtributosEstabelecimento atributos={atributos} onChange={setAtributos} />

            <button type="button" onClick={irParaEndereco} className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold">
              Continuar <ArrowRight size={13} />
            </button>
          </div>
        )}

        {modo === 'cadastrar' && etapa === 'endereco' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 2 — Endereço (opcional)</span>
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
              <button type="button" onClick={irParaMapa} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold">
                Continuar <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {modo === 'cadastrar' && etapa === 'mapa' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 3 — Posicione seu estabelecimento</span>
            {geocodificando && <p className="text-[10px] text-accent/40">Localizando a região do endereço...</p>}
            <MapaLocalPicker lat={lat} lng={lng} centroSugerido={centroSugerido} onChange={(novoLat, novoLng) => { setLat(novoLat); setLng(novoLng) }} />

            <div className="flex gap-2">
              <button type="button" onClick={() => setEtapa('endereco')} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button type="button" onClick={irParaConta} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold">
                Continuar <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {modo === 'cadastrar' && etapa === 'conta' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 4 — Sua conta</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" minLength={6} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="@ do estabelecimento (ex: bardojoao)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

            <div className="flex gap-2">
              <button type="button" onClick={() => setEtapa('mapa')} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button type="button" onClick={finalizarCadastro} disabled={carregando} className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-amber-500 text-background font-bold">
                {carregando ? 'AGUARDE...' : 'CADASTRAR'}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null); setEtapa('dados') }}
          className="w-full text-[10px] font-mono text-accent/50 text-center underline"
        >
          {modo === 'entrar' ? 'Ainda não tem cadastro? Cadastrar estabelecimento' : 'Já tem conta de estabelecimento? Entrar'}
        </button>
      </div>
    </div>
  )
}