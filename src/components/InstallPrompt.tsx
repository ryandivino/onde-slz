import React, { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

const CHAVE_DISPENSADO = 'onde_instalar_dispensado'
const ATRASO_MS = 4000 // espera um pouco antes de mostrar, pra não competir com loading/políticas/anúncio

function estaNoIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function estaNoSafari() {
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua)
}

function jaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export function InstallPrompt() {
  const [promptEvento, setPromptEvento] = useState<any>(null)
  const [mostrarPopupIOS, setMostrarPopupIOS] = useState(false)
  const [mostrarPopupIOSOutroNavegador, setMostrarPopupIOSOutroNavegador] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    if (jaInstalado() || localStorage.getItem(CHAVE_DISPENSADO)) return

    const lidarComPrompt = (e: any) => {
      e.preventDefault()
      setPromptEvento(e)
    }
    window.addEventListener('beforeinstallprompt', lidarComPrompt)

    if (estaNoIOS()) {
      if (estaNoSafari()) setMostrarPopupIOS(true)
      else setMostrarPopupIOSOutroNavegador(true)
    }

    const timer = setTimeout(() => setVisivel(true), ATRASO_MS)

    return () => {
      window.removeEventListener('beforeinstallprompt', lidarComPrompt)
      clearTimeout(timer)
    }
  }, [])

  const dispensar = () => {
    localStorage.setItem(CHAVE_DISPENSADO, 'true')
    setDispensado(true)
  }

  const instalarAndroid = async () => {
    if (!promptEvento) return
    promptEvento.prompt()
    await promptEvento.userChoice
    dispensar()
  }

  if (dispensado || jaInstalado() || !visivel) return null
  if (!promptEvento && !mostrarPopupIOS && !mostrarPopupIOSOutroNavegador) return null

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9997] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent flex items-center gap-2">
            <Download size={14} /> INSTALAR O ONDE
          </span>
          <button onClick={dispensar} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {promptEvento && (
          <>
            <p className="text-xs text-accent/70">
              Instale o ONDE na sua tela inicial pra abrir mais rápido, direto, sem precisar do navegador.
            </p>
            <button onClick={instalarAndroid} className="w-full bg-accent text-background font-bold py-3 uppercase rounded-lg text-xs">
              Instalar agora
            </button>
          </>
        )}

        {mostrarPopupIOS && (
          <div className="space-y-2 text-xs text-accent/70">
            <p>Pra instalar o ONDE no seu iPhone, é rapidinho:</p>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>Toque no ícone de <strong>Compartilhar</strong> (o quadrado com a seta pra cima), na barra do Safari</li>
              <li>Role a lista de opções e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior</li>
            </ol>
          </div>
        )}

        {mostrarPopupIOSOutroNavegador && (
          <p className="text-xs text-accent/70">
            No iPhone, só o <strong>Safari</strong> tem permissão da Apple pra instalar apps assim — é uma regra do sistema, não algo que dependa do ONDE. Abre esse link no Safari pra poder instalar.
          </p>
        )}

        <button onClick={dispensar} className="w-full text-[10px] font-mono text-accent/40 text-center underline">
          Agora não
        </button>
      </div>
    </div>
  )
}