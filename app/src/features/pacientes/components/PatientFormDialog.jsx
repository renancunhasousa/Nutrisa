import { useEffect, useRef, useState } from 'react';
import { User, X } from 'lucide-react';

const EMPTY_FORM = {
  full_name: '', preferred_name: '', birth_date: '', sex: '', cpf: '', email: '', phone: '',
  whatsapp_phone: '', acquisition_source: '', lifecycle_stage: 'lead', notes: '',
  consent_health_data: false, consent_communications: false,
};

export default function PatientFormDialog({ open, patient, initialValues, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    setForm(patient ? {
      ...EMPTY_FORM,
      ...patient,
      birth_date: patient.birth_date || '',
      consent_health_data: Boolean(patient.consent_health_data_at),
      consent_communications: Boolean(patient.consent_communications_at),
    } : { ...EMPTY_FORM, ...(initialValues || {}) });
    setError('');
  }, [patient, initialValues, open]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o paciente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose} onClose={onClose} className="settings-dialog">
      <form method="dialog" onSubmit={submit} className="settings-dialog__panel" aria-labelledby="patient-form-title">
        <header className="app-modal-header flex items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <User className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="patient-form-title" className="truncate text-xl font-black text-slate-900">{patient ? 'Editar paciente' : 'Novo paciente'}</h2>
              <p className="text-xs text-slate-500">Cadastro clínico da Dra. Isabela</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X /></button>
        </header>

        <div className="settings-dialog__body app-modal-body grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Nome completo" required value={form.full_name} onChange={(value) => setField('full_name', value)} />
          <Field label="Nome preferido" value={form.preferred_name} onChange={(value) => setField('preferred_name', value)} />
          <Field label="Nascimento" type="date" value={form.birth_date} onChange={(value) => setField('birth_date', value)} />
          <label className="text-sm font-bold text-slate-700">Sexo
            <select value={form.sex} onChange={(event) => setField('sex', event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal">
              <option value="">Não informado</option><option value="female">Feminino</option><option value="male">Masculino</option><option value="other">Outro</option>
            </select>
          </label>
          <Field label="CPF" value={form.cpf} inputMode="numeric" onChange={(value) => setField('cpf', value)} />
          <Field label="E-mail" type="email" value={form.email} onChange={(value) => setField('email', value)} />
          <Field label="Telefone" type="tel" value={form.phone} onChange={(value) => setField('phone', value)} />
          <Field label="WhatsApp" type="tel" value={form.whatsapp_phone} onChange={(value) => setField('whatsapp_phone', value)} />
          <Field label="Origem do paciente" value={form.acquisition_source} onChange={(value) => setField('acquisition_source', value)} />
          <label className="text-sm font-bold text-slate-700">Etapa
            <select value={form.lifecycle_stage} onChange={(event) => setField('lifecycle_stage', event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal">
              <option value="lead">Lead</option><option value="scheduled">Agendado</option><option value="active">Em acompanhamento</option><option value="at_risk">Atenção</option><option value="inactive">Inativo</option><option value="churned">Encerrado</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">Observações
            <textarea rows="3" value={form.notes} onChange={(event) => setField('notes', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal" />
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.consent_health_data} onChange={(event) => setField('consent_health_data', event.target.checked)} className="size-4" /> Consentimento para dados de saúde</label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.consent_communications} onChange={(event) => setField('consent_communications', event.target.checked)} className="size-4" /> Consentimento para comunicações</label>
          {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 sm:col-span-2">{error}</p> : null}
        </div>

        <footer className="app-modal-footer flex justify-end gap-2 px-5 py-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button type="submit" disabled={saving || !form.full_name.trim()} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar paciente'}</button>
        </footer>
      </form>
    </dialog>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, inputMode }) {
  return <label className="text-sm font-bold text-slate-700">{label}
    <input type={type} required={required} inputMode={inputMode} value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal" />
  </label>;
}
