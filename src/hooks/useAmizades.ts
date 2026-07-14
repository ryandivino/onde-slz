import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type PerfilBasico = { id: string; apelido: string }
export type AmigoComAmizade = PerfilBasico & { amizadeId: number }
export type Amizade = {
  id: number
  solicitante_id: string
  destinatario_id: string
  status: 'pendente' | 'aceito'
  created_at: string
}

export function useAmizades() {
  const { session, usuarioLogado } = useAuth()
  const meuId = session?.user.id

  const [amigos, setAmigos] = useState<AmigoComAmizade[]>([])
  const [pedidosRecebidos, setPedidosRecebidos] = useState<(Amizade & { solicitante: PerfilBasico })[]>([])
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (!meuId) { setAmigos([]); setPedidosRecebidos([]); return }
    setCarregando(true)

    // Amizades aceitas onde eu participo (de qualquer lado)
    const { data: aceitas } = await supabase
      .from('amizades')
      .select('id, solicitante_id, destinatario_id, status, created_at')
      .eq('status', 'aceito')
      .or(`solicitante_id.eq.${meuId},destinatario_id.eq.${meuId}`)

    if (aceitas && aceitas.length > 0) {
      const mapaAmizadeIdPorOutroId = new Map(
        aceitas.map((a) => [a.solicitante_id === meuId ? a.destinatario_id : a.solicitante_id, a.id])
      )
      const outrosIds = aceitas.map((a) => (a.solicitante_id === meuId ? a.destinatario_id : a.solicitante_id))
      const { data: perfis } = await supabase.from('profiles').select('id, apelido').in('id', outrosIds)
      setAmigos((perfis || []).map((p) => ({ ...p, amizadeId: mapaAmizadeIdPorOutroId.get(p.id)! })))
    } else {
      setAmigos([])
    }

    // Pedidos pendentes recebidos por mim
    const { data: pendentes } = await supabase
      .from('amizades')
      .select('id, solicitante_id, destinatario_id, status, created_at')
      .eq('status', 'pendente')
      .eq('destinatario_id', meuId)

    if (pendentes && pendentes.length > 0) {
      const solicitanteIds = pendentes.map((p) => p.solicitante_id)
      const { data: perfis } = await supabase.from('profiles').select('id, apelido').in('id', solicitanteIds)
      const mapa = new Map((perfis || []).map((p) => [p.id, p]))
      setPedidosRecebidos(
        pendentes.map((p) => ({ ...p, solicitante: mapa.get(p.solicitante_id) || { id: p.solicitante_id, apelido: '???' } })) as any
      )
    } else {
      setPedidosRecebidos([])
    }

    setCarregando(false)
  }, [meuId])

  useEffect(() => { carregar() }, [carregar])

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

  // Envia pedido; se a outra pessoa já tinha te pedido antes, aceita direto (mútuo)
  const enviarPedido = async (destinatarioId: string) => {
    if (!meuId) return { error: new Error('Não autenticado.') }

    const { data: pedidoInverso } = await supabase
      .from('amizades')
      .select('id, status')
      .eq('solicitante_id', destinatarioId)
      .eq('destinatario_id', meuId)
      .maybeSingle()

    if (pedidoInverso) {
      if (pedidoInverso.status === 'pendente') {
        const { error } = await supabase.from('amizades').update({ status: 'aceito' }).eq('id', pedidoInverso.id)
        if (!error) await carregar()
        return { error }
      }
      return { error: null } // já são amigos
    }

    const { error } = await supabase.from('amizades').insert([
      { solicitante_id: meuId, destinatario_id: destinatarioId, status: 'pendente' }
    ])
    if (!error) await carregar()
    return { error }
  }

  const aceitarPedido = async (amizadeId: number) => {
    const { error } = await supabase.from('amizades').update({ status: 'aceito' }).eq('id', amizadeId)
    if (!error) await carregar()
    return { error }
  }

  const removerOuRejeitar = async (amizadeId: number) => {
    const { error } = await supabase.from('amizades').delete().eq('id', amizadeId)
    if (!error) await carregar()
    return { error }
  }

  return {
    amigos,
    amigosIds: amigos.map((a) => a.id),
    pedidosRecebidos,
    carregando,
    buscarUsuarios,
    enviarPedido,
    aceitarPedido,
    removerOuRejeitar,
    recarregar: carregar
  }
}