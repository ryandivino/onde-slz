import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type EventoLocal = {
  id: number
  pulso_id: number
  titulo: string
  descricao: string | null
  recorrencia: string
  horario: string | null
  ativo: boolean
  criado_por: string | null
  created_at: string
}

export function useEventos() {
  const { session } = useAuth()
  const [eventos, setEventos] = useState<EventoLocal[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase
      .from('eventos_locais')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: true })
    setEventos(data || [])
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const eventosPorLocal = (pulsoId: number) => eventos.filter((e) => e.pulso_id === pulsoId)

  const criarEvento = async (pulsoId: number, titulo: string, recorrencia: string, horario: string, descricao: string) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('eventos_locais').insert([{
      pulso_id: pulsoId,
      titulo: titulo.trim(),
      recorrencia: recorrencia.trim(),
      horario: horario.trim() || null,
      descricao: descricao.trim() || null,
      criado_por: session.user.id
    }])
    if (!error) await carregar()
    return { error }
  }

  const removerEvento = async (id: number) => {
    const { error } = await supabase.from('eventos_locais').delete().eq('id', id)
    if (!error) await carregar()
    return { error }
  }

  return { eventos, eventosPorLocal, carregando, criarEvento, removerEvento, recarregar: carregar }
}