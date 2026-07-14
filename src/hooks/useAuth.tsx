import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../supabase'
import type { Session } from '@supabase/supabase-js'

export type Perfil = {
  id: string
  apelido: string
  is_admin: boolean
  is_empresa: boolean
  avatar_url: string | null
  bio: string | null
  created_at: string
}

const MENSAGEM_APELIDO_EM_USO = 'Esse @ já está em uso. Escolha outro.'

// Antes, cada componente que chamava useAuth() criava sua própria sessão,
// seu próprio listener (onAuthStateChange) e sua própria busca de perfil —
// redundante, e mais pesado conforme o app cresce. Agora existe um único
// AuthProvider no topo do app (ver main.tsx) e todo mundo compartilha o
// mesmo estado via Context. A assinatura de useAuth() continua igual —
// nenhum componente que já usa precisa mudar.
function useAuthState() {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [emRecuperacaoSenha, setEmRecuperacaoSenha] = useState(false)

  const buscarPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      setPerfil(null)
      return
    }
    setPerfil(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) buscarPerfil(session.user.id)
      setCarregandoAuth(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setEmRecuperacaoSenha(true)
      if (session?.user) {
        buscarPerfil(session.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [buscarPerfil])

  const apelidoDisponivel = async (apelido: string, excluindoUserId?: string) => {
    let query = supabase.from('profiles').select('id').ilike('apelido', apelido)
    if (excluindoUserId) query = query.neq('id', excluindoUserId)
    const { data, error } = await query.limit(1)
    if (error) return { disponivel: false, error }
    return { disponivel: (data?.length ?? 0) === 0, error: null }
  }

  const traduzirErroApelido = (error: any) => {
    if (error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate')) {
      return new Error(MENSAGEM_APELIDO_EM_USO)
    }
    return error
  }

  const cadastrar = async (email: string, senha: string, apelido: string) => {
    const apelidoLimpo = apelido.trim()

    const { disponivel, error: erroCheck } = await apelidoDisponivel(apelidoLimpo)
    if (erroCheck) return { error: erroCheck, precisaConfirmarEmail: false }
    if (!disponivel) return { error: new Error(MENSAGEM_APELIDO_EM_USO), precisaConfirmarEmail: false }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { apelido: apelidoLimpo } }
    })

    if (error) return { error: traduzirErroApelido(error), precisaConfirmarEmail: false }

    const precisaConfirmarEmail = !data.session
    if (data.session?.user) await buscarPerfil(data.session.user.id)

    return { error: null, precisaConfirmarEmail }
  }

  const cadastrarEmpresa = async (
    email: string,
    senha: string,
    apelido: string,
    nomeEstabelecimento: string,
    lat: number,
    lng: number,
    categoria: string,
    descricao: string
  ) => {
    const apelidoLimpo = apelido.trim()

    const { disponivel, error: erroCheck } = await apelidoDisponivel(apelidoLimpo)
    if (erroCheck) return { error: erroCheck, precisaConfirmarEmail: false }
    if (!disponivel) return { error: new Error(MENSAGEM_APELIDO_EM_USO), precisaConfirmarEmail: false }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          apelido: apelidoLimpo,
          is_empresa: true,
          nome_estabelecimento: nomeEstabelecimento.trim(),
          lat,
          lng,
          categoria,
          descricao: descricao.trim()
        }
      }
    })

    if (error) return { error: traduzirErroApelido(error), precisaConfirmarEmail: false }

    const precisaConfirmarEmail = !data.session
    if (data.session?.user) await buscarPerfil(data.session.user.id)

    return { error: null, precisaConfirmarEmail }
  }

  const entrar = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    return { error }
  }

  const enviarLinkRecuperacao = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    return { error }
  }

  const definirNovaSenha = async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (!error) setEmRecuperacaoSenha(false)
    return { error }
  }

  const definirAdmin = async (targetId: string, novoValor: boolean) => {
    const { error } = await supabase.rpc('definir_admin', { target_id: targetId, novo_valor: novoValor })
    return { error }
  }

  const sair = async () => {
    await supabase.auth.signOut()
  }

  const atualizarApelido = async (novoApelido: string) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const apelidoLimpo = novoApelido.trim()

    const { error } = await supabase.rpc('trocar_apelido', { novo_apelido: apelidoLimpo })
    if (error) return { error: traduzirErroApelido(error) }

    await buscarPerfil(session.user.id)
    return { error: null }
  }

  const enviarAvatar = async (arquivo: File) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const extensao = arquivo.name.split('.').pop() || 'jpg'
    const caminho = `${session.user.id}/avatar.${extensao}`

    const { error: erroUpload } = await supabase.storage.from('avatares').upload(caminho, arquivo, { upsert: true })
    if (erroUpload) return { error: erroUpload }

    const { data } = supabase.storage.from('avatares').getPublicUrl(caminho)
    const urlComVersao = `${data.publicUrl}?v=${Date.now()}`

    const { error: erroUpdate } = await supabase.from('profiles').update({ avatar_url: urlComVersao }).eq('id', session.user.id)
    if (erroUpdate) return { error: erroUpdate }

    await buscarPerfil(session.user.id)
    return { error: null }
  }

  const atualizarBio = async (novaBio: string) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('profiles').update({ bio: novaBio.trim() || null }).eq('id', session.user.id)
    if (!error) await buscarPerfil(session.user.id)
    return { error }
  }

  return {
    session,
    perfil,
    usuarioLogado: !!session?.user,
    carregandoAuth,
    emRecuperacaoSenha,
    cadastrar,
    cadastrarEmpresa,
    entrar,
    sair,
    atualizarApelido,
    enviarAvatar,
    atualizarBio,
    enviarLinkRecuperacao,
    definirNovaSenha,
    definirAdmin
  }
}

type AuthContextValue = ReturnType<typeof useAuthState>

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const valor = useAuthState()
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider> (ver main.tsx)')
  }
  return contexto
}