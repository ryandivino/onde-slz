import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase'
import { X, Store, ArrowRight, ArrowLeft, Search } from 'lucide-react'
import { MapaLocalPicker } from './MapaLocalPicker'
import { PoliticasPopup } from './PoliticasModal'
import { AtributosEstabelecimento } from './AtributosEstabelecimento'
import type { Atributos } from './AtributosEstabelecimento'
import { geocodificarEndereco } from '../utils/geocodificarEndereco'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

type Etapa = 'buscar' | 'dados' | 'endereco' | 'mapa' | 'conta'
type LocalEncontrado = { id: number; nome_local: string; categoria: string; lat: number; lng: number }

export function EmpresaScreen({ onClose }: { onClose: () => void }) {
  const { entrar, cadastrarEmpresa } = useAuth()

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('cadastrar')
  const [etapa, setEtapa] = useState<Etapa>('buscar')

  // Etapa 0 — buscar se já existe um pré-cadastro feito pelo moderador
  const [termoBuscaLocal, setTermoBuscaLocal] = useState('')
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [locaisEncontrados, setLocaisEncontrados] = useState<LocalEncontrado[]>([])
  const [pulsoReivindicado, setPulsoReivindicado] = useState<LocalEncontrado | null>(null)

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
  const [aceitouPoliticas, setAceitouPoliticas] = useState(false)
  const [mostrarPoliticas, setMostrarPoliticas] = useState(false)
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

  const buscarLocalExistente = async () => {
    if (!termoBuscaLocal.trim()) return
    setBuscandoLocal(true)
    setLocaisEncontrados([])
    const { data } = await supabase
      .from('pulsos')
      .select('id, nome_local, categoria, lat, lng')
      .eq('is_fixed', true)
      .is('user_id', null)
      .ilike('nome_local', `%${termoBuscaLocal.trim()}%`)
      .limit(5)
    setLocaisEncontrados(data || [])
    setBuscandoLocal(false)
  }

  const reivindicarLocal = (local: LocalEncontrado) => {
    setPulsoReivindicado(local)
    setNomeEstabelecimento(local.nome_local)
    setCategoria(CATEGORIAS_BASE.includes(local.categoria) ? local.categoria : CATEGORIAS_BASE[0])
    setLat(local.lat)
    setLng(local.lng)
    setEtapa('dados')
  }

  const cadastrarLocalNovo = () => {
    setPulsoReivindicado(null)
    setEtapa('dados')
  }

  const irParaEndereco = () => {
    if (!nomeEstabelecimento.trim()) { setErro('Preencha o nome do estabelecimento.'); return }
    setErro(null)
    setEtapa('endereco')
  }

  const irParaMapa = async () => {
    if (!rua.trim() || !bairro.trim()) {
      setErro('Preencha ao menos a rua e o bairro do estabelecimento.')
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

  const irParaConta = () => {
    if (lat === null || lng === null) { setErro('Posicione o pino no mapa.'); return }
    setErro(null)
    setEtapa('conta')
  }

  const finalizarCadastro = async () => {
    if (!apelido.trim()) { setErro('Preencha o @ do estabelecimento.'); return }
    if (!email.trim() || !senha.trim()) { setErro('Preencha e-mail e senha.'); return }
    if (!aceitouPoliticas) { setErro('Você precisa aceitar as políticas e diretrizes pra criar uma conta.'); return }
    if (lat === null || lng === null) return

    setErro(null)
    setCarregando(true)

    const { error, precisaConfirmarEmail } = await cadastrarEmpresa(
      email, senha, apelido.trim(), nomeEstabelecimento.trim(),
      lat, lng, categoria, '',
      { telefone, site, horarioFuncionamento: horario, endereco: enderecoCompleto(), atributos, pulsoReivindicadoId: pulsoReivindicado?.id },
      aceitouPoliticas
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

  const numeroEtapa = { buscar: 0, dados: 1, endereco: 2, mapa: 3, conta: 4 }[etapa]

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Store size={14} />
            {modo === 'entrar' ? 'ENTRAR (ESTABELECIMENTO)' : etapa === 'buscar' ? 'CADASTRAR ESTABELECIMENTO' : `CADASTRAR ESTABELECIMENTO — ${numeroEtapa}/4`}
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
            {erro && (
              <div className="space-y-1">
                <p className="text-[9px] text-accent/50">Se a senha estiver certa, talvez esse e-mail ainda não tenha cadastro de estabelecimento.</p>
                <button type="button" onClick={() => { setModo('cadastrar'); setErro(null); setEtapa('buscar') }} className="text-[10px] font-mono text-accent/60 underline">
                  Cadastrar estabelecimento com esse e-mail
                </button>
              </div>
            )}
          </>
        )}

        {modo === 'cadastrar' && etapa === 'buscar' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">
              Seu estabelecimento já está no mapa?
            </span>
            <p className="text-[10px] text-accent/50">
              Seu local pode já existir no ONDE. Busque pelo nome antes de cadastrar do zero.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={termoBuscaLocal}
                onChange={(e) => setTermoBuscaLocal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarLocalExistente() } }}
                placeholder="Nome do seu estabelecimento"
                className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs"
              />
              <button type="button" onClick={buscarLocalExistente} disabled={buscandoLocal} className="bg-accent text-background rounded-lg px-3 flex-shrink-0">
                <Search size={14} />
              </button>
            </div>

            {buscandoLocal && <p className="text-[10px] text-accent/40">Buscando...</p>}

            {!buscandoLocal && locaisEncontrados.length > 0 && (
              <div className="space-y-1.5">
                {locaisEncontrados.map((local) => (
                  <button
                    key={local.id}
                    type="button"
                    onClick={() => reivindicarLocal(local)}
                    className="w-full text-left text-[10px] font-mono px-3 py-2 rounded-lg border border-borderRaw text-accent/70 hover:bg-background/60"
                  >
                    📍 {local.nome_local} <span className="text-accent/40">— {local.categoria}</span>
                  </button>
                ))}
              </div>
            )}

            <button type="button" onClick={cadastrarLocalNovo} className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold">
              Não encontrei — Adicionar novo local <ArrowRight size={13} />
            </button>
          </div>
        )}

        {modo === 'cadastrar' && etapa === 'dados' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 1 — Dados do estabelecimento</span>
            {pulsoReivindicado && (
              <p className="text-[9px] text-green-400">📍 Usando o local "{pulsoReivindicado.nome_local}" já fixado no mapa — os dados abaixo vão sobrepor os já existentes.</p>
            )}
            <input type="text" value={nomeEstabelecimento} onChange={(e) => setNomeEstabelecimento(e.target.value)} placeholder="Nome do estabelecimento *" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Horário de funcionamento (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

            <AtributosEstabelecimento atributos={atributos} onChange={setAtributos} />

            <div className="flex gap-2">
              <button type="button" onClick={() => setEtapa('buscar')} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button type="button" onClick={irParaEndereco} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold">
                Continuar <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {modo === 'cadastrar' && etapa === 'endereco' && (
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest block">Etapa 2 — Endereço</span>
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

            <label className="flex items-start gap-2 text-[10px] font-mono text-accent/60">
              <input
                type="checkbox"
                checked={aceitouPoliticas}
                onChange={(e) => setAceitouPoliticas(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Li e aceito as{' '}
                <button type="button" onClick={() => setMostrarPoliticas(true)} className="underline text-accent/80">
                  políticas e diretrizes
                </button>{' '}
                do ONDE
              </span>
            </label>

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
          onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null); setEtapa('buscar') }}
          className="w-full text-[10px] font-mono text-accent/50 text-center underline"
        >
          {modo === 'entrar' ? 'Ainda não tem cadastro? Cadastrar estabelecimento' : 'Já tem conta de estabelecimento? Entrar'}
        </button>
      </div>

      {mostrarPoliticas && <PoliticasPopup onClose={() => setMostrarPoliticas(false)} />}
    </div>
  )
}