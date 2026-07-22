import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useCurtidas(pulsoId: number | null) {
  const { session } = useAuth()
  const [total, setTotal] = useState(0)
  const [euCurti, setEuCurti] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (pulsoId === null) return
    setCarregando(true)

    const { count } = await supabase
      .from('curtidas')
      .select('*', { count: 'exact', head: true })
      .eq('pulso_id', pulsoId)
    setTotal(count || 0)

    if (session?.user) {
      const { data } = await supabase
        .from('curtidas')
        .select('id')
        .eq('pulso_id', pulsoId)
        .eq('user_id', session.user.id)
        .maybeSingle()
      setEuCurti(!!data)
    }

    setCarregando(false)
  }, [pulsoId, session?.user?.id])

  useEffect(() => { carregar() }, [carregar])

  const alternarCurtida = async () => {
    if (!session?.user || pulsoId === null) return

    if (euCurti) {
      setEuCurti(false)
      setTotal((t) => Math.max(0, t - 1))
      await supabase.from('curtidas').delete().eq('pulso_id', pulsoId).eq('user_id', session.user.id)
    } else {
      setEuCurti(true)
      setTotal((t) => t + 1)
      await supabase.from('curtidas').insert([{ pulso_id: pulsoId, user_id: session.user.id }])
    }
  }

  return { total, euCurti, carregando, alternarCurtida }
}