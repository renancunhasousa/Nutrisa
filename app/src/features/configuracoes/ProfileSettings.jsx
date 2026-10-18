import { useEffect, useRef, useState } from 'react';
import {
  User,
  X,
  BadgeCheck,
  Award,
  Phone,
  Building2,
  Check,
  Image as ImageIcon,
  PenTool,
  Upload,
  Trash2,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { uploadClinicAsset } from './services/clinicProfileService.js';
import defaultLogo from '../../assets/logo_new.png';
import defaultDraPhoto from '../../assets/dra_isabela.png';

const handleBackdropClick = (event) => {
  if (event.target !== event.currentTarget) return;
  if ('closedBy' in HTMLDialogElement.prototype) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const clickedInside = (
    event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom
  );

  if (!clickedInside) event.currentTarget.close();
};

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5';
const FIELD_CLASS =
  'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';

export default function ProfileSettings({ settings }) {
  const { nutritionist, setNutritionist, activeModal, setActiveModal, saveProfile, profileSaving } = settings;
  const { organizationId } = useAuth();
  const dialogRef = useRef(null);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const marketingPhotoInputRef = useRef(null);
  const isOpen = activeModal === 'profile';
  const [localSaving, setLocalSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingMarketingPhoto, setUploadingMarketingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState(() => ({
    name: '',
    title: '',
    crn: '',
    phone: '',
    email: '',
    clinic: '',
    address: '',
    instagram: '',
    logoUrl: '',
    signatureUrl: '',
    marketingPhotoUrl: '',
    whatsappInstanceName: '',
    whatsappWebhookUrl: '',
    whatsappPhone: '',
    ...nutritionist,
  }));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setForm({
        name: '',
        title: '',
        crn: '',
        phone: '',
        email: '',
        clinic: '',
        address: '',
        instagram: '',
        logoUrl: '',
        signatureUrl: '',
        marketingPhotoUrl: '',
        whatsappInstanceName: '',
        whatsappWebhookUrl: '',
        whatsappPhone: '',
        ...nutritionist,
      });
    }
  }, [isOpen, nutritionist]);

  const closeDialog = () => {
    dialogRef.current?.close();
    setActiveModal(null);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WEBP).');
      return;
    }
    setUploadingLogo(true);
    setErrorMessage('');
    try {
      if (organizationId) {
        const url = await uploadClinicAsset(organizationId, file, 'logo');
        updateField('logoUrl', url);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => updateField('logoUrl', e.target?.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Fallback base64 para logo:', err);
      const reader = new FileReader();
      reader.onload = (e) => updateField('logoUrl', e.target?.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    updateField('logoUrl', '');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSignatureChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido para assinatura (PNG recomendado).');
      return;
    }
    setUploadingSignature(true);
    setErrorMessage('');
    try {
      if (organizationId) {
        const url = await uploadClinicAsset(organizationId, file, 'signature');
        updateField('signatureUrl', url);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => updateField('signatureUrl', e.target?.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Fallback base64 para assinatura:', err);
      const reader = new FileReader();
      reader.onload = (e) => updateField('signatureUrl', e.target?.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingSignature(false);
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  const handleRemoveSignature = () => {
    updateField('signatureUrl', '');
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  const handleMarketingPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido para foto de marketing (PNG ou JPG).');
      return;
    }
    setUploadingMarketingPhoto(true);
    setErrorMessage('');
    try {
      if (organizationId) {
        const url = await uploadClinicAsset(organizationId, file, 'marketing');
        updateField('marketingPhotoUrl', url);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => updateField('marketingPhotoUrl', e.target?.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Fallback base64 para foto de marketing:', err);
      const reader = new FileReader();
      reader.onload = (e) => updateField('marketingPhotoUrl', e.target?.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingMarketingPhoto(false);
      if (marketingPhotoInputRef.current) marketingPhotoInputRef.current.value = '';
    }
  };

  const handleRemoveMarketingPhoto = () => {
    updateField('marketingPhotoUrl', '');
    if (marketingPhotoInputRef.current) marketingPhotoInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalSaving(true);
    setErrorMessage('');
    try {
      if (typeof saveProfile === 'function') {
        await saveProfile(form);
      } else {
        setNutritionist(form);
      }
      closeDialog();
    } catch (err) {
      setErrorMessage(err?.message || 'Falha ao salvar perfil profissional no banco de dados.');
    } finally {
      setLocalSaving(false);
    }
  };

  const isSaving = localSaving || profileSaving;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="profile-settings-title"
      className="settings-dialog profile-settings-dialog product-form-dialog print:hidden"
      onClick={handleBackdropClick}
      onClose={() => setActiveModal(null)}
    >
      <form
        method="dialog"
        onSubmit={handleSubmit}
        className="settings-dialog__panel"
        aria-labelledby="profile-settings-title"
      >
        <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <User className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="profile-settings-title" className="text-xl font-black text-slate-900">
                Perfil profissional
              </h2>
              <p className="text-xs text-slate-500">
                Informações da nutricionista vinculadas à organização e sincronizadas para toda a equipe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar configurações do perfil"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="settings-dialog__body space-y-5 bg-slate-50/70 p-4 sm:p-6 custom-scrollbar">
          {/* Banner de Sincronização em Nuvem */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-900">
            <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
            <span>Dados salvos no Supabase vinculados à organização. Qualquer usuário com acesso à clínica visualizará essas informações nos documentos.</span>
          </div>

          {errorMessage && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* 1. Identificação Profissional */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <Award className="size-3.5 text-emerald-600" aria-hidden="true" />
              Identificação & Registro Profissional
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Nome completo profissional"
                  name="profile-name"
                  required
                  placeholder="Ex.: Dra. Maria Silva"
                  value={form.name}
                  onChange={(val) => updateField('name', val)}
                />
              </div>

              <div>
                <Field
                  label="Título / Especialidade"
                  name="profile-title"
                  placeholder="Ex.: Nutricionista Clínica e Esportiva"
                  value={form.title}
                  onChange={(val) => updateField('title', val)}
                />
              </div>

              <div>
                <Field
                  label="CRN / Registro profissional"
                  name="profile-crn"
                  required
                  placeholder="Ex.: CRN-3 / 58.492"
                  value={form.crn}
                  onChange={(val) => updateField('crn', val)}
                />
              </div>
            </div>
          </fieldset>

          {/* 2. Contatos & Comunicação Profissional */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <Phone className="size-3.5 text-emerald-600" aria-hidden="true" />
              Contatos & Canais Profissionais
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Field
                  label="Telefone / WhatsApp comercial"
                  name="profile-phone"
                  type="tel"
                  placeholder="Ex.: (19) 99876-5432"
                  value={form.phone}
                  onChange={(val) => updateField('phone', val)}
                />
              </div>

              <div>
                <Field
                  label="Instagram profissional"
                  name="profile-instagram"
                  placeholder="Ex.: @nutri.isabelamunoz"
                  value={form.instagram}
                  onChange={(val) => updateField('instagram', val)}
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="E-mail profissional"
                  name="profile-email"
                  type="email"
                  placeholder="Ex.: isabelamunoznutri@hotmail.com"
                  value={form.email}
                  onChange={(val) => updateField('email', val)}
                />
              </div>
            </div>
          </fieldset>

          {/* 3. Consultório & Localização */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <Building2 className="size-3.5 text-emerald-600" aria-hidden="true" />
              Consultório & Localização
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Nome da Clínica / Consultório"
                  name="profile-clinic"
                  placeholder="Ex.: Clínica Integrada de Saúde & Performance"
                  value={form.clinic}
                  onChange={(val) => updateField('clinic', val)}
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Endereço completo do consultório"
                  name="profile-address"
                  placeholder="Ex.: Rua Barão de Jaguara, 655 - Centro, Campinas - SP"
                  value={form.address}
                  onChange={(val) => updateField('address', val)}
                />
              </div>
            </div>
          </fieldset>

          {/* 4. Identidade Visual & Assinatura para Documentos */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <ImageIcon className="size-3.5 text-emerald-600" aria-hidden="true" />
              Identidade Visual & Assinatura para Documentos
            </legend>
            <p className="mb-4 text-xs text-slate-500">
              Personalize os laudos de composição corporal, planos alimentares, contratos e relatórios com a sua marca e assinatura.
            </p>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Card Logotipo */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-emerald-600" /> Logotipo do Consultório
                    </span>
                    {form.logoUrl ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Personalizado</span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Padrão NutrIsa</span>
                    )}
                  </div>

                  <div className="my-3 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-2">
                    <img
                      src={form.logoUrl || defaultLogo}
                      alt="Logo do consultório"
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Aparece no cabeçalho superior de laudos, planos e contratos.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="profile-logo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
                        <span>Enviando…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5 text-slate-600" />
                        <span>{form.logoUrl ? 'Alterar logo' : 'Enviar logo'}</span>
                      </>
                    )}
                  </button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      title="Restaurar logo padrão"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Assinatura Digital */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PenTool className="size-3.5 text-emerald-600" /> Assinatura Digital / Carimbo
                    </span>
                    {form.signatureUrl ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Digital Ativa</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Linha Manual</span>
                    )}
                  </div>

                  <div className="my-3 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-2 text-center">
                    {form.signatureUrl ? (
                      <img
                        src={form.signatureUrl}
                        alt="Assinatura da nutricionista"
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-28 border-b border-slate-300 mb-1" />
                        <span className="text-[10px] font-medium text-slate-500">{form.name || 'Nome do Profissional'}</span>
                        <span className="text-[9px] text-slate-400">{form.crn || 'CRN'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Recomendado imagem PNG com fundo transparente.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSignatureChange}
                    className="hidden"
                    id="profile-signature-upload"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingSignature ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
                        <span>Enviando…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5 text-slate-600" />
                        <span>{form.signatureUrl ? 'Alterar assinatura' : 'Enviar assinatura'}</span>
                      </>
                    )}
                  </button>
                  {form.signatureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      title="Remover assinatura digital"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Foto de Marketing / Perfil */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera className="size-3.5 text-emerald-600" /> Foto Oficial (Marketing)
                    </span>
                    {form.marketingPhotoUrl ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Personalizada</span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Padrão</span>
                    )}
                  </div>

                  <div className="my-3 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-2">
                    <img
                      src={form.marketingPhotoUrl || defaultDraPhoto}
                      alt="Foto oficial de marketing"
                      className="max-h-20 max-w-full rounded-full object-cover shadow-2xs aspect-square"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Utilizada nas artes de autoridade e capas do Estúdio de Marketing.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    ref={marketingPhotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleMarketingPhotoChange}
                    className="hidden"
                    id="profile-marketing-photo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => marketingPhotoInputRef.current?.click()}
                    disabled={uploadingMarketingPhoto}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingMarketingPhoto ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
                        <span>Enviando…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5 text-slate-600" />
                        <span>{form.marketingPhotoUrl ? 'Alterar foto' : 'Enviar foto'}</span>
                      </>
                    )}
                  </button>
                  {form.marketingPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveMarketingPhoto}
                      title="Restaurar foto padrão"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        <footer className="app-modal-footer flex items-center justify-end gap-2 border-t border-slate-200/80 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={closeDialog}
            className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-102 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Check className="size-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar perfil'}</span>
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}) {
  return (
    <label className="text-sm font-bold text-slate-700">
      <span className="block">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}
