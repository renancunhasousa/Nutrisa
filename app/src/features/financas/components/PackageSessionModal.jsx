import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, SlidersHorizontal } from 'lucide-react';

const SECTION_CLASS = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5';
const FIELD_CLASS = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal shadow-2xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm';

export default function PackageSessionModal({ open, onClose, pkg, onAddSession }) {
  const dialogRef = useRef(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!pkg) return null;

  const total = pkg.totalConsultations || 1;
  const completed = pkg.completedConsultations || 0;
  const pending = Math.max(0, total - completed);
  const percent = Math.min(100, Math.round((completed / total) * 100));

  const handleRegisterSession = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onAddSession(pkg.id, sessionNotes, sessionDate);
    setSessionNotes('');
    setIsSubmitting(false);
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClose={onClose}
      className="settings-dialog"
    >
      <div className="settings-dialog__panel">
        {/* Header no Padrão do Sistema */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {pkg.patientName}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {pkg.planName} • {pkg.partnerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Corpo com Scroll interno */}
        <div className="settings-dialog__body space-y-4 p-5 sm:p-6 bg-slate-50/50">
          {/* Card de Progresso */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              PROGRESSO DO PACOTE
            </legend>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total de Sessões
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{completed}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">de {total} consultas</span>
                  <span className={`ml-2 text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    pending === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {percent}% {pending === 0 ? 'concluído' : 'em andamento'}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-48 flex flex-col gap-1.5">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pending === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 text-right">
                  {pending === 0 ? 'Todas concluídas! 🎉' : `Faltam ${pending} consulta(s)`}
                </span>
              </div>
            </div>
          </fieldset>

          {/* Formulário de Registro Rápido */}
          {pending > 0 && (
            <fieldset className={SECTION_CLASS}>
              <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
                <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
                REGISTRAR NOVA CONSULTA REALIZADA
              </legend>
              <form onSubmit={handleRegisterSession} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">Data da Consulta</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className={FIELD_CLASS}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">Anotações da Sessão (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Consulta 3 realizada, exames revisados com o nutrólogo..."
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Confirmar Consulta #{completed + 1}
                  </button>
                </div>
              </form>
            </fieldset>
          )}

          {/* Histórico das Consultas Feitas */}
          <fieldset className={SECTION_CLASS}>
            <legend className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <SlidersHorizontal className="size-3.5 text-emerald-600" aria-hidden="true" />
              HISTÓRICO DE CONSULTAS ({pkg.sessionsHistory?.length || completed})
            </legend>

            {(!pkg.sessionsHistory || pkg.sessionsHistory.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Nenhum registro detalhado salvo ainda. As consultas são contabilizadas no contador geral.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {pkg.sessionsHistory.map((sess, idx) => (
                  <div key={sess.id || idx} className="p-3 hover:bg-slate-50/80 flex items-start justify-between gap-3 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                        #{pkg.sessionsHistory.length - idx}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {sess.date ? new Date(sess.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {sess.notes || 'Consulta realizada com sucesso.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        {/* Footer no Padrão do Sistema */}
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            Fechar
          </button>
        </footer>
      </div>
    </dialog>
  );
}
