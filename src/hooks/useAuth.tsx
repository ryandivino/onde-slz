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
  banido: boolean
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
  // Guardado separado da sessão/perfil de propósito: quando a conta é
  // banida, a gente desloga na hora (session/perfil somem), mas ainda
  // precisa mostrar a tela avisando por que isso aconteceu.
  const [contaBanida, setContaBanida] = useState(false)

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

    if (data?.banido) {
      setContaBanida(true)
      setPerfil(null)
      await supabase.auth.signOut()
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

  // Traduz as mensagens de erro mais comuns do Supabase Auth (que vêm em
  // inglês) pra um português direto, alinhado com o resto do app.
  const traduzirErroAuth = (error: any): Error => {
    const msg = (error?.message || '').toLowerCase()

    if (msg.includes('invalid login credentials')) {
      return new Error('E-mail ou senha incorretos.')
    }
    if (msg.includes('email not confirmed')) {
      return new Error('Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).')
    }
    if (msg.includes('user already registered') || msg.includes('already registered')) {
      return new Error('Esse e-mail já está cadastrado.')
    }
    if (msg.includes('password should be at least')) {
      return new Error('A senha precisa ter pelo menos 6 caracteres.')
    }
    if (msg.includes('unable to validate email address') || msg.includes('invalid email')) {
      return new Error('Esse e-mail não é válido.')
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return new Error('Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.')
    }
    if (msg.includes('network')) {
      return new Error('Falha de conexão. Verifique sua internet e tente de novo.')
    }

    return error instanceof Error ? error : new Error('Não foi possível completar a ação. Tente novamente.')
  }

  const cadastrar = async (email: string, senha: string, apelido: string) => {
    const apelidoLimpo = apelido.trim()

    const { disponivel, error: erroCheck } = await apelidoDisponivel(apelidoLimpo)
    if (erroCheck) return { error: erroCheck, precisaConfirmarEmail: false }
    if (!disponivel) return { error: new Error(MENSAGEM_APELIDO_EM_USO), precisaConfirmarEmail: false }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { apelido: apelidoLimpo },
        emailRedirectTo: window.location.origin
      }
    })

    if (error) return { error: traduzirErroAuth(traduzirErroApelido(error)), precisaConfirmarEmail: false }

    // Supabase não avisa se o e-mail já existe (proteção contra enumeração) —
    // ele só reenvia algo pro e-mail antigo e finge que deu certo. O jeito
    // confiável de detectar isso é checar `identities`: uma conta nova
    // sempre vem com pelo menos uma; uma já existente e confirmada, com zero.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: new Error('Esse e-mail já está cadastrado. Tente entrar ou usar "Esqueceu sua senha?".'), precisaConfirmarEmail: false }
    }

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
    descricao: string,
    dadosExtras?: {
      telefone?: string
      site?: string
      horarioFuncionamento?: string
      endereco?: string
      atributos?: Record<string, boolean>
      pulsoReivindicadoId?: number
    }
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
          descricao: descricao.trim(),
          telefone: dadosExtras?.telefone?.trim() || null,
          site: dadosExtras?.site?.trim() || null,
          horario_funcionamento: dadosExtras?.horarioFuncionamento?.trim() || null,
          endereco: dadosExtras?.endereco?.trim() || null,
          atributos: dadosExtras?.atributos || {},
          claimed_pulso_id: dadosExtras?.pulsoReivindicadoId ?? null
        },
        emailRedirectTo: window.location.origin
      }
    })

    if (error) return { error: traduzirErroAuth(traduzirErroApelido(error)), precisaConfirmarEmail: false }

    // Supabase não avisa se o e-mail já existe (proteção contra enumeração) —
    // ele só reenvia algo pro e-mail antigo e finge que deu certo. O jeito
    // confiável de detectar isso é checar `identities`: uma conta nova
    // sempre vem com pelo menos uma; uma já existente e confirmada, com zero.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: new Error('Esse e-mail já está cadastrado. Tente entrar ou usar "Esqueceu sua senha?".'), precisaConfirmarEmail: false }
    }

    const precisaConfirmarEmail = !data.session
    if (data.session?.user) await buscarPerfil(data.session.user.id)

    return { error: null, precisaConfirmarEmail }
  }

  const entrar = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) return { error: traduzirErroAuth(error) }
    return { error: null }
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

  const definirBanido = async (targetId: string, banido: boolean, motivo?: string) => {
    const { error } = await supabase.from('profiles').update({ banido, motivo_ban: banido ? (motivo || null) : null }).eq('id', targetId)
    return { error }
  }

  return {
    session,
    perfil,
    usuarioLogado: !!session?.user,
    carregandoAuth,
    emRecuperacaoSenha,
    contaBanida,
    limparAvisoBanido: () => setContaBanida(false),
    cadastrar,
    cadastrarEmpresa,
    entrar,
    sair,
    atualizarApelido,
    enviarAvatar,
    atualizarBio,
    enviarLinkRecuperacao,
    definirNovaSenha,
    definirAdmin,
    definirBanido
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