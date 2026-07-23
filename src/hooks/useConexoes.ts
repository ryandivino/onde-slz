import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type PerfilBasico = { id: string; apelido: string }

export function useConexoes() {
  const { session } = useAuth()
  const meuId = session?.user.id

  const [seguindo, setSeguindo] = useState<PerfilBasico[]>([])
  const [seguidores, setSeguidores] = useState<PerfilBasico[]>([])
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (!meuId) { setSeguindo([]); setSeguidores([]); return }
    setCarregando(true)

    const [{ data: linhasSeguindo }, { data: linhasSeguidores }] = await Promise.all([
      supabase.from('seguidores').select('seguido_id').eq('seguidor_id', meuId),
      supabase.from('seguidores').select('seguidor_id').eq('seguido_id', meuId)
    ])

    const idsSeguindo = (linhasSeguindo || []).map((r) => r.seguido_id)
    const idsSeguidores = (linhasSeguidores || []).map((r) => r.seguidor_id)
    const idsUnicos = [...new Set([...idsSeguindo, ...idsSeguidores])]

    let perfis: PerfilBasico[] = []
    if (idsUnicos.length > 0) {
      const { data } = await supabase.from('profiles').select('id, apelido').in('id', idsUnicos)
      perfis = data || []
    }
    const mapa = new Map(perfis.map((p) => [p.id, p]))

    setSeguindo(idsSeguindo.map((id) => mapa.get(id) || { id, apelido: '???' }))
    setSeguidores(idsSeguidores.map((id) => mapa.get(id) || { id, apelido: '???' }))
    setCarregando(false)
  }, [meuId])

  useEffect(() => { carregar() }, [carregar])

  const idsSeguindoSet = new Set(seguindo.map((p) => p.id))
  const idsSeguidoresSet = new Set(seguidores.map((p) => p.id))
  const mutuos = seguindo.filter((p) => idsSeguidoresSet.has(p.id))

  const buscarUsuarios = async (termo: string): Promise<PerfilBasico[]> => {
    if (!termo.trim() || !meuId) return []
    const { data } = await supabase
      .from('profiles')
      .select('id, apelido')
      .ilike('apelido', `%${termo.trim()}%`)
      .neq('id', meuId)
      .limit(10)
    return data || []
  }

  const seguir = async (id: string) => {
    if (!meuId) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('seguidores').insert([{ seguidor_id: meuId, seguido_id: id }])
    if (!error) await carregar()
    return { error }
  }

  const deixarDeSeguir = async (id: string) => {
    if (!meuId) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('seguidores').delete().eq('seguidor_id', meuId).eq('seguido_id', id)
    if (!error) await carregar()
    return { error }
  }

  return {
    seguindo,
    seguidores,
    mutuos,
    mutuosIds: mutuos.map((p) => p.id),
    carregando,
    buscarUsuarios,
    seguir,
    deixarDeSeguir,
    jaSigo: (id: string) => idsSeguindoSet.has(id),
    ehMutuo: (id: string) => idsSeguindoSet.has(id) && idsSeguidoresSet.has(id),
    recarregar: carregar
  }
}