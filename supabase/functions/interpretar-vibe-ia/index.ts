// @ts-nocheck
// supabase/functions/interpretar-vibe-ia/index.ts
// Só é chamada como ÚLTIMO recurso (quando o dicionário local + o que já foi
// aprendido não reconhecem nada) — pensado pra nunca gastar a cota gratuita
// do Gemini sem necessidade.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { texto } = await req.json()

    if (!texto || typeof texto !== 'string' || texto.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Texto inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chave do Gemini não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = `Classifique a frase abaixo em EXATAMENTE uma destas categorias: BARES, RESTAURANTES, CULTURA, OUTROS.
Responda só com o nome da categoria, em maiúsculas, sem mais nenhuma palavra.

Frase: "${texto}"`

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )

    const dados = await resposta.json()
    const textoResposta: string = dados?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || ''

    const categoriasValidas = ['BARES', 'RESTAURANTES', 'CULTURA', 'OUTROS']
    const categoria = categoriasValidas.find((c) => textoResposta.includes(c)) || 'OUTROS'

    return new Response(JSON.stringify({ categoria }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (erro) {
    return new Response(JSON.stringify({ error: 'Não foi possível interpretar agora.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})