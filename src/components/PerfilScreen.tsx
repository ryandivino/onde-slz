import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useEmpresa } from '../hooks/useEmpresa'
import { useSeguidores } from '../hooks/useSeguidores'
import { ListaConexoesModal } from './ListaConexoesModal'
import { X, Camera, Pencil, Check } from 'lucide-react'
import { AtributosEstabelecimento } from './AtributosEstabelecimento'
import type { Atributos } from './AtributosEstabelecimento'

export function PerfilScreen({ onClose }: { onClose: () => void }) {
  const { perfil, enviarAvatar, atualizarBio, atualizarApelido } = useAuth()
  const { empresa, atualizarEmpresa } = useEmpresa()
  const { totalSeguidores, totalSeguindo } = useSeguidores(perfil?.id ?? null)
  const [listaAberta, setListaAberta] = useState<'seguindo' | 'seguidores' | null>(null)
  const inputAvatarRef = useRef<HTMLInputElement>(null)

  const [enviandoAvatar, setEnviandoAvatar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const [editandoApelido, setEditandoApelido] = useState(false)
  const [novoApelido, setNovoApelido] = useState('')

  const [bio, setBio] = useState('')
  const [salvandoBio, setSalvandoBio] = useState(false)

  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [site, setSite] = useState('')
  const [horario, setHorario] = useState('')
  const [endereco, setEndereco] = useState('')
  const [atributos, setAtributos] = useState<Atributos>({})
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false)

  useEffect(() => { setBio(perfil?.bio || '') }, [perfil?.bio])
  useEffect(() => {
    if (empresa) {
      setNomeEstabelecimento(empresa.nome_estabelecimento || '')
      setTelefone(empresa.telefone || '')
      setInstagram(empresa.instagram || '')
      setSite(empresa.site || '')
      setHorario(empresa.horario_funcionamento || '')
      setEndereco(empresa.endereco || '')
      setAtributos(empresa.atributos || {})
    }
  }, [empresa])

  const avisar = (msg: string, ehErro = false) => {
    setErro(ehErro ? msg : null)
    setSucesso(ehErro ? null : msg)
    setTimeout(() => { setErro(null); setSucesso(null) }, 3000)
  }

  const lidarComAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setEnviandoAvatar(true)
    const { error } = await enviarAvatar(arquivo)
    setEnviandoAvatar(false)
    if (error) avisar(error.message, true)
    else avisar('Foto atualizada!')
    if (inputAvatarRef.current) inputAvatarRef.current.value = ''
  }

  const iniciarEdicaoApelido = () => {
    setNovoApelido(perfil?.apelido || '')
    setEditandoApelido(true)
  }

  const salvarApelido = async () => {
    const { error } = await atualizarApelido(novoApelido)
    if (error) { avisar(error.message, true); return }
    setEditandoApelido(false)
    avisar('@ atualizado!')
  }

  const salvarBio = async () => {
    setSalvandoBio(true)
    const { error } = await atualizarBio(bio)
    setSalvandoBio(false)
    if (error) avisar(error.message, true)
    else avisar('Bio salva!')
  }

  const salvarEmpresa = async () => {
    setSalvandoEmpresa(true)
    const { error } = await atualizarEmpresa({
      nome_estabelecimento: nomeEstabelecimento.trim(),
      telefone: telefone.trim() || null,
      instagram: instagram.trim() || null,
      site: site.trim() || null,
      horario_funcionamento: horario.trim() || null,
      endereco: endereco.trim() || null,
      atributos
    })
    setSalvandoEmpresa(false)
    if (error) avisar(error.message, true)
    else avisar('Dados do estabelecimento salvos!')
  }

  if (!perfil) return null

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-borderRaw rounded-2xl p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-borderRaw/40 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-accent">MEU PERFIL</span>
          <button onClick={onClose} className="text-accent/40 hover:text-accent"><X size={16} /></button>
        </div>

        {erro && <div className="text-[10px] text-red-400">{erro}</div>}
        {sucesso && <div className="text-[10px] text-green-400">{sucesso}</div>}

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-background border-2 border-borderRaw"
              style={perfil.avatar_url ? {
                backgroundImage: `url('${perfil.avatar_url}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : undefined}
            />
            <label className="absolute bottom-0 right-0 bg-accent rounded-full p-1.5 cursor-pointer">
              <Camera size={12} className="text-background" />
              <input ref={inputAvatarRef} type="file" accept="image/*" onChange={lidarComAvatar} className="hidden" />
            </label>
          </div>
          {enviandoAvatar && <span className="text-[9px] text-accent/40">Enviando...</span>}
        </div>

        {/* @ */}
        {editandoApelido ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={novoApelido}
              onChange={(e) => setNovoApelido(e.target.value)}
              className="flex-1 bg-background border border-borderRaw rounded-lg p-2 text-xs font-mono"
              autoFocus
            />
            <button onClick={salvarApelido} className="text-green-400"><Check size={16} /></button>
            <button onClick={() => setEditandoApelido(false)} className="text-red-400"><X size={16} /></button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm font-mono">
            <span>@{perfil.apelido}</span>
            <button onClick={iniciarEdicaoApelido} className="text-accent/40 hover:text-accent"><Pencil size={12} /></button>
            {perfil.is_empresa && (
              <span className="text-[8px] text-amber-500 border border-amber-500/40 rounded px-1">ESTABELECIMENTO</span>
            )}
          </div>
        )}

        {/* Seguindo/Seguidores — clicáveis, abrem a lista */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-accent/50 border-y border-borderRaw/20 py-2">
          <button onClick={() => setListaAberta('seguidores')} className="hover:text-accent">{totalSeguidores} seguidor{totalSeguidores !== 1 ? 'es' : ''}</button>
          <button onClick={() => setListaAberta('seguindo')} className="hover:text-accent">{totalSeguindo} seguindo</button>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-accent/40 uppercase tracking-widest">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Fale um pouco sobre você..."
            maxLength={160}
            className="w-full h-20 bg-background border border-borderRaw rounded-lg p-2 text-xs"
          />
          <button onClick={salvarBio} disabled={salvandoBio} className="w-full bg-accent text-background font-bold py-2 uppercase rounded-lg text-[10px]">
            {salvandoBio ? 'SALVANDO...' : 'SALVAR BIO'}
          </button>
        </div>

        {/* Campos extras de empresa */}
        {perfil.is_empresa && (
          <div className="space-y-2 border-t border-borderRaw/20 pt-4">
            <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest">Dados do estabelecimento</span>
            <input type="text" value={nomeEstabelecimento} onChange={(e) => setNomeEstabelecimento(e.target.value)} placeholder="Nome do estabelecimento" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@ do Instagram" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Site (opcional)" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Horário de funcionamento" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />
            <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="w-full bg-background border border-borderRaw rounded-lg p-2 text-xs" />

            <AtributosEstabelecimento atributos={atributos} onChange={setAtributos} />

            <button onClick={salvarEmpresa} disabled={salvandoEmpresa} className="w-full bg-amber-500 text-background font-bold py-2 uppercase rounded-lg text-[10px]">
              {salvandoEmpresa ? 'SALVANDO...' : 'SALVAR DADOS DO ESTABELECIMENTO'}
            </button>
          </div>
        )}
      </div>

      {listaAberta && perfil && (
        <ListaConexoesModal perfilId={perfil.id} tipo={listaAberta} onClose={() => setListaAberta(null)} />
      )}
    </div>
  )
}