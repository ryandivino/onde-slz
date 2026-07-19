import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X } from 'lucide-react'

const LIMITE_TENTATIVAS = 15

// Contagem de tentativas por e-mail, guardada localmente. É uma camada extra
// de fricção contra tentativas repetidas nesse navegador — não substitui
// proteções server-side (o Supabase já tem rate limiting próprio por padrão).
const chaveTentativas = (email: string) => `onde_tentativas_login_${email.toLowerCase()}`

function lerTentativas(email: string): number {
  try { return parseInt(localStorage.getItem(chaveTentativas(email)) || '0', 10) } catch { return 0 }
}
function incrementarTentativas(email: string): number {
  const atual = lerTentativas(email) + 1
  try { localStorage.setItem(chaveTentativas(email), String(atual)) } catch {}
  return atual
}
function limparTentativas(email: string) {
  try { localStorage.removeItem(chaveTentativas(email)) } catch {}
}

export function LoginScreen({ onClose }: { onClose: () => void }) {
  const { entrar, cadastrar, enviarLinkRecuperacao } = useAuth()

  const [modo, setModo] = useState<'entrar' | 'cadastrar' | 'recuperar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const [linkRecuperacaoEnviado, setLinkRecuperacaoEnviado] = useState(false)

  const lidarComSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    if (modo === 'entrar') {
      const tentativasAtuais = lerTentativas(email)
      if (tentativasAtuais >= LIMITE_TENTATIVAS) {
        setErro('Muitas tentativas com esse e-mail. Use "Esqueceu sua senha?" para recuperar o acesso.')
        setCarregando(false)
        return
      }

      const { error } = await entrar(email, senha)
      if (error) {
        const novasTentativas = incrementarTentativas(email)
        setTentativas(novasTentativas)
        setErro(error.message)
      } else {
        limparTentativas(email)
        onClose()
      }
    } else if (modo === 'cadastrar') {
      if (!apelido.trim()) {
        setErro('Escolha um @ para continuar.')
        setCarregando(false)
        return
      }
      const { error, precisaConfirmarEmail } = await cadastrar(email, senha, apelido.trim())
      if (error) {
        setErro(error.message)
      } else if (precisaConfirmarEmail) {
        setAguardandoConfirmacao(true)
      } else {
        onClose()
      }
    } else {
      // recuperar
      const { error } = await enviarLinkRecuperacao(email)
      if (error) setErro(error.message)
      else {
        limparTentativas(email)
        setLinkRecuperacaoEnviado(true)
      }
    }

    setCarregando(false)
  }

  if (aguardandoConfirmacao) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl text-center">
          <span className="text-[10px] font-mono tracking-widest text-accent block">QUASE LÁ</span>
          <p className="text-xs text-accent/80">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar sua conta e depois volte pra entrar.
          </p>
          <button onClick={onClose} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
            ENTENDI
          </button>
        </div>
      </div>
    )
  }

  if (linkRecuperacaoEnviado) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl text-center">
          <span className="text-[10px] font-mono tracking-widest text-accent block">VERIFIQUE SEU E-MAIL</span>
          <p className="text-xs text-accent/80">
            Enviamos um link de recuperação para <strong>{email}</strong>. Clique nele para definir uma nova senha.
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
      <form onSubmit={lidarComSubmit} className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent">
            {modo === 'entrar' ? 'ENTRAR' : modo === 'cadastrar' ? 'CRIAR CONTA' : 'RECUPERAR SENHA'}
          </span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        {modo !== 'recuperar' && (
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            required
            minLength={6}
            className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
        )}

        {modo === 'entrar' && erro && (
          <div className="space-y-1.5">
            <p className="text-[9px] text-accent/50">
              Se você tem certeza da senha, talvez esse e-mail ainda não tenha conta por aqui.
            </p>
            <button
              type="button"
              onClick={() => { setModo('cadastrar'); setErro(null) }}
              className="text-[10px] font-mono text-accent/60 underline"
            >
              Criar conta com esse e-mail
            </button>
          </div>
        )}

        {modo === 'entrar' && tentativas > 0 && (
          <button
            type="button"
            onClick={() => { setModo('recuperar'); setErro(null) }}
            className="text-[10px] font-mono text-accent/60 underline"
          >
            Esqueceu sua senha?
          </button>
        )}

        {modo === 'cadastrar' && (
          <input
            type="text"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="Seu @ (ex: joaosilva)"
            required
            className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
        )}

        <button type="submit" disabled={carregando} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
          {carregando ? 'AGUARDE...' : modo === 'entrar' ? 'ENTRAR' : modo === 'cadastrar' ? 'CRIAR CONTA' : 'ENVIAR LINK DE RECUPERAÇÃO'}
        </button>

        {modo === 'recuperar' ? (
          <button type="button" onClick={() => { setModo('entrar'); setErro(null) }} className="w-full text-[10px] font-mono text-accent/50 text-center underline">
            Voltar para o login
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null) }}
            className="w-full text-[10px] font-mono text-accent/50 text-center underline"
          >
            {modo === 'entrar' ? 'Não tem conta? Criar uma agora' : 'Já tem conta? Entrar'}
          </button>
        )}
      </form>
    </div>
  )
}