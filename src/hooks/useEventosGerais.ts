import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export type EventoGeral = {
  id: number
  titulo: string
  descricao: string | null
  categoria: string
  data_hora: string
  data_hora_fim: string | null
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
    const agora = new Date().toISOString()
    // Evento de um dia só: some quando o início (data_hora) passa, como
    // já era. Evento de vários dias: continua visível até o FIM
    // (data_hora_fim), não só até o início.
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .or(`data_hora_fim.gte.${agora},and(data_hora_fim.is.null,data_hora.gte.${agora})`)
      .order('data_hora', { ascending: true })

    if (!error && data) {
      const idsUnicos = [...new Set(data.map((e) => e.user_id).filter(Boolean))]
      let idsBanidos = new Set<string>()

      if (idsUnicos.length > 0) {
        const { data: perfis } = await supabase.from('profiles').select('id, banido').in('id', idsUnicos)
        idsBanidos = new Set((perfis || []).filter((p) => p.banido).map((p) => p.id))
      }

      setEventos(data.filter((e) => !e.user_id || !idsBanidos.has(e.user_id)))
    }
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