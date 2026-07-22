import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useSeguidores(perfilId: string | null) {
  const { session } = useAuth()
  const [totalSeguidores, setTotalSeguidores] = useState(0)
  const [totalSeguindo, setTotalSeguindo] = useState(0)
  const [euSigo, setEuSigo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (!perfilId) return
    setCarregando(true)

    const [{ count: seguidores }, { count: seguindo }] = await Promise.all([
      supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', perfilId),
      supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor_id', perfilId)
    ])
    setTotalSeguidores(seguidores || 0)
    setTotalSeguindo(seguindo || 0)

    if (session?.user && session.user.id !== perfilId) {
      const { data } = await supabase
        .from('seguidores')
        .select('id')
        .eq('seguidor_id', session.user.id)
        .eq('seguido_id', perfilId)
        .maybeSingle()
      setEuSigo(!!data)
    }

    setCarregando(false)
  }, [perfilId, session?.user?.id])

  useEffect(() => { carregar() }, [carregar])

  const alternarSeguir = async () => {
    if (!session?.user || !perfilId || session.user.id === perfilId) return

    if (euSigo) {
      setEuSigo(false)
      setTotalSeguidores((t) => Math.max(0, t - 1))
      await supabase.from('seguidores').delete().eq('seguidor_id', session.user.id).eq('seguido_id', perfilId)
    } else {
      setEuSigo(true)
      setTotalSeguidores((t) => t + 1)
      await supabase.from('seguidores').insert([{ seguidor_id: session.user.id, seguido_id: perfilId }])
    }
  }

  return { totalSeguidores, totalSeguindo, euSigo, carregando, alternarSeguir }
}