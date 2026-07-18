import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type Empresa = {
  id: string
  nome_estabelecimento: string
  plano: string
  telefone: string | null
  instagram: string | null
  site: string | null
  horario_funcionamento: string | null
  endereco: string | null
  atributos: Record<string, boolean>
}

export function useEmpresa() {
  const { session, perfil } = useAuth()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!session?.user || !perfil?.is_empresa) { setEmpresa(null); setCarregando(false); return }
    setCarregando(true)
    const { data } = await supabase.from('empresas').select('*').eq('id', session.user.id).single()
    setEmpresa(data || null)
    setCarregando(false)
  }, [session?.user, perfil?.is_empresa])

  useEffect(() => { carregar() }, [carregar])

  const atualizarEmpresa = async (campos: Partial<Omit<Empresa, 'id' | 'plano'>>) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('empresas').update(campos).eq('id', session.user.id)
    if (!error) await carregar()
    return { error }
  }

  return { empresa, carregando, atualizarEmpresa, recarregar: carregar }
}