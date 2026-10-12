import { useEffect, useRef } from 'react';
import { BadgeCheck, User, X } from 'lucide-react';

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

const fieldClassName = 'h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70';

export default function ProfileSettings({ settings }) {
  const { nutritionist, setNutritionist, activeModal, setActiveModal } = settings;
  const dialogRef = useRef(null);
  const isOpen = activeModal === 'profile';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const closeDialog = () => dialogRef.current?.close();
  const updateField = (field, value) => setNutritionist({ ...nutritionist, [field]: value });

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="profile-settings-title"
      className="settings-dialog print:hidden"
      onClick={handleBackdropClick}
      onClose={() => setActiveModal(null)}
    >
      <div className="settings-dialog__panel">
        <header className="app-modal-header flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <User className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="profile-settings-title" className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                Perfil profissional
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Dados utilizados nos cabeçalhos, rodapés e documentos clínicos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar configurações do perfil"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="settings-dialog__body app-modal-body px-5 py-6 sm:px-7">
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-800">
            <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
            As alterações são salvas automaticamente neste navegador.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="profile-name" className="mb-1.5 block text-xs font-bold text-slate-700">
                Nome completo
              </label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={nutritionist.name}
                onChange={(event) => updateField('name', event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="profile-crn" className="mb-1.5 block text-xs font-bold text-slate-700">
                CRN / Registro profissional
              </label>
              <input
                id="profile-crn"
                type="text"
                value={nutritionist.crn}
                onChange={(event) => updateField('crn', event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-bold text-slate-700">
                Telefone / WhatsApp
              </label>
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                value={nutritionist.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="profile-email" className="mb-1.5 block text-xs font-bold text-slate-700">
                E-mail profissional
              </label>
              <input
                id="profile-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={nutritionist.email}
                onChange={(event) => updateField('email', event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="profile-clinic" className="mb-1.5 block text-xs font-bold text-slate-700">
                Clínica / Consultório
              </label>
              <input
                id="profile-clinic"
                type="text"
                autoComplete="organization"
                value={nutritionist.clinic}
                onChange={(event) => updateField('clinic', event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="profile-address" className="mb-1.5 block text-xs font-bold text-slate-700">
                Endereço completo
              </label>
              <input
                id="profile-address"
                type="text"
                autoComplete="street-address"
                value={nutritionist.address}
                onChange={(event) => updateField('address', event.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>
        </div>

        <footer className="app-modal-footer flex items-center justify-end gap-3 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={closeDialog}
            className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Concluir
          </button>
        </footer>
      </div>
    </dialog>
  );
}
