import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Edit2,
  KeyRound,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CLINICAL_MODULES, ROLE_PRESETS } from '../permissions.js';
import {
  deleteTeamMember,
  getClinicInviteCode,
  listTeamMembers,
  saveClinicInviteCode,
  saveTeamMember,
} from '../services/teamService.js';
import { useAuth } from '../useAuth.js';

export default function TeamPermissionsModal({ open, onClose }) {
  const { organizationId, user } = useAuth();
  const [inviteCode, setInviteCode] = useState(() => getClinicInviteCode(organizationId));
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);

  const [members, setMembers] = useState(() => listTeamMembers(organizationId, user));
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulário de novo membro
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('receptionist');
  const [newMemberModules, setNewMemberModules] = useState(ROLE_PRESETS.receptionist.modules);

  useEffect(() => {
    if (open) {
      setInviteCode(getClinicInviteCode(organizationId));
      setMembers(listTeamMembers(organizationId, user));
    }
  }, [open, organizationId, user]);

  if (!open) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveCode = () => {
    try {
      const saved = saveClinicInviteCode(organizationId, tempCode);
      setInviteCode(saved);
      setIsEditingCode(false);
    } catch (e) {
      alert(e.message || 'Código inválido.');
    }
  };

  const handleRolePresetChange = (role) => {
    setNewMemberRole(role);
    if (ROLE_PRESETS[role]) {
      setNewMemberModules(ROLE_PRESETS[role].modules);
    }
  };

  const handleToggleModuleInForm = (moduleId) => {
    setNewMemberRole('custom');
    setNewMemberModules((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId],
    );
  };

  const handleToggleModuleInMember = (member, moduleId) => {
    if (member.isOwner) return; // Não pode restringir o proprietário

    const currentModules = Array.isArray(member.permissions) ? member.permissions : [];
    const updatedModules = currentModules.includes(moduleId)
      ? currentModules.filter((id) => id !== moduleId)
      : [...currentModules, moduleId];

    const updated = saveTeamMember(organizationId, {
      ...member,
      role: 'custom',
      permissions: updatedModules,
    });

    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const created = saveTeamMember(organizationId, {
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
      permissions: newMemberModules,
    });

    setMembers((prev) => [...prev.filter((m) => m.id !== created.id), created]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('receptionist');
    setNewMemberModules(ROLE_PRESETS.receptionist.modules);
    setShowAddForm(false);
  };

  const handleDeleteMember = (memberId) => {
    if (!window.confirm('Remover este membro da clínica?')) return;
    deleteTeamMember(organizationId, memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-50/70 via-white to-slate-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-xs">
              <Users className="size-5" />
            </span>
            <div>
              <h2 id="team-modal-title" className="text-lg font-black text-slate-900">
                Equipe & Permissões da Clínica
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Defina o que a Secretária e o Administrativo podem ver marcando os atalhos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Card do Código de Convite da Clínica */}
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-emerald-700" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Código de Convite da Clínica
                </span>
                <span className="rounded-md bg-emerald-200 px-1.5 py-0.2 text-[10px] font-black uppercase text-emerald-900">
                  Ativo
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Envie este código para sua secretária ou financeiro. No primeiro login deles, basta informar este código para ingressar na sua clínica.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditingCode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCode}
                    onChange={(e) => setTempCode(e.target.value.toUpperCase())}
                    className="min-h-10 w-36 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-black uppercase text-slate-900"
                    placeholder="NOVO-CODIGO"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCode}
                    className="min-h-10 px-3 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempCode(inviteCode);
                      setIsEditingCode(false);
                    }}
                    className="min-h-10 px-2 rounded-xl text-xs text-slate-500 hover:bg-slate-200/60"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-300 bg-white px-3.5 py-2 font-mono text-sm font-black tracking-wider text-emerald-900 shadow-2xs">
                    {inviteCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    title="Copiar código"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(true)}
                    className="flex size-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar código"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Botão de Adicionar Membro */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="size-4 text-emerald-600" />
              Membros & Permissões Liberadas
            </h3>
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <UserPlus className="size-3.5" />
                Adicionar Membro
              </button>
            ) : null}
          </div>

          {/* Formulário de Novo Membro */}
          {showAddForm ? (
            <form onSubmit={handleCreateMember} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-black uppercase text-slate-700">Novo membro da equipe</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Ex: Maria Secretária"
                    className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail do Google / Login</label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="maria@gmail.com"
                    className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cargo / Modelo</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => handleRolePresetChange(e.target.value)}
                    className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800"
                  >
                    <option value="receptionist">Secretária / Recepção</option>
                    <option value="assistant">Administrativo / Financeiro</option>
                    <option value="owner">Dra. / Nutricionista (Total)</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>

              {/* Barra de Checks de Módulos (13 opções do menu) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">
                    Módulos liberados ({newMemberModules.length} de {CLINICAL_MODULES.length}):
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewMemberRole('custom');
                        setNewMemberModules(CLINICAL_MODULES.map((m) => m.id));
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Marcar todos
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewMemberRole('custom');
                        setNewMemberModules([]);
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                    >
                      Desmarcar todos
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 rounded-2xl bg-white border border-slate-200">
                  {CLINICAL_MODULES.map((mod) => {
                    const isChecked = newMemberModules.includes(mod.id);
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleModuleInForm(mod.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-left ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs ring-1 ring-emerald-400/30'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 opacity-60'
                        }`}
                        title={mod.description}
                      >
                        <Icon className={`size-4 shrink-0 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="truncate flex-1">{mod.label}</span>
                        {isChecked ? <Check className="size-3.5 text-emerald-600 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="min-h-9 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-9 px-4 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  Salvar Membro
                </button>
              </div>
            </form>
          ) : null}

          {/* Lista de Membros */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {members.map((member) => {
              const memberModules = Array.isArray(member.permissions) ? member.permissions : [];
              return (
                <div key={member.id} className="p-4 sm:p-5 flex flex-col gap-3.5 hover:bg-slate-50/40 transition-colors">
                  {/* Info do Membro e Ações */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                        member.isOwner
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.name?.slice(0, 2).toUpperCase() || 'MB'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 truncate">{member.name}</h4>
                          {member.isOwner ? (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                              Proprietária
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              {ROLE_PRESETS[member.role]?.label || 'Equipe'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!member.isOwner ? (
                        <>
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {memberModules.length} de {CLINICAL_MODULES.length} liberados
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const all = CLINICAL_MODULES.map((m) => m.id);
                              const updated = saveTeamMember(organizationId, {
                                ...member,
                                role: 'custom',
                                permissions: all,
                              });
                              setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                            }}
                            className="text-[11px] font-bold text-emerald-600 hover:underline px-1 cursor-pointer"
                          >
                            Liberar todos
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = saveTeamMember(organizationId, {
                                ...member,
                                role: 'custom',
                                permissions: [],
                              });
                              setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:underline px-1 cursor-pointer"
                          >
                            Bloquear todos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                            title="Remover membro"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                          Acesso irrestrito a todos os recursos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* As 13 Opções da Barra Lateral para Marcar/Desmarcar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-1.5 p-2 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    {CLINICAL_MODULES.map((mod) => {
                      const hasAccess = member.isOwner || memberModules.includes(mod.id);
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          disabled={member.isOwner}
                          onClick={() => handleToggleModuleInMember(member, mod.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-left ${
                            hasAccess
                              ? 'bg-white border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-400/25'
                              : 'bg-white/60 border-slate-200 text-slate-400 opacity-50 hover:opacity-80'
                          } ${member.isOwner ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                          title={`${mod.label}: ${hasAccess ? 'Liberado (Clique para bloquear)' : 'Bloqueado (Clique para liberar)'}`}
                        >
                          <Icon className={`size-3.5 shrink-0 ${hasAccess ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="truncate flex-1 text-[11px]">{mod.label}</span>
                          {hasAccess ? <Check className="size-3 text-emerald-600 shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
          <p className="text-xs text-slate-500">
            Dica: basta clicar em qualquer ícone para liberar ou bloquear o acesso do membro em tempo real.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
