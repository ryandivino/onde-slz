import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export type EventoGeral = {
  id: number
  titulo: string
  descricao: string | null
  categoria: string
  data_hora: string
  lat: number
  lng: number
  endereco: string | null
  link_ingresso: string | null
  image_url: string | null
  user_id: string
  created_at: string
}

export function useEventosGerais() {
  const [eventos, setEventos] = useState<EventoGeral[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })

    if (!error && data) setEventos(data)
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const removerEvento = async (id: number) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (!error) await carregar()
    return { error }
  }

  return { eventos, carregando, removerEvento, recarregar: carregar }
}