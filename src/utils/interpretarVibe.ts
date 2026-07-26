// Só a LÓGICA de interpretação fica aqui — o conteúdo (as palavras em si)
// mora em dicionarioVibes.ts, separado de propósito. Não é IA de verdade
// (não chama nenhuma API) — é uma pontuação por palavra-chave, o suficiente
// pra dar a sensação de "o app entendeu" sem custo nenhum.

import { DICIONARIO_VIBES } from './dicionarioVibes'
import type { Categoria } from './dicionarioVibes'

export type { Categoria }
export type ResultadoVibe = { categoria: Categoria; pontuacao: number }

export function interpretarVibe(texto: string): ResultadoVibe[] {
  const textoNormalizado = texto.trim().toLowerCase()
  if (!textoNormalizado) return []

  const resultado: ResultadoVibe[] = []

  for (const categoria of Object.keys(DICIONARIO_VIBES) as Exclude<Categoria, 'OUTROS'>[]) {
    let pontuacao = 0
    for (const { palavra, peso } of DICIONARIO_VIBES[categoria]) {
      if (textoNormalizado.includes(palavra)) pontuacao += peso
    }
    if (pontuacao > 0) resultado.push({ categoria, pontuacao })
  }

  return resultado.sort((a, b) => b.pontuacao - a.pontuacao)
}

export function categoriaMaisProvavel(texto: string): Categoria | null {
  const resultado = interpretarVibe(texto)
  return resultado.length > 0 ? resultado[0].categoria : null
}