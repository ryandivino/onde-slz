import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type Anuncio = {
  id: number
  image_url: string
  storage_path: string
  ativo: boolean
  created_at: string
}

export function useAnuncios() {
  const { session } = useAuth()
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Erro ao carregar anúncios:', error)
    if (!error && data) setAnuncios(data)
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const anunciosAtivos = useMemo(() => anuncios.filter((a) => a.ativo), [anuncios])

  const publicarAnuncio = async (arquivo: File) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }

    const extensao = arquivo.name.split('.').pop() || 'png'
    const caminho = `${session.user.id}/${Date.now()}.${extensao}`

    const { error: erroUpload } = await supabase.storage.from('anuncios').upload(caminho, arquivo)
    if (erroUpload) return { error: erroUpload }

    const { data: publicUrlData } = supabase.storage.from('anuncios').getPublicUrl(caminho)

    const { error: erroInsert } = await supabase.from('anuncios').insert([
      { image_url: publicUrlData.publicUrl, storage_path: caminho, criado_por: session.user.id }
    ])

    if (erroInsert) return { error: erroInsert }
    await carregar()
    return { error: null }
  }

  const removerAnuncio = async (anuncio: Anuncio) => {
    await supabase.storage.from('anuncios').remove([anuncio.storage_path])
    const { error } = await supabase.from('anuncios').delete().eq('id', anuncio.id)
    if (!error) await carregar()
    return { error }
  }

  const alternarAtivo = async (anuncio: Anuncio) => {
    const { error } = await supabase.from('anuncios').update({ ativo: !anuncio.ativo }).eq('id', anuncio.id)
    if (!error) await carregar()
    return { error }
  }

  return { anuncios, anunciosAtivos, carregando, publicarAnuncio, removerAnuncio, alternarAtivo, recarregar: carregar }
}