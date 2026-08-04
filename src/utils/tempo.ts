export function formatarTempoRelativo(createdAt: string): string {
  const agora = Date.now()
  const criado = new Date(createdAt).getTime()
  const diffMs = agora - criado
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin}m atrás`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h atrás`

  const diffDias = Math.floor(diffH / 24)
  return `há ${diffDias}d atrás`
}

export function formatarPeriodoEvento(dataHora: string, dataHoraFim?: string | null): string {
  const opcoes: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
  const inicio = new Date(dataHora).toLocaleString('pt-BR', opcoes)
  if (!dataHoraFim) return inicio
  const fim = new Date(dataHoraFim).toLocaleString('pt-BR', opcoes)
  return `${inicio} até ${fim}`
}