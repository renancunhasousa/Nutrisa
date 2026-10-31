/**
 * Serviço de persistência híbrido (Offline-First) para finanças e gestão de pacotes de parceria.
 * Salva e lê instantaneamente do localStorage para máxima agilidade e sincroniza na nuvem
 * com o Supabase (tabelas partner_packages e finance_entries) em segundo plano.
 */
import { KEY_FINANCE_PACKAGES, KEY_FINANCE_TRANSACTIONS } from '../../../config/storageKeys.js';
import { supabase } from '../../../shared/services/supabase.js';

export const FINANCE_UPDATED_EVENT = 'nutrisa_finance_updated';

// Mock de exemplo inicial para novos usuários entenderem o funcionamento de imediato
const INITIAL_PACKAGES_SEED = [
  {
    id: 'f8b1c4e2-7a3d-4c9f-b5e1-8d2a6c3e9b11',
    patientName: 'Fernanda Rocha',
    patientId: null,
    patientPhone: '(11) 98765-4321',
    partnerName: 'Dr. Lucas (Nutrologia)',
    planName: 'Protocolo Integrado 6M (Nutro + Nutri)',
    frequency: 'Mensal',
    totalConsultations: 6,
    completedConsultations: 2,
    packageValue: 2400,
    partnerShare: 1200,
    paymentStatus: 'pago',
    status: 'ativo',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Exames de tireoide solicitados pelo Dr. Lucas. Paciente já iniciou reposição de vit D.',
    sessionsHistory: [
      {
        id: 'sess-1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '1ª consulta: Alinhamento inicial de protocolo, cardápio anti-inflamatório entregue.',
      },
      {
        id: 'sess-2',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '2ª consulta: Reavaliação e ajuste de macronutrientes. Evolução positiva.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e4a2d6f1-9b5c-4d3e-a7f2-1c8b9d4e5f22',
    patientName: 'Rodrigo Medeiros',
    patientId: null,
    patientPhone: '(11) 97654-3210',
    partnerName: 'Dr. Lucas (Nutrologia)',
    planName: 'Protocolo Performance & Hipertrofia',
    frequency: 'Quinzenal',
    totalConsultations: 4,
    completedConsultations: 3,
    packageValue: 1800,
    partnerShare: 900,
    paymentStatus: 'parcial',
    status: 'ativo',
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Resta a 2ª parcela (vencimento dia 25). Falta apenas 1 consulta para conclusão.',
    sessionsHistory: [
      { id: 'sess-21', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Consulta 1' },
      { id: 'sess-22', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Consulta 2' },
      { id: 'sess-23', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Consulta 3: ajustes pré-treino' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_TRANSACTIONS_SEED = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c55',
    description: 'Pacote Integrado 6M - Fernanda Rocha',
    category: 'Parceria Nutrologia',
    type: 'receita',
    amount: 2400,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pago',
    paymentMethod: 'Pix',
    notes: 'Valor integral pago à vista',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d66',
    description: 'Repasse Parceria - Dr. Lucas (Ref. Fernanda Rocha)',
    category: 'Repasse Parceiros',
    type: 'despesa',
    amount: 1200,
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pago',
    paymentMethod: 'Pix',
    notes: 'Repasse de 50% efetuado',
    createdAt: new Date().toISOString(),
  },
];

function notifyFinanceUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT));
  }
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

// ── MAPEADORES SUPABASE ───────────────────────────────────────────────────────

function mapPackageToDB(pkg, orgId) {
  return {
    id: pkg.id,
    organization_id: pkg.organizationId || orgId,
    patient_id: pkg.patientId || null,
    patient_name: pkg.patientName,
    patient_phone: pkg.patientPhone || null,
    partner_name: pkg.partnerName,
    plan_name: pkg.planName,
    frequency: pkg.frequency || 'Mensal',
    total_consultations: Math.max(1, Number(pkg.totalConsultations) || 1),
    completed_consultations: Math.max(0, Number(pkg.completedConsultations) || 0),
    package_value: Number(pkg.packageValue) || 0,
    partner_share: Number(pkg.partnerShare) || 0,
    payment_status: pkg.paymentStatus || 'pago',
    payment_methods: Array.isArray(pkg.paymentMethods) ? pkg.paymentMethods : [],
    status: pkg.status || 'ativo',
    start_date: pkg.startDate || new Date().toISOString().split('T')[0],
    notes: pkg.notes || null,
    sessions_history: Array.isArray(pkg.sessionsHistory) ? pkg.sessionsHistory : [],
    created_at: pkg.createdAt || new Date().toISOString(),
    updated_at: pkg.updatedAt || new Date().toISOString(),
  };
}

function mapPackageToJS(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone || '',
    partnerName: row.partner_name,
    planName: row.plan_name,
    frequency: row.frequency || 'Mensal',
    totalConsultations: row.total_consultations,
    completedConsultations: row.completed_consultations,
    packageValue: Number(row.package_value) || 0,
    partnerShare: Number(row.partner_share) || 0,
    paymentStatus: row.payment_status || 'pago',
    paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
    status: row.status || 'ativo',
    startDate: row.start_date,
    notes: row.notes || '',
    sessionsHistory: Array.isArray(row.sessions_history) ? row.sessions_history : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransactionToDB(tx, orgId) {
  return {
    id: tx.id,
    organization_id: tx.organizationId || orgId,
    patient_id: tx.patientId || null,
    description: tx.description,
    amount: Number(tx.amount) || 0,
    type: tx.type === 'despesa' ? 'despesa' : 'receita',
    category: tx.category || 'Geral',
    entry_date: tx.date || new Date().toISOString().split('T')[0],
    payment_method: tx.paymentMethod || 'Pix',
    status: tx.status || 'pago',
    observations: tx.notes || null,
    created_at: tx.createdAt || new Date().toISOString(),
  };
}

function mapTransactionToJS(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    patientId: row.patient_id,
    description: row.description,
    amount: Number(row.amount) || 0,
    type: row.type === 'despesa' ? 'despesa' : 'receita',
    category: row.category || 'Geral',
    date: row.entry_date,
    paymentMethod: row.payment_method || 'Pix',
    status: row.status || 'pago',
    notes: row.observations || '',
    createdAt: row.created_at,
  };
}

// ── PACOTES ──────────────────────────────────────────────────────────────────

export function getPackages() {
  if (typeof globalThis.localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_FINANCE_PACKAGES);
    if (!raw) {
      localStorage.setItem(KEY_FINANCE_PACKAGES, JSON.stringify(INITIAL_PACKAGES_SEED));
      return INITIAL_PACKAGES_SEED;
    }
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function savePackage(pkg, organizationId) {
  const current = getPackages();
  const now = new Date().toISOString();
  let updated;

  const packageId = pkg.id && !pkg.id.startsWith('pkg-') ? pkg.id : generateUUID();
  const packageToSave = {
    ...pkg,
    id: packageId,
    organizationId: pkg.organizationId || organizationId || null,
    updatedAt: now,
    createdAt: pkg.createdAt || now,
    sessionsHistory: Array.isArray(pkg.sessionsHistory) ? pkg.sessionsHistory : [],
    paymentMethods: Array.isArray(pkg.paymentMethods) ? pkg.paymentMethods : [],
  };

  const existingIndex = current.findIndex((item) => item.id === packageToSave.id);
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = packageToSave;
  } else {
    updated = [packageToSave, ...current];
  }

  // 1. Otimista no localStorage
  localStorage.setItem(KEY_FINANCE_PACKAGES, JSON.stringify(updated));
  notifyFinanceUpdate();

  // 2. Sincronização em nuvem com Supabase
  if (supabase && (packageToSave.organizationId || organizationId)) {
    const dbPayload = mapPackageToDB(packageToSave, organizationId);
    supabase
      .from('partner_packages')
      .upsert(dbPayload)
      .then(({ error }) => {
        if (error) {
          if (String(error.message || '').includes('payment_methods')) {
            const { payment_methods, ...fallbackPayload } = dbPayload;
            supabase.from('partner_packages').upsert(fallbackPayload).catch(() => {});
          } else {
            console.error('Erro ao sincronizar pacote no Supabase:', error);
          }
        }
      })
      .catch((err) => console.error('Erro de conexão Supabase:', err));
  }

  return updated;
}

export function deletePackage(id) {
  const current = getPackages();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(KEY_FINANCE_PACKAGES, JSON.stringify(updated));
  notifyFinanceUpdate();

  if (supabase) {
    supabase
      .from('partner_packages')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Erro ao deletar pacote no Supabase:', error);
      })
      .catch((err) => console.error('Erro de conexão Supabase:', err));
  }

  return updated;
}

export function recordPackageConsultation(packageId, notes = '', sessionDate = null) {
  const current = getPackages();
  const target = current.find((p) => p.id === packageId);
  if (!target) return null;

  const completed = (target.completedConsultations || 0) + 1;
  const total = target.totalConsultations || 1;
  const isDone = completed >= total;

  const sessionEntry = {
    id: generateUUID(),
    date: sessionDate || new Date().toISOString().split('T')[0],
    notes: notes.trim() || `Consulta ${completed} realizada com sucesso.`,
    createdAt: new Date().toISOString(),
  };

  const updatedTarget = {
    ...target,
    completedConsultations: completed,
    status: isDone ? 'concluido' : target.status,
    sessionsHistory: [sessionEntry, ...(target.sessionsHistory || [])],
    updatedAt: new Date().toISOString(),
  };

  return savePackage(updatedTarget, updatedTarget.organizationId);
}

// ── FLUXO DE CAIXA / TRANSAÇÕES ──────────────────────────────────────────────

export function getTransactions() {
  if (typeof globalThis.localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_FINANCE_TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(KEY_FINANCE_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS_SEED));
      return INITIAL_TRANSACTIONS_SEED;
    }
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function saveTransaction(tx, organizationId) {
  const current = getTransactions();
  const now = new Date().toISOString();
  let updated;

  const txId = tx.id && !tx.id.startsWith('tx-') ? tx.id : generateUUID();
  const txToSave = {
    ...tx,
    id: txId,
    organizationId: tx.organizationId || organizationId || null,
    createdAt: tx.createdAt || now,
    updatedAt: now,
  };

  const existingIndex = current.findIndex((item) => item.id === txToSave.id);
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = txToSave;
  } else {
    updated = [txToSave, ...current];
  }

  // 1. Otimista no localStorage
  localStorage.setItem(KEY_FINANCE_TRANSACTIONS, JSON.stringify(updated));
  notifyFinanceUpdate();

  // 2. Sincronização em nuvem com Supabase
  if (supabase && (txToSave.organizationId || organizationId)) {
    const dbPayload = mapTransactionToDB(txToSave, organizationId);
    supabase
      .from('finance_entries')
      .upsert(dbPayload)
      .then(({ error }) => {
        if (error) console.error('Erro ao sincronizar lançamento no Supabase:', error);
      })
      .catch((err) => console.error('Erro de conexão Supabase:', err));
  }

  return updated;
}

export function deleteTransaction(id) {
  const current = getTransactions();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(KEY_FINANCE_TRANSACTIONS, JSON.stringify(updated));
  notifyFinanceUpdate();

  if (supabase) {
    supabase
      .from('finance_entries')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Erro ao deletar lançamento no Supabase:', error);
      })
      .catch((err) => console.error('Erro de conexão Supabase:', err));
  }

  return updated;
}

// ── SINCRONIZAÇÃO NUVEM COM SUPABASE ──────────────────────────────────────────

export async function syncFinanceFromCloud(organizationId) {
  if (!supabase || !organizationId) return;

  try {
    // 1. Puxar pacotes da nuvem
    const { data: cloudPackages, error: pkgError } = await supabase
      .from('partner_packages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (!pkgError && cloudPackages && cloudPackages.length > 0) {
      const mapped = cloudPackages.map(mapPackageToJS);
      localStorage.setItem(KEY_FINANCE_PACKAGES, JSON.stringify(mapped));
      notifyFinanceUpdate();
    }

    // 2. Puxar lançamentos financeiros da nuvem
    const { data: cloudTx, error: txError } = await supabase
      .from('finance_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('entry_date', { ascending: false });

    if (!txError && cloudTx && cloudTx.length > 0) {
      const mappedTx = cloudTx.map(mapTransactionToJS);
      localStorage.setItem(KEY_FINANCE_TRANSACTIONS, JSON.stringify(mappedTx));
      notifyFinanceUpdate();
    }
  } catch (err) {
    console.error('Falha ao sincronizar dados financeiros da nuvem:', err);
  }
}

// ── EXPORTAÇÃO CSV ───────────────────────────────────────────────────────────

export function exportPackagesToCSV(packages) {
  const headers = [
    'Paciente',
    'Telefone',
    'Parceiro',
    'Nome do Plano',
    'Frequência',
    'Total de Consultas',
    'Consultas Feitas',
    'Consultas Pendentes',
    'Valor Pacote (R$)',
    'Repasse Parceiro (R$)',
    'Status Pagamento',
    'Status Pacote',
    'Pendências / Observações',
    'Data de Início',
  ];

  const rows = packages.map((pkg) => {
    const pending = Math.max(0, (pkg.totalConsultations || 0) - (pkg.completedConsultations || 0));
    return [
      `"${(pkg.patientName || '').replace(/"/g, '""')}"`,
      `"${(pkg.patientPhone || '').replace(/"/g, '""')}"`,
      `"${(pkg.partnerName || '').replace(/"/g, '""')}"`,
      `"${(pkg.planName || '').replace(/"/g, '""')}"`,
      `"${(pkg.frequency || '').replace(/"/g, '""')}"`,
      pkg.totalConsultations || 0,
      pkg.completedConsultations || 0,
      pending,
      (pkg.packageValue || 0).toFixed(2),
      (pkg.partnerShare || 0).toFixed(2),
      pkg.paymentStatus || '',
      pkg.status || '',
      `"${(pkg.notes || '').replace(/"/g, '""')}"`,
      pkg.startDate || '',
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nutrisa_pacotes_parcerias_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTransactionsToCSV(transactions) {
  const headers = [
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Forma de Pagamento',
    'Valor (R$)',
    'Status',
    'Observações',
  ];

  const rows = transactions.map((t) => [
    t.date || '',
    t.type === 'receita' ? 'Receita' : 'Despesa',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
    (Number(t.amount) || 0).toFixed(2),
    t.status || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nutrisa_fluxo_caixa_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
