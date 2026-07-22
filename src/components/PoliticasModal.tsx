import React, { useState } from 'react'

const CHAVE_ACEITE = 'onde_aceitou_politicas_v1'

export function politicasJaAceitas(): boolean {
  try {
    return localStorage.getItem(CHAVE_ACEITE) === 'true'
  } catch {
    return false
  }
}

export function PoliticasModal({ onAceitar }: { onAceitar: () => void }) {
  const [marcado, setMarcado] = useState(false)

  const aceitar = () => {
    try { localStorage.setItem(CHAVE_ACEITE, 'true') } catch {}
    onAceitar()
  }

  return (
    <div className="fixed inset-0 bg-background z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        <span className="text-[10px] font-mono tracking-widest text-accent">POLÍTICAS E DIRETRIZES</span>

        <div className="text-xs text-accent/70 space-y-3 overflow-y-auto flex-1 pr-1">
          <p><strong>1. O que é o ONDE.</strong> Uma plataforma colaborativa para descobrir e compartilhar o que está acontecendo na cidade em tempo real, através de publicações de usuários, estabelecimentos cadastrados ou locais curados.</p>
          <p><strong>2. Conteúdo publicado.</strong> Você é responsável pelo que publica. Não são permitidos discurso de ódio, assédio, conteúdo ilegal, spam ou desinformação. Publicações podem ser removidas e/ou contas podem ser suspensas sem aviso prévio.</p>
          <p><strong>3. Localização.</strong> O app usa sua localização para exibir sua posição no mapa, apenas para você, a menos que você faça publicações geolocalizadas. Você pode negar essa permissão, mas partes do app não vão funcionar corretamente.</p>
          <p><strong>4. Publicações anônimas.</strong> Mesmo posts marcados como anônimos ficam vinculados internamente à sua conta, por segurança, o anonimato é só perante outros usuários.</p>
          <p><strong>5. Contas.</strong> É necessário estar logado para publicar. Um usuário não pode se passar por outra pessoa ou estabelecimento.</p>
          <p><strong>6. Alterações.</strong> Essas diretrizes podem sofrer alterações no futuro. Mudanças relevantes serão comunicadas.</p>
        </div>

        <label className="flex items-center gap-2 text-[10px] font-mono text-accent/70 flex-shrink-0">
          <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />
          Li e aceito as políticas e diretrizes do ONDE
        </label>

        <button
          onClick={aceitar}
          disabled={!marcado}
          className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs disabled:opacity-30 flex-shrink-0"
        >
          Aceitar e continuar
        </button>
      </div>
    </div>
  )
}