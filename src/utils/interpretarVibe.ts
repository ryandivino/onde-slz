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

// Quando duas ou mais categorias pontuam próximo uma da outra (ex: "date"
// bate quase igual em RESTAURANTES e BARES), não faz sentido cravar só uma
// como "a resposta certa" — essa função devolve todas as que estão dentro
// de uma margem da líder, em ordem, até um limite.
export function categoriasAmbiguas(resultado: ResultadoVibe[], limite = 3, razaoMinima = 0.65): Categoria[] {
  if (resultado.length === 0) return []
  const maiorPontuacao = resultado[0].pontuacao
  return resultado
    .filter((r) => r.pontuacao >= maiorPontuacao * razaoMinima)
    .slice(0, limite)
    .map((r) => r.categoria)
}