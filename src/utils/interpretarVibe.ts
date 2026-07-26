// Só a LÓGICA de interpretação fica aqui — o conteúdo curado à mão mora em
// dicionarioVibes.ts. Além dele, essa função também aceita um "dicionário
// extra" (palavras aprendidas automaticamente com o uso real do app — ver
// useAprendizadoVibe.ts) — os dois se somam na hora de pontuar.

import { DICIONARIO_VIBES } from './dicionarioVibes'
import type { Categoria, PalavraComPeso } from './dicionarioVibes'

export type { Categoria, PalavraComPeso }
export type ResultadoVibe = { categoria: Categoria; pontuacao: number }
export type DicionarioExtra = Partial<Record<Exclude<Categoria, 'OUTROS'>, PalavraComPeso[]>>

export function interpretarVibe(texto: string, dicionarioExtra?: DicionarioExtra): ResultadoVibe[] {
  const textoNormalizado = texto.trim().toLowerCase()
  if (!textoNormalizado) return []

  const resultado: ResultadoVibe[] = []

  for (const categoria of Object.keys(DICIONARIO_VIBES) as Exclude<Categoria, 'OUTROS'>[]) {
    let pontuacao = 0
    const palavras = [...DICIONARIO_VIBES[categoria], ...(dicionarioExtra?.[categoria] || [])]
    for (const { palavra, peso } of palavras) {
      if (textoNormalizado.includes(palavra)) pontuacao += peso
    }
    if (pontuacao > 0) resultado.push({ categoria, pontuacao })
  }

  return resultado.sort((a, b) => b.pontuacao - a.pontuacao)
}

export function categoriaMaisProvavel(texto: string, dicionarioExtra?: DicionarioExtra): Categoria | null {
  const resultado = interpretarVibe(texto, dicionarioExtra)
  return resultado.length > 0 ? resultado[0].categoria : null
}