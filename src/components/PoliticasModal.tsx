import React from 'react'
import { X } from 'lucide-react'

// Popup só de consulta — não bloqueia nada. O aceite de verdade acontece
// no momento da criação de conta (ver checkbox no LoginScreen/EmpresaScreen),
// não mais toda vez que o app abre.
export function PoliticasPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[10001] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent">POLÍTICAS E DIRETRIZES</span>
          <button type="button" onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        <div className="text-xs text-accent/70 space-y-3 overflow-y-auto flex-1 pr-1">
          <p><strong>1. O que é o ONDE.</strong> Uma plataforma colaborativa para descobrir e compartilhar o que está acontecendo na cidade em tempo real, através de publicações de usuários, eventos e locais curados.</p>
          <p><strong>2. Conteúdo publicado.</strong> Você é responsável pelo que publica. Não são permitidos discurso de ódio, assédio, conteúdo ilegal, spam ou desinformação. Publicações podem ser removidas sem aviso prévio, e contas que violem essas regras de forma grave ou repetida podem ser suspensas.</p>
          <p><strong>3. Localização.</strong> O app usa sua localização para exibir sua posição no mapa e permitir publicações geolocalizadas. Você pode negar essa permissão, mas partes do app não vão funcionar corretamente.</p>
          <p><strong>4. Publicações anônimas.</strong> Mesmo posts marcados como anônimos ficam vinculados internamente à sua conta, por segurança, o anonimato é só perante outros usuários.</p>
          <p><strong>5. Contas.</strong> É necessário estar logado para publicar. Um usuário não pode se passar por outra pessoa ou estabelecimento.</p>
          <p><strong>6. Curtidas, seguidores e visualizações.</strong> Quem você segue e quem te segue é informação pública, visível a qualquer pessoa no seu perfil. Quando você publica um AGORA, quem visualizou e curtiu aquela publicação fica visível pra você, como autor, as demais pessoas não veem essa lista.</p>
          <p><strong>7. Limites de uso.</strong> Algumas ações (como publicações no AGORA) têm um limite diário, pra manter a qualidade do que é compartilhado no app.</p>
          <p><strong>8. Alterações.</strong> Essas diretrizes podem mudar conforme o app evolui. Alterações relevantes serão comunicadas.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs flex-shrink-0"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}