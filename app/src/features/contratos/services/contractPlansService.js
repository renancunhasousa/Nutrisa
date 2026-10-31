import { requireSupabase } from '../../../shared/services/supabase.js';

export const DEFAULT_CONTRACT_PLANS = [
  {
    name: 'Essence',
    icon: '🌿',
    default_price: 1500,
    default_payment_method: 'Pix à vista',
    description: 'Plano com foco em reeducação alimentar e rotina básica',
    consultas_count: 2,
    display_order: 1,
  },
  {
    name: 'Premium',
    icon: '⭐',
    default_price: 2400,
    default_payment_method: 'Cartão 3x',
    description: 'Acompanhamento nutricional completo com bioimpedância e suporte contínuo',
    consultas_count: 4,
    display_order: 2,
  },
  {
    name: 'Legacy',
    icon: '👑',
    default_price: 3600,
    default_payment_method: 'Cartão 6x',
    description: 'Programa de transformação nutricional avançado de longo prazo',
    consultas_count: 6,
    display_order: 3,
  },
  {
    name: 'Consultoria Online',
    icon: '💻',
    default_price: 1200,
    default_payment_method: 'Pix',
    description: 'Atendimento 100% digital com suporte por WhatsApp',
    consultas_count: 2,
    display_order: 4,
  },
];

function mapPlan(row) {
  const hasCustomMethods = Array.isArray(row.payment_methods) && row.payment_methods.length > 0;
  const paymentMethods = hasCustomMethods
    ? row.payment_methods
    : (row.default_payment_method
      ? [{ id: '1', name: row.default_payment_method, feePercentage: 0, price: Number(row.default_price || 0) }]
      : []);

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    icon: row.icon || '📋',
    defaultPrice: Number(row.default_price || 0),
    defaultPaymentMethod: row.default_payment_method || 'Pix',
    paymentMethods,
    description: row.description || '',
    consultasCount: Number(row.consultas_count || 1),
    isActive: row.is_active !== false,
    displayOrder: Number(row.display_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listContractPlans(organizationId) {
  if (!organizationId) throw new Error('Organização não identificada.');
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('contract_plans')
    .select('*')
    .eq('organization_id', organizationId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  // Se a clínica ainda não tem nenhum plano cadastrado no banco, inicializa com os defaults
  if (!data || data.length === 0) {
    try {
      const seeded = await seedDefaultContractPlans(organizationId);
      return seeded;
    } catch {
      // Fallback em caso de restrição temporária
      return DEFAULT_CONTRACT_PLANS.map((p, idx) => ({
        id: `default-${idx}`,
        organizationId,
        name: p.name,
        icon: p.icon,
        defaultPrice: p.default_price,
        defaultPaymentMethod: p.default_payment_method,
        paymentMethods: [
          { id: '1', name: p.default_payment_method, feePercentage: 0, price: p.default_price },
        ],
        description: p.description,
        consultasCount: p.consultas_count,
        isActive: true,
        displayOrder: p.display_order,
      }));
    }
  }

  return data.map(mapPlan);
}

export async function seedDefaultContractPlans(organizationId) {
  if (!organizationId) throw new Error('Organização não identificada.');
  const supabase = requireSupabase();

  const rows = DEFAULT_CONTRACT_PLANS.map((p, idx) => ({
    organization_id: organizationId,
    name: p.name,
    icon: p.icon,
    default_price: p.default_price,
    default_payment_method: p.default_payment_method,
    payment_methods: [
      { id: '1', name: p.default_payment_method, feePercentage: 0, price: p.default_price },
    ],
    description: p.description,
    consultas_count: p.consultas_count,
    display_order: idx + 1,
    is_active: true,
  }));

  try {
    const { data, error } = await supabase
      .from('contract_plans')
      .insert(rows)
      .select('*');

    if (error) throw new Error(error.message);
    return (data || []).map(mapPlan);
  } catch {
    // Fallback caso payment_methods ainda não exista no schema remoto
    const basicRows = rows.map(({ payment_methods, ...rest }) => rest);
    const { data, error } = await supabase
      .from('contract_plans')
      .insert(basicRows)
      .select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(mapPlan);
  }
}

export async function saveContractPlan(param1, param2) {
  let opts = {};
  if (typeof param1 === 'string' && param2 && typeof param2 === 'object') {
    opts = { ...param2, organizationId: param1 };
  } else if (param1 && typeof param1 === 'object') {
    opts = { ...param1 };
    if (param2 && typeof param2 === 'string') {
      opts.organizationId = opts.organizationId || param2;
    }
  }

  const {
    id = null,
    organizationId,
    name,
    icon = '📋',
    defaultPrice = 0,
    defaultPaymentMethod = 'Pix',
    paymentMethods = [],
    description = '',
    consultasCount = 1,
    isActive = true,
    displayOrder = 0,
  } = opts;

  if (!organizationId) throw new Error('Organização não identificada.');
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Nome do plano é obrigatório.');

  const supabase = requireSupabase();
  const validPaymentMethods = Array.isArray(paymentMethods)
    ? paymentMethods.map((pm, idx) => ({
        id: pm.id || `pm-${idx + 1}-${Date.now()}`,
        name: String(pm.name || '').trim() || `Forma ${idx + 1}`,
        feePercentage: Number(pm.feePercentage) || 0,
        price: Number(pm.price) || 0,
      }))
    : [];
  
  // Se temos paymentMethods e o default não foi passado explicitamente, usamos o primeiro
  const primaryMethod = validPaymentMethods[0];
  const finalPrice = primaryMethod?.price != null ? Number(primaryMethod.price) : Math.max(0, Number(defaultPrice) || 0);
  const finalMethodName = primaryMethod?.name ? String(primaryMethod.name).trim() : String(defaultPaymentMethod || 'Pix').trim();

  const payload = {
    organization_id: organizationId,
    name: cleanName,
    icon: String(icon || '📋').trim(),
    default_price: finalPrice,
    default_payment_method: finalMethodName,
    payment_methods: validPaymentMethods,
    description: String(description || '').trim(),
    consultas_count: Math.max(1, Number(consultasCount) || 1),
    is_active: Boolean(isActive),
    display_order: Number(displayOrder) || 0,
  };

  const executeUpsert = async (dataPayload) => {
    if (id && !String(id).startsWith('default-')) {
      return supabase
        .from('contract_plans')
        .update(dataPayload)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('*')
        .single();
    }
    return supabase
      .from('contract_plans')
      .insert([dataPayload])
      .select('*')
      .single();
  };

  let res = await executeUpsert(payload);
  if (res.error && String(res.error.message || '').includes('payment_methods')) {
    // Fallback defensivo se a coluna remota ainda não foi criada
    const { payment_methods, ...fallbackPayload } = payload;
    res = await executeUpsert(fallbackPayload);
  }

  if (res.error) throw new Error(res.error.message);
  return mapPlan(res.data);
}

export async function deleteContractPlan(param1, param2) {
  let targetId = null;
  let targetOrgId = null;
  if (typeof param1 === 'string') {
    targetId = param1;
    targetOrgId = param2 || null;
  } else if (param1 && typeof param1 === 'object') {
    targetId = param1.id;
    targetOrgId = param1.organizationId || null;
  }

  if (!targetId || String(targetId).startsWith('default-')) return;

  const supabase = requireSupabase();
  let query = supabase.from('contract_plans').delete().eq('id', targetId);
  if (targetOrgId) {
    query = query.eq('organization_id', targetOrgId);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}
