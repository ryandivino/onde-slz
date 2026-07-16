// Extrai coordenadas de um link de mapa colado pelo usuário (Google Maps ou
// Apple Maps). Isso não acessa nada "por trás" de nenhum serviço — só lê o
// próprio texto do link que o usuário colou, que já contém a coordenada.

export function extrairCoordenadasDoLink(url: string): { lat: number; lng: number } | null {
  const tentativas = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // Google: ponto exato marcado (mais preciso)
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // Google: centro da visualização
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // Google: parâmetro q
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // Apple Maps
    /coordinate=(-?\d+\.\d+),(-?\d+\.\d+)/ // Apple Maps (variação)
  ]

  for (const regex of tentativas) {
    const match = url.match(regex)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
    }
  }

  return null
}

// Links curtos (maps.app.goo.gl, goo.gl/maps) não têm a coordenada visível —
// precisam ser "resolvidos" (seguir o redirecionamento) do lado do servidor.
export function ehLinkCurto(url: string): boolean {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/.test(url)
}

// Tenta extrair o nome do local a partir de um link de lugar específico do
// Google Maps (ex: .../maps/place/Bar+do+Fulano/@...). Só funciona quando o
// link é de um lugar buscado por nome — links genéricos de área não têm isso.
export function extrairNomeDoLink(url: string): string | null {
  const match = url.match(/maps\/place\/([^/@]+)/)
  if (!match) return null

  try {
    const nomeDecodificado = decodeURIComponent(match[1].replace(/\+/g, ' '))
    return nomeDecodificado.trim() || null
  } catch {
    return null
  }
}