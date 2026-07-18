// Usado só pra dar um "chute inicial" de onde centralizar o mapa no
// MapaLocalPicker — a posição final salva é sempre onde o pino fica depois
// do usuário arrastar/confirmar, nunca esse resultado direto.
export async function geocodificarEndereco(endereco: string): Promise<{ lat: number; lng: number } | null> {
  if (!endereco.trim()) return null

  try {
    const enderecoComCidade = `${endereco}, São Luís, Maranhão, Brasil`
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoComCidade)}&countrycodes=br&viewbox=-44.50,-2.20,-44.05,-2.70&bounded=1&limit=1`
    const resp = await fetch(url)
    const dados = await resp.json()

    if (dados.length > 0) {
      return { lat: parseFloat(dados[0].lat), lng: parseFloat(dados[0].lon) }
    }
  } catch {
    // Silencioso de propósito — se não achar, o mapa só fica no centro padrão
    // e o usuário posiciona manualmente, sem nenhuma mensagem de erro.
  }

  return null
}