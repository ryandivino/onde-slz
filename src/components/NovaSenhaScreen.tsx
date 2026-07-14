import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function NovaSenhaScreen() {
  const { definirNovaSenha } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const lidarComSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (novaSenha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const { error } = await definirNovaSenha(novaSenha)
    setCarregando(false)

    if (error) setErro(error.message)
    else setSucesso(true)
  }

  return (
    <div className="fixed inset-0 bg-background z-[10000] flex items-center justify-center p-4">
      <form onSubmit={lidarComSubmit} className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl">
        <span className="text-[10px] font-mono tracking-widest text-accent block">DEFINIR NOVA SENHA</span>

        {sucesso ? (
          <p className="text-xs text-green-400">Senha atualizada! Pode continuar usando o ONDE normalmente.</p>
        ) : (
          <>
            {erro && <div className="text-[10px] text-red-400">{erro}</div>}
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha"
              minLength={6}
              required
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Confirmar nova senha"
              minLength={6}
              required
              className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs"
            />
            <button type="submit" disabled={carregando} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
              {carregando ? 'AGUARDE...' : 'SALVAR NOVA SENHA'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}