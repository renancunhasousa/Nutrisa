import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Trash2,
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
  const { organizationId, user, isOwner } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);

  const [members, setMembers] = useState([]);
  const [actionError, setActionError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Formulário de novo membro
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('receptionist');
  const [newMemberModules, setNewMemberModules] = useState(ROLE_PRESETS.receptionist.modules);

  useEffect(() => {
    if (!open || !organizationId || !isOwner) return undefined;
    let cancelled = false;
    Promise.all([getClinicInviteCode(organizationId), listTeamMembers(organizationId)])
      .then(([code, team]) => {
        if (cancelled) return;
        setInviteCode(code); setTempCode(code); setMembers(team);
        setEditingMemberId(null); setShowAddForm(false);
      })
      .catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
  }, [open, organizationId, isOwner]);

  if (!open || !isOwner) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveCode = async () => {
    try {
      const saved = await saveClinicInviteCode(organizationId, tempCode);
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

  const persistMember = async (member, role, permissions) => {
    try {
      setActionError('');
      const updated = await saveTeamMember(organizationId, { ...member, role, permissions });
      setMembers((prev) => prev.map((item) => (item.id === member.id ? { ...updated, id: member.id } : item)));
    } catch (error) { setActionError(error.message); }
  };

  const handleToggleModuleInMember = (member, moduleId) => {
    if (member.isOwner) return; // Não pode restringir o proprietário

    const currentModules = Array.isArray(member.permissions) ? member.permissions : [];
    const updatedModules = currentModules.includes(moduleId)
      ? currentModules.filter((id) => id !== moduleId)
      : [...currentModules, moduleId];

    persistMember(member, 'custom', updatedModules);
  };

  const handleMemberRoleChange = (member, role) => {
    const modules = role === 'owner'
      ? CLINICAL_MODULES.map((module) => module.id)
      : (ROLE_PRESETS[role]?.modules || member.permissions || []);
    persistMember(member, role, modules);
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    let created;
    try {
      setActionError('');
      created = await saveTeamMember(organizationId, { name: newMemberName.trim(), email: newMemberEmail.trim().toLowerCase(), role: newMemberRole, permissions: newMemberModules });
    } catch (error) { setActionError(error.message); return; }

    setMembers((prev) => [...prev.filter((m) => m.id !== created.id), created]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('receptionist');
    setNewMemberModules(ROLE_PRESETS.receptionist.modules);
    setShowAddForm(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Remover este membro da clínica?')) return;
    try {
      setActionError('');
      await deleteTeamMember(organizationId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) { setActionError(error.message); }
    if (editingMemberId === memberId) setEditingMemberId(null);
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
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-scaleUp">
        {/* Header Padrão dos Modais */}
        <header className="app-modal-header flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="team-modal-title" className="text-xl font-black text-slate-900">
                Membros da equipe
              </h2>
              <p className="text-xs text-slate-500">
                Organize colaboradores, cargos e permissões de acesso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Corpo com scroll */}
        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
          {actionError ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{actionError}</p> : null}
          {/* Card do Código de Convite da Clínica */}
          <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
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
                Envie este código para sua secretária ou financeiro. No login, basta inserir o código para acessar a clínica com suas permissões.
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {isEditingCode ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                    className="min-h-10 px-3 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempCode(inviteCode);
                      setIsEditingCode(false);
                    }}
                    className="min-h-10 px-2 rounded-xl text-xs text-slate-500 hover:bg-slate-200/60 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Código com opção de ocultar / mostrar */}
                  <div className="flex items-center min-w-[130px] justify-center rounded-xl border border-emerald-300 bg-white px-3.5 py-2 font-mono text-sm font-black tracking-wider text-emerald-900 shadow-2xs select-none">
                    {showCode ? inviteCode : '••••••••••'}
                  </div>

                  {/* Botão de Olhinho */}
                  <button
                    type="button"
                    onClick={() => setShowCode((prev) => !prev)}
                    className="flex size-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    title={showCode ? 'Ocultar código' : 'Visualizar código'}
                    aria-label={showCode ? 'Ocultar código' : 'Visualizar código'}
                  >
                    {showCode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>

                  {/* Botão de Copiar */}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    title="Copiar código"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  {/* Botão de Editar Código */}
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(true)}
                    className="flex size-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar código"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Seção de Membros com Título Padrão */}
          <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                <Users className="size-4 text-emerald-600" aria-hidden="true" />
                Membros da equipe
              </h3>
              <p className="text-xs text-slate-500">
                Controle os acessos e permissões de cada colaborador
              </p>
            </div>
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingMemberId(null);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                <UserPlus className="size-4" />
                Adicionar membro
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
                    className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
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
                    className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cargo / Modelo</label>
                  <RoleDropdownSelect
                    id="new-member-role-select"
                    value={newMemberRole}
                    onChange={handleRolePresetChange}
                    isOpen={activeDropdown === 'new_member_role'}
                    onToggle={() =>
                      setActiveDropdown((prev) => (prev === 'new_member_role' ? null : 'new_member_role'))
                    }
                    onClose={() => setActiveDropdown(null)}
                  />
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
                        <span className="min-w-0 flex-1 break-words leading-snug">{mod.label}</span>
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
                  className="min-h-9 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 min-h-9 px-4 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs cursor-pointer"
                >
                  <Check className="size-3.5" />
                  Salvar membro
                </button>
              </div>
            </form>
          ) : null}

          {/* Lista de Membros */}
          <div className="space-y-4">
            {members.map((member) => {
              const memberModules = Array.isArray(member.permissions) ? member.permissions : [];
              const isEditing = editingMemberId === member.id;
              const isSelf = member.user_id === user?.id;

              return (
                <div key={member.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors hover:border-slate-300 sm:p-5">
                  {/* Linha Principal do Membro: Acessos Apenas por Ícones */}
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                    {/* Info do Membro */}
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                        member.isOwner
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.name?.slice(0, 2).toUpperCase() || 'MB'}
                      </span>
                      <div className="min-w-0">
                        <h4 className="break-words text-base font-black leading-snug text-slate-900">{member.name}</h4>
                        <p className="mt-1 break-all text-sm leading-relaxed text-slate-500">{member.email}</p>
                      </div>
                      </div>
                      <span className={`mt-0.5 shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase ${
                        member.isOwner
                          ? member.user_id === user?.id
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.isOwner
                          ? member.user_id === user?.id ? 'Proprietária' : 'Acesso mestre'
                          : ROLE_PRESETS[member.role]?.label || 'Equipe'}
                      </span>
                    </div>

                    {/* Acessos: Apenas por Ícones quando já cadastrado */}
                    <div className="flex w-full flex-col gap-3">
                      {/* Barra Compacta Somente com Ícones */}
                      {!isEditing ? <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2 sm:grid-cols-2 lg:grid-cols-3">
                        {CLINICAL_MODULES.map((mod) => {
                          const hasAccess = member.isOwner || memberModules.includes(mod.id);
                          const Icon = mod.icon;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              disabled={member.isOwner}
                              onClick={() => handleToggleModuleInMember(member, mod.id)}
                              className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${
                                hasAccess
                                  ? 'bg-white border-emerald-300 text-emerald-800 shadow-2xs'
                                  : 'bg-transparent border-transparent text-slate-300 opacity-25 hover:opacity-60'
                              } ${member.isOwner ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                              title={`${mod.label}: ${hasAccess ? 'Liberado (Clique para bloquear)' : 'Bloqueado (Clique para liberar)'}`}
                              aria-label={`${mod.label}: ${hasAccess ? 'Liberado' : 'Bloqueado'}`}
                            >
                              <Icon className="size-4 shrink-0" strokeWidth={hasAccess ? 2.2 : 1.5} />
                              <span className="min-w-0 flex-1 break-words leading-snug">{mod.label}</span>
                              {hasAccess ? <Check className="size-4 shrink-0 text-emerald-600" /> : <X className="size-4 shrink-0 text-slate-300" />}
                            </button>
                          );
                        })}
                      </div> : null}

                      {/* Botões de Ação do Membro */}
                      {!isSelf ? (
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMemberId(isEditing ? null : member.id)}
                            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition-colors cursor-pointer shadow-2xs sm:flex-none ${
                              isEditing
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={isEditing ? 'Fechar edição detalhada' : 'Editar permissões com texto'}
                          >
                            <Pencil className="size-3.5" />
                            <span>{isEditing ? 'Fechar' : 'Editar'}</span>
                          </button>
                          {!member.isOwner ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id)}
                              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remover membro"
                              aria-label={`Remover ${member.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                          Seu acesso mestre
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Painel de Edição Detalhada (Aparece com texto apenas ao clicar em Editar) */}
                  {isEditing && !isSelf ? (
                    <div className="mt-1 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 animate-fadeIn sm:p-5">
                      <div className="flex flex-col gap-4 border-b border-emerald-200/60 pb-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-black uppercase text-emerald-950">
                            Editando permissões: {member.name}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {memberModules.length} de {CLINICAL_MODULES.length} liberados
                          </span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {/* Seletor de Cargo no Modo Edição */}
                          <div className="flex max-w-md flex-col gap-1.5">
                            <label htmlFor={`member-role-${member.id}`} className="text-xs font-bold text-slate-600">
                              Cargo e nível de acesso
                            </label>
                            <RoleDropdownSelect
                              id={`member-role-${member.id}`}
                              value={member.role || 'custom'}
                              onChange={(role) => handleMemberRoleChange(member, role)}
                              isOpen={activeDropdown === `member_role_${member.id}`}
                              onToggle={() =>
                                setActiveDropdown((prev) =>
                                  prev === `member_role_${member.id}` ? null : `member_role_${member.id}`
                                )
                              }
                              onClose={() => setActiveDropdown(null)}
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                            type="button"
                            onClick={() => {
                              const all = CLINICAL_MODULES.map((m) => m.id);
                              persistMember(member, 'custom', all);
                            }}
                            className="min-h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          >
                            Marcar todos
                          </button>
                            <button
                            type="button"
                            onClick={() => {
                              persistMember(member, 'custom', []);
                            }}
                            className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Desmarcar todos
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Grade Completa com Ícones + Nomes em Texto + Checkmark */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {CLINICAL_MODULES.map((mod) => {
                          const hasAccess = memberModules.includes(mod.id);
                          const Icon = mod.icon;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleToggleModuleInMember(member, mod.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                                hasAccess
                                  ? 'bg-white border-emerald-300 text-emerald-950 shadow-2xs ring-1 ring-emerald-400/30'
                                  : 'bg-white/60 border-slate-200 text-slate-400 opacity-60 hover:opacity-90'
                              }`}
                              title={`${mod.label}: ${hasAccess ? 'Liberado (Clique para bloquear)' : 'Bloqueado (Clique para liberar)'}`}
                            >
                              <Icon className={`size-4 shrink-0 ${hasAccess ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className="min-w-0 flex-1 break-words text-xs leading-snug">{mod.label}</span>
                              {hasAccess ? <Check className="size-3.5 text-emerald-600 shrink-0" /> : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Check className="size-3.5" />
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          </section>
        </div>

        {/* Rodapé com Botão Concluir Verde e Ícone */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
          <p className="text-xs text-slate-500">
            Dica: clique no ícone para alternar permissões rápidas ou em "Editar" para detalhes em texto.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 min-h-10 px-5 rounded-2xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
          >
            <Check className="size-4" />
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLE_OPTIONS = [
  {
    value: 'receptionist',
    label: 'Secretária / Recepção',
    icon: '👩‍💼',
  },
  {
    value: 'assistant',
    label: 'Administrativo / Financeiro',
    icon: '💼',
  },
  {
    value: 'owner',
    label: 'Acesso mestre (Total)',
    icon: '👑',
  },
  {
    value: 'custom',
    label: 'Personalizado',
    icon: '⚙️',
  },
];

function RoleDropdownSelect({
  id,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  disabled = false,
  label = 'Selecione o cargo / modelo',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const selectedOption =
    ROLE_OPTIONS.find((opt) => opt.value === value) ||
    ROLE_OPTIONS.find((opt) => opt.value === 'custom') ||
    ROLE_OPTIONS[0];

  return (
    <div ref={containerRef} className={`relative dropdown-select-container ${isOpen ? 'z-[60]' : 'z-10'}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={onToggle}
        className={`flex min-h-11 w-full items-center justify-between gap-1.5 rounded-xl border bg-white px-3 py-2 text-left text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer active:scale-[0.99] hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/15 text-slate-900' : 'border-slate-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption.icon && <span className="text-sm shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-full min-w-[14rem] app-solid-dropdown !bg-white bg-[#ffffff] rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-[70] animate-scale-up space-y-1"
          style={{ backgroundColor: '#ffffff', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          {label && (
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {label}
            </div>
          )}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center truncate">
                    {opt.icon && <span className="mr-2 text-sm shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="size-3.5 text-emerald-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

