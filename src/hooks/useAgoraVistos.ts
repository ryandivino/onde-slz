import { useState, useEffect, useCallback } from 'react'

const CHAVE = 'onde_agora_vistos'

function lerVistos(): Set<number> {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? new Set(JSON.parse(bruto)) : new Set()
  } catch {
    return new Set()
  }
}

export function useAgoraVistos() {
  const [vistos, setVistos] = useState<Set<number>>(() => lerVistos())

  useEffect(() => { setVistos(lerVistos()) }, [])

  const marcarComoVisto = useCallback((id: number) => {
    setVistos((atual) => {
      if (atual.has(id)) return atual
      const novo = new Set(atual).add(id)
      try { localStorage.setItem(CHAVE, JSON.stringify(Array.from(novo))) } catch {}
      return novo
    })
  }, [])

  return { vistos, marcarComoVisto }
}