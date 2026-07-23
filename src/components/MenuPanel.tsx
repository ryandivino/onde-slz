import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, ShieldCheck, User, Pencil, X, Store, Image, Flag, Mail, BarChart3, Calendar } from 'lucide-react'

export function MenuPanel({
  onClose,
  onAbrirLogin,
  onAbrirEmpresa,
  onAbrirAnuncios,
  onAbrirModeradores,
  onAbrirEventosGerais,
  onAbrirPoliticas,
  onAbrirDenuncias,
  onAbrirPerfil,
  onAbrirEstatisticas,
  modoModerador,
  onToggleModerador
}: {
  onClose: () => void
  onAbrirLogin: () => void
  onAbrirEmpresa: () => void
  onAbrirAnuncios: () => void
  onAbrirModeradores: () => void
  onAbrirEventosGerais: () => void
  onAbrirPoliticas: () => void
  onAbrirDenuncias: () => void
  onAbrirPerfil: () => void
  onAbrirEstatisticas: () => void
  modoModerador: boolean
  onToggleModerador: () => void
}) {
  const { usuarioLogado, perfil, sair, carregandoAuth } = useAuth()

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-start justify-end p-4">
      <div className="w-full max-w-xs bg-surface border border-borderRaw rounded-2xl p-5 space-y-4 shadow-2xl mt-16">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent">MENU</span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {carregandoAuth ? (
          <p className="text-[10px] text-accent/40 font-mono">Carregando...</p>
        ) : usuarioLogado && perfil ? (
          <>
            <button onClick={onAbrirPerfil} className="w-full flex items-center gap-2 text-xs font-mono">
              <div
                className="w-9 h-9 rounded-full bg-background border border-borderRaw flex-shrink-0"
                style={perfil.avatar_url ? {
                  backgroundImage: `url('${perfil.avatar_url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span>@{perfil.apelido}</span>
                  {perfil.is_empresa && (
                    <span className="text-[8px] text-amber-500 border border-amber-500/40 rounded px-1">ESTABELECIMENTO</span>
                  )}
                </div>
                <span className="text-[9px] text-accent/40">Editar perfil</span>
              </div>
              <Pencil size={13} className="text-accent/40 flex-shrink-0" />
            </button>

            {perfil.is_admin && (
              <button
                onClick={onToggleModerador}
                className={`w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border ${modoModerador ? 'bg-amber-500 text-background border-amber-500' : 'border-borderRaw text-accent/70'}`}
              >
                <ShieldCheck size={14} />
                {modoModerador ? 'Modo Moderador Ativo' : 'Ativar Modo Moderador'}
              </button>
            )}

            {perfil.is_admin && modoModerador && (
              <button
                onClick={onAbrirAnuncios}
                className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
              >
                <Image size={14} />
                Gerenciar Anúncios
              </button>
            )}

            {perfil.is_admin && modoModerador && (
              <button
                onClick={onAbrirModeradores}
                className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
              >
                <ShieldCheck size={14} />
                Gerenciar Usuários
              </button>
            )}

            {perfil.is_admin && modoModerador && (
              <button
                onClick={onAbrirEventosGerais}
                className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
              >
                <Calendar size={14} />
                Gerenciar Eventos
              </button>
            )}

            {perfil.is_admin && modoModerador && (
              <button
                onClick={onAbrirDenuncias}
                className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
              >
                <Flag size={14} />
                Ver Denúncias
              </button>
            )}

            {perfil.is_admin && modoModerador && (
              <button
                onClick={onAbrirEstatisticas}
                className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
              >
                <BarChart3 size={14} />
                Estatísticas
              </button>
            )}

            <button
              onClick={async () => { await sair(); onClose() }}
              className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-borderRaw text-red-400"
            >
              <LogOut size={14} />
              Sair
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onAbrirLogin}
              className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg bg-accent text-background"
            >
              <User size={14} />
              Entrar / Criar conta
            </button>

            <button
              onClick={onAbrirEmpresa}
              className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-500"
            >
              <Store size={14} />
              Cadastrar estabelecimento
            </button>
          </>
        )}

        <a
          href="mailto:suporte.onde@outlook.com.br?subject=Suporte%20ONDE"
          className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-borderRaw text-accent/50"
        >
          <Mail size={14} />
          Suporte
        </a>

        <button
          onClick={onAbrirPoliticas}
          className="w-full flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest py-2.5 px-3 rounded-lg border border-borderRaw text-accent/50"
        >
          <ShieldCheck size={14} />
          Políticas e Diretrizes
        </button>
      </div>
    </div>
  )
}