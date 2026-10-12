import { useMemo, useState } from 'react';
import { FolderOpen, UserPlus } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import PatientFormDialog from '../../pacientes/components/PatientFormDialog.jsx';
import { usePatient } from '../../pacientes/usePatient.js';
import { createPatient, findPatientByPhone } from '../../pacientes/services/patients.js';
import { linkConversationsToPatient } from '../services/conversations.js';
import {
  buildPatientDraftFromConversation,
  findConversationPatient,
  findConversationPatientMatches,
  getConversationPatientPhone,
} from '../domain/patientRegistration.js';

export default function ConversationPatientAction({ conversation, onOpenPatient }) {
  const { organizationId } = useAuth();
  const { patients, selectPatient, refreshPatients, loading } = usePatient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const matchedPatient = useMemo(
    () => findConversationPatient(patients, conversation),
    [patients, conversation],
  );
  const patientMatches = useMemo(
    () => findConversationPatientMatches(patients, conversation),
    [patients, conversation],
  );
  const ambiguousPhone = patientMatches.length > 1;
  const initialValues = useMemo(
    () => buildPatientDraftFromConversation(conversation),
    [conversation],
  );
  const conversationPhone = getConversationPatientPhone(conversation);

  const savePatient = async (form) => {
    const phone = form.whatsapp_phone || form.phone || conversationPhone;
    const existingPatient = await findPatientByPhone(organizationId, phone);
    const savedPatient = existingPatient || await createPatient(organizationId, form);
    await linkConversationsToPatient({
      organizationId,
      patientId: savedPatient.id,
      phone,
    });
    await refreshPatients();
    selectPatient(savedPatient);
    setFeedback(existingPatient
      ? `${savedPatient.full_name} já estava cadastrado e foi vinculado pelo telefone.`
      : `${savedPatient.full_name} foi cadastrado a partir do atendimento.`);
  };

  const openPatient = async () => {
    if (!matchedPatient) return;
    await linkConversationsToPatient({
      organizationId,
      patientId: matchedPatient.id,
      phone: matchedPatient.whatsapp_phone || matchedPatient.phone || conversationPhone,
    });
    selectPatient(matchedPatient);
    onOpenPatient?.(matchedPatient);
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5" aria-labelledby="conversation-patient-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h4 id="conversation-patient-title" className="text-xs font-black text-emerald-950">
            {matchedPatient ? 'Paciente já cadastrado' : ambiguousPhone ? 'Telefone compartilhado' : 'Contato ainda não cadastrado'}
          </h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800">
            {matchedPatient
              ? `${matchedPatient.full_name} foi identificado pelo telefone desta conversa.`
              : ambiguousPhone
                ? 'Mais de um paciente usa este telefone. Revise os cadastros antes de escolher.'
              : 'Confira os dados da conversa antes de criar o cadastro clínico.'}
          </p>
        </div>
        {matchedPatient ? (
          <button type="button" onClick={openPatient} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <FolderOpen className="size-4" aria-hidden="true" /> Abrir paciente
          </button>
        ) : ambiguousPhone ? (
          <button type="button" onClick={() => onOpenPatient?.(null)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <FolderOpen className="size-4" aria-hidden="true" /> Revisar pacientes
          </button>
        ) : (
          <button type="button" onClick={() => setDialogOpen(true)} disabled={loading || !organizationId} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60">
            <UserPlus className="size-4" aria-hidden="true" /> {loading ? 'Verificando…' : 'Cadastrar paciente'}
          </button>
        )}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-emerald-700">O cadastro não é automático: nome, contato e consentimentos devem ser conferidos antes de salvar.</p>
      {feedback ? <p role="status" className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[11px] font-bold text-emerald-800">{feedback}</p> : null}

      <PatientFormDialog
        open={dialogOpen}
        patient={null}
        initialValues={initialValues}
        onClose={() => setDialogOpen(false)}
        onSave={savePatient}
      />
    </section>
  );
}
