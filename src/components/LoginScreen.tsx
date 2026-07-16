import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Store } from 'lucide-react'
import { CadastroLocalDuasEtapas } from './CadastroLocalDuasEtapas'

const CATEGORIAS_BASE = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']

type DadosLocal = { lat: number; lng: number; nome: string; descricao: string }

export function EmpresaScreen({ onClose }: { onClose: () => void }) {
  const { entrar, cadastrarEmpresa } = useAuth()

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('cadastrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [apelido, setApelido] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0])
  const [dadosLocal, setDadosLocal] = useState<DadosLocal | null>(null)

  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)

  const handleEntrar = async () => {
    setErro(null)
    setCarregando(true)
    const { error } = await entrar(email, senha)
    if (error) setErro(error.message)
    else onClose()
    setCarregando(false)
  }

  const finalizarCadastro = async () => {
    if (!apelido.trim()) {
      setErro('Preencha o @ do estabelecimento.')
      return
    }
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha e-mail e senha.')
      return
    }
    if (!dadosLocal) return

    setErro(null)
    setCarregando(true)

    const { error, precisaConfirmarEmail } = await cadastrarEmpresa(
      email, senha, apelido.trim(), dadosLocal.nome,
      dadosLocal.lat, dadosLocal.lng, categoria, dadosLocal.descricao
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

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 flex items-center gap-2">
            <Store size={14} />
            {modo === 'entrar' ? 'ENTRAR (ESTABELECIMENTO)' : 'CADASTRAR ESTABELECIMENTO'}
          </span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        {modo === 'entrar' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <button type="button" onClick={handleEntrar} disabled={carregando} className="w-full bg-amber-500 text-background font-bold py-3 uppercase rounded-lg text-xs">
              {carregando ? 'AGUARDE...' : 'ENTRAR'}
            </button>
          </>
        )}

        {modo === 'cadastrar' && !dadosLocal && (
          <CadastroLocalDuasEtapas
            textoBotaoFinal="Continuar"
            onConcluir={(dados) => setDadosLocal(dados)}
          />
        )}

        {modo === 'cadastrar' && dadosLocal && (
          <>
            <div className="flex items-center justify-between text-[10px] font-mono text-green-400">
              <span>📍 {dadosLocal.nome}</span>
              <button type="button" onClick={() => setDadosLocal(null)} className="text-accent/40 underline">Alterar</button>
            </div>

            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs">
              {CATEGORIAS_BASE.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              minLength={6}
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <input
              type="text"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="@ do estabelecimento (ex: bardojoao)"
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />

            <button type="button" onClick={finalizarCadastro} disabled={carregando} className="w-full bg-amber-500 text-background font-bold py-3 uppercase rounded-lg text-xs">
              {carregando ? 'AGUARDE...' : 'CADASTRAR ESTABELECIMENTO'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null); setDadosLocal(null) }}
          className="w-full text-[10px] font-mono text-accent/50 text-center underline"
        >
          {modo === 'entrar' ? 'Ainda não tem cadastro? Cadastrar estabelecimento' : 'Já tem conta de estabelecimento? Entrar'}
        </button>
      </div>
    </div>
  )
}