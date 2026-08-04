import { DICIONARIO_VIBES } from './dicionarioVibes'
import type { Categoria, PalavraComPeso } from './dicionarioVibes'
import { SINONIMOS } from './sinonimosVibes'

export type { Categoria, PalavraComPeso }
export type ResultadoVibe = { categoria: Categoria; pontuacao: number }
export type DicionarioExtra = Partial<Record<Exclude<Categoria, 'OUTROS'>, PalavraComPeso[]>>

const PALAVRAS_NEGACAO = ['não', 'nao', 'nunca', 'nem', 'sem', 'jamais']
const JANELA_NEGACAO = 3

function expandirComSinonimos(palavras: PalavraComPeso[]): PalavraComPeso[] {
  const expandido: PalavraComPeso[] = [...palavras]
  for (const { palavra, peso } of palavras) {
    const sinonimos = SINONIMOS[palavra]
    if (sinonimos) for (const sin of sinonimos) expandido.push({ palavra: sin, peso })
  }
  return expandido
}

function estaNegada(tokens: string[], indiceMatch: number): boolean {
  const inicio = Math.max(0, indiceMatch - JANELA_NEGACAO)
  for (let i = inicio; i < indiceMatch; i++) {
    if (PALAVRAS_NEGACAO.includes(tokens[i])) return true
  }
  return false
}

export function interpretarVibe(texto: string, dicionarioExtra?: DicionarioExtra): ResultadoVibe[] {
  const textoNormalizado = texto.trim().toLowerCase().replace(/[.,!?;:]/g, '')
  if (!textoNormalizado) return []

  const tokens = textoNormalizado.split(/\s+/)
  const resultado: ResultadoVibe[] = []

  for (const categoria of Object.keys(DICIONARIO_VIBES) as Exclude<Categoria, 'OUTROS'>[]) {
    let pontuacao = 0
    const palavras = expandirComSinonimos([...DICIONARIO_VIBES[categoria], ...(dicionarioExtra?.[categoria] || [])])

    for (const { palavra, peso } of palavras) {
      if (palavra.includes(' ')) {
        if (textoNormalizado.includes(palavra)) pontuacao += peso
        continue
      }
      const indice = tokens.indexOf(palavra)
      if (indice === -1) continue
      pontuacao += estaNegada(tokens, indice) ? -peso : peso
    }

    if (pontuacao > 0) resultado.push({ categoria, pontuacao })
  }

  return resultado.sort((a, b) => b.pontuacao - a.pontuacao)
}

export function categoriaMaisProvavel(texto: string, dicionarioExtra?: DicionarioExtra): Categoria | null {
  const resultado = interpretarVibe(texto, dicionarioExtra)
  return resultado.length > 0 ? resultado[0].categoria : null
}

export function categoriasAmbiguas(resultado: ResultadoVibe[], limite = 3, razaoMinima = 0.65): Categoria[] {
  if (resultado.length === 0) return []
  const maiorPontuacao = resultado[0].pontuacao
  return resultado
    .filter((r) => r.pontuacao >= maiorPontuacao * razaoMinima)
    .slice(0, limite)
    .map((r) => r.categoria)
}

// Decide se o resultado local já é confiável o suficiente, ou se vale a
// pena escalar pra IA de verdade (Gemini) — é o coração da arquitetura em
// cascata: só gasta cota gratuita quando o resultado local é fraco/incerto.
export function confiancaBaixa(resultado: ResultadoVibe[]): boolean {
  if (resultado.length === 0) return true
  const top = resultado[0].pontuacao
  const segundo = resultado[1]?.pontuacao || 0
  return top < 3 || (segundo > 0 && top - segundo < 1)
}