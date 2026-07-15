// supabase/functions/resolver-link-mapa/index.ts
// Edge Function gratuita (dentro do plano free do Supabase).
// Recebe um link curto (ex: maps.app.goo.gl/xxxx) e devolve o link final
// depois do redirecionamento, de onde o cliente extrai a coordenada.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Link inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const resposta = await fetch(url, { method: 'GET', redirect: 'follow' })

    return new Response(JSON.stringify({ finalUrl: resposta.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (erro) {
    return new Response(JSON.stringify({ error: 'Não foi possível resolver o link.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})