import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Camera, User } from 'lucide-react'

export function OnboardingPerfil() {
  const { perfil, enviarAvatar, atualizarBio, concluirOnboarding } = useAuth()
  const [arquivoAvatar, setArquivoAvatar] = useState<File | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const lidarComArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setArquivoAvatar(arquivo)
    setPreviewAvatar(URL.createObjectURL(arquivo))
  }

  const salvarESeguir = async () => {
    setErro(null)
    setSalvando(true)

    if (arquivoAvatar) {
      const { error } = await enviarAvatar(arquivoAvatar)
      if (error) { setErro(error.message); setSalvando(false); return }
    }

    if (bio.trim()) {
      const { error } = await atualizarBio(bio)
      if (error) { setErro(error.message); setSalvando(false); return }
    }

    await concluirOnboarding()
    setSalvando(false)
  }

  const pular = async () => {
    await concluirOnboarding()
  }

  return (
    <div className="fixed inset-0 bg-background z-[10001] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-borderRaw rounded-2xl p-6 space-y-4 text-center">
        <span className="text-[10px] font-mono tracking-widest text-accent block">
          BEM-VINDO(A), @{perfil?.apelido}
        </span>
        <p className="text-xs text-accent/60">
          Quer já colocar uma foto e uma bio? É rapidinho — mas se não quiser agora, pode pular sem problema.
        </p>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}

        <label className="cursor-pointer flex flex-col items-center gap-2 mx-auto w-fit">
          <div
            className="w-20 h-20 rounded-full bg-background border border-borderRaw flex items-center justify-center overflow-hidden"
            style={previewAvatar ? { backgroundImage: `url('${previewAvatar}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!previewAvatar && <User size={28} className="text-accent/30" />}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono text-accent/60">
            <Camera size={12} /> Escolher foto
          </span>
          <input type="file" accept="image/*" onChange={lidarComArquivo} className="hidden" />
        </label>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Uma bio curta sobre você (opcional)"
          maxLength={140}
          className="w-full h-20 bg-background border border-borderRaw rounded-lg p-2 text-xs"
        />

        <div className="flex gap-2">
          <button
            onClick={pular}
            disabled={salvando}
            className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg border border-borderRaw text-accent/60"
          >
            Pular
          </button>
          <button
            onClick={salvarESeguir}
            disabled={salvando}
            className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2.5 rounded-lg bg-accent text-background font-bold"
          >
            {salvando ? 'SALVANDO...' : 'SALVAR E CONTINUAR'}
          </button>
        </div>
      </div>
    </div>
  )
}