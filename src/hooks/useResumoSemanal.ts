import { useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

const CHAVE_LOCALSTORAGE = 'onde_ultimo_resumo_semanal'
const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000

// Gera o resumo semanal de forma "lazy": não existe cron nenhum — na prática,
// isso roda uma vez por semana pra cada usuário, na primeira vez que ele abre
// o app depois de 7 dias do último resumo (controlado no navegador dele).
export function useResumoSemanal(amigosIds: string[], relatos: any[], totalEventosAtivos: number) {
  const { session, usuarioLogado } = useAuth()

  useEffect(() => {
    if (!usuarioLogado || !session?.user) return

    const chave = `${CHAVE_LOCALSTORAGE}_${session.user.id}`
    const ultimo = localStorage.getItem(chave)
    const agora = Date.now()

    if (ultimo && agora - parseInt(ultimo, 10) < UMA_SEMANA_MS) return

    const seteDiasAtras = agora - UMA_SEMANA_MS
    const postsDeAmigosNaSemana = relatos.filter(
      (r) => !r.is_fixed && amigosIds.includes(r.user_id) && new Date(r.created_at).getTime() > seteDiasAtras
    ).length

    // Só gera se tiver algo relevante pra contar — evita notificação vazia/sem graça
    if (postsDeAmigosNaSemana === 0 && totalEventosAtivos === 0) {
      localStorage.setItem(chave, String(agora))
      return
    }

    const partes: string[] = []
    if (postsDeAmigosNaSemana > 0) {
      partes.push(`seus amigos fizeram ${postsDeAmigosNaSemana} rolê${postsDeAmigosNaSemana > 1 ? 's' : ''} essa semana`)
    }
    if (totalEventosAtivos > 0) {
      partes.push(`${totalEventosAtivos} evento${totalEventosAtivos > 1 ? 's' : ''} recorrente${totalEventosAtivos > 1 ? 's' : ''} rolando por aí`)
    }

    supabase.from('notificacoes').insert([{
      destinatario_id: session.user.id,
      tipo: 'resumo_semanal',
      titulo: 'Seu resumo da semana',
      mensagem: partes.join(' • ')
    }]).then(({ error }) => {
      if (!error) localStorage.setItem(chave, String(agora))
    })
  }, [usuarioLogado, session?.user?.id, amigosIds.length, relatos.length, totalEventosAtivos])
}