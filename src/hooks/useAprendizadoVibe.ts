import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Categoria, DicionarioExtra } from '../utils/interpretarVibe'

// Só usa palavra aprendida que já apareceu um número mínimo de vezes —
// evita que um post isolado e estranho vire "verdade" da busca.
const CONTAGEM_MINIMA = 3

export function useAprendizadoVibe() {
  const [dicionarioAprendido, setDicionarioAprendido] = useState<DicionarioExtra>({})

  useEffect(() => {
    supabase
      .from('vibe_aprendizado')
      .select('categoria, palavra, contagem')
      .gte('contagem', CONTAGEM_MINIMA)
      .then(({ data }) => {
        if (!data) return
        const agrupado: DicionarioExtra = {}
        data.forEach((linha) => {
          const cat = linha.categoria as Exclude<Categoria, 'OUTROS'>
          if (!agrupado[cat]) agrupado[cat] = []
          const peso = Math.min(3, Math.floor(linha.contagem / 3))
          agrupado[cat]!.push({ palavra: linha.palavra, peso })
        })
        setDicionarioAprendido(agrupado)
      })
  }, [])

  return { dicionarioAprendido }
}