import React from 'react'
import logo from '../assets/logo.png'
import mementoLogo from '../assets/mementoLogo.png'

export function LoadingScreen({ onIniciar }: { onIniciar: () => void }) {
  return (
    <div
      onClick={onIniciar}
      className="fixed inset-0 bg-background z-[10000] flex flex-col items-center justify-center gap-6 cursor-pointer select-none"
    >
      <img src={logo} alt="ONDE" className="w-16 h-16 animate-pulse" />
      <span className="text-xs font-mono text-accent/60 tracking-widest">
        Clique em qualquer lugar para iniciar.
      </span>

      <div className="absolute bottom-8 flex items-center gap-1.5 text-accent/30">
        <span className="text-[9px] font-mono uppercase tracking-widest">by</span>
        <img src={mementoLogo} alt="Memento" className="h-3 opacity-60" />
      </div>
    </div>
  )
}