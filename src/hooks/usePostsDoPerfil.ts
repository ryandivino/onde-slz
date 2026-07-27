import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function usePostsDoPerfil(perfilId: string | null) {
  const [posts, setPosts] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (!perfilId) return
    setCarregando(true)

    const { data } = await supabase
      .from('pulsos')
      .select('*')
      .eq('user_id', perfilId)
      .eq('is_fixed', false)
      .order('created_at', { ascending: false })

    setPosts(data || [])
    setCarregando(false)
  }, [perfilId])

  useEffect(() => { carregar() }, [carregar])

  return { posts, carregando, recarregar: carregar }
}