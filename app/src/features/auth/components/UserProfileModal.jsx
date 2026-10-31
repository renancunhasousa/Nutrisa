import { useEffect, useRef, useState } from 'react';
import {
  User,
  X,
  Camera,
  Trash2,
  Check,
  ShieldCheck,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../useAuth.js';

const ROLE_LABELS = {
  owner: 'Proprietário(a) / Responsável',
  professional: 'Nutricionista / Especialista',
  receptionist: 'Recepção / Atendimento',
  assistant: 'Assistente Clínico',
  custom: 'Equipe Clínica (Personalizado)',
};

const getInitials = (name = '') => {
  const parts = name
    .replace(/^(dra?\.?|nutri\.?)/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
};

export default function UserProfileModal({ open, onClose }) {
  const { user, currentMember, updateProfile, uploadAvatar } = useAuth();
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);

  const initialName = currentMember?.display_name || currentMember?.displayName || user?.user_metadata?.full_name || '';
  const initialAvatar = currentMember?.avatarUrl || currentMember?.avatar_url || user?.user_metadata?.avatar_url || '';

  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const currentName = currentMember?.display_name || currentMember?.displayName || user?.user_metadata?.full_name || '';
      const currentImg = currentMember?.avatarUrl || currentMember?.avatar_url || user?.user_metadata?.avatar_url || '';
      setDisplayName(currentName);
      setAvatarUrl(currentImg);
      setAvatarFile(null);
      setPreviewUrl('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [open, currentMember, user]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    setErrorMessage('');
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl('');
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Informe seu nome de exibição.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile && typeof uploadAvatar === 'function') {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      }

      if (typeof updateProfile === 'function') {
        await updateProfile({
          displayName: displayName.trim(),
          avatarUrl: finalAvatarUrl || null,
        });
      }

      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMessage(err?.message || 'Falha ao salvar as informações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  const displayedAvatar = previewUrl || avatarUrl;
  const roleName = ROLE_LABELS[currentMember?.role] || 'Membro da Equipe';
  const email = currentMember?.email || user?.email || '';

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="settings-dialog print:hidden backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
      aria-labelledby="user-profile-modal-title"
    >
      <div className="settings-dialog__panel max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-emerald-100/70 bg-gradient-to-r from-emerald-50/80 via-white to-white px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50">
              <User className="size-5" />
            </span>
            <div>
              <h2 id="user-profile-modal-title" className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                Meu Perfil
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Informações de acesso e foto de identificação na clínica.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {errorMessage && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-800">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="size-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Foto de Perfil */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
            <span className="mb-3 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Foto de Perfil
            </span>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                {displayedAvatar ? (
                  <img
                    src={displayedAvatar}
                    alt={displayName || 'Avatar'}
                    className="size-20 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-black text-white shadow-sm ring-2 ring-emerald-500/10">
                    {getInitials(displayName || email)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-file-upload"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <Camera className="size-3.5" />
                    <span>{displayedAvatar ? 'Alterar foto' : 'Enviar foto'}</span>
                  </button>

                  {displayedAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Recomendado: imagem quadrada (JPG, PNG ou WEBP) de até 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Identificação Pessoal */}
          <div className="space-y-4">
            <div>
              <label htmlFor="user-display-name" className="mb-1.5 block text-xs font-bold text-slate-700">
                Nome completo de exibição <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex.: Dra. Maria Silva ou João Souza"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/60"
              />
            </div>

            <div>
              <label htmlFor="user-email-readonly" className="mb-1.5 block text-xs font-bold text-slate-700">
                E-mail de acesso
              </label>
              <div className="relative">
                <input
                  id="user-email-readonly"
                  type="email"
                  disabled
                  value={email}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 pl-9 text-sm font-medium text-slate-600 outline-none cursor-not-allowed"
                />
                <Mail className="size-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                O e-mail é utilizado para login seguro na conta.
              </p>
            </div>

            {/* Cargo / Função Atual */}
            <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Cargo / Nível de Acesso
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <Sparkles className="size-3 text-emerald-600" />
                  {roleName}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Este cargo define quais módulos e atalhos da clínica estão disponíveis para o seu usuário.
              </p>
            </div>
          </div>

          {/* Footer interno */}
          <footer className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-10 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check className="size-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
            </button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
