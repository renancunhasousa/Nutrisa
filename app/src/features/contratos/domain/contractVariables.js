import {
  DRA_ISABELA_PROFILE,
  EMPTY_CLINIC_PROFILE,
  isDraIsabelaProfile,
  isDraIsabelaOrganization
} from '../../configuracoes/defaultProfile.js';

function formatIsoDateToBr(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

export const CONTRACT_VARIABLES = [
  { id: 'paciente', label: 'Nome do Paciente', tag: '{{paciente}}', example: 'Ex: João da Silva', group: 'paciente' },
  { id: 'plano', label: 'Plano Escolhido', tag: '{{plano}}', example: 'Ex: ESSENCE', group: 'plano' },
  { id: 'valor', label: 'Valor Total', tag: '{{valor}}', example: 'Ex: R$ 1.500,00', group: 'financeiro' },
  { id: 'formaPagamento', label: 'Forma de Pagamento', tag: '{{formaPagamento}}', example: 'Ex: Pix à vista', group: 'financeiro' },
  { id: 'data', label: 'Data Atual', tag: '{{data}}', example: 'Ex: 16/10/2026', group: 'geral' },
  { id: 'dataConsulta', label: 'Data da Consulta', tag: '{{dataConsulta}}', example: 'Ex: 20/10/2026', group: 'agendamento' },
  { id: 'horaConsulta', label: 'Horário da Consulta', tag: '{{horaConsulta}}', example: 'Ex: 14:30', group: 'agendamento' },
  { id: 'dataHoraConsulta', label: 'Data e Hora da Consulta', tag: '{{dataHoraConsulta}}', example: 'Ex: 20/10/2026 às 14:30', group: 'agendamento' },
  { id: 'consultas', label: 'Cronograma Completo', tag: '{{consultas}}', example: 'Ex: 1ª Consulta: 20/10 às 14:30...', group: 'agendamento' },
  { id: 'nutricionista', label: 'Nome da Nutricionista', tag: '{{nutricionista}}', example: 'Ex: Dra. Maria Silva', group: 'profissional' },
  { id: 'crn', label: 'CRN do Profissional', tag: '{{crn}}', example: 'Ex: CRN-3 / 58.492', group: 'profissional' },
  { id: 'clinica', label: 'Nome da Clínica', tag: '{{clinica}}', example: 'Ex: Clínica Integrada', group: 'profissional' },
  { id: 'endereco', label: 'Endereço da Clínica', tag: '{{endereco}}', example: 'Ex: Rua Barão de Jaguara, 655', group: 'profissional' },
  { id: 'telefone', label: 'Telefone da Clínica', tag: '{{telefone}}', example: 'Ex: (19) 99876-5432', group: 'profissional' },
];

export function getContractVariableBadgeHTML(variableName) {
  const cleanName = String(variableName || '').trim();
  return `<span contenteditable="false" data-var="${cleanName}" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold mx-1 shadow-2xs select-none align-middle">⚡ {{ ${cleanName} }}</span>&nbsp;`;
}

export function getContractVariableValues({ paciente, plano, valor, formaPagamento, consultas, dataAtual, nutritionist, organizationId }) {
  const dataHoje = dataAtual || new Date().toLocaleDateString('pt-BR');

  const nutri = nutritionist || (() => {
    try {
      const saved = localStorage.getItem('nutrisa_nutritionist_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  const isDra = isDraIsabelaProfile(nutri) || isDraIsabelaOrganization(organizationId || nutri?.organization_id);
  const fallback = isDra ? DRA_ISABELA_PROFILE : EMPTY_CLINIC_PROFILE;

  const listaConsultas = Array.isArray(consultas) ? consultas : [];
  const primeiraConsulta = listaConsultas.find(c => c?.data || c?.horario) || listaConsultas[0];

  const dataConsultaFmt = primeiraConsulta?.data
    ? formatIsoDateToBr(primeiraConsulta.data)
    : '___/___/____';
  const horaConsultaFmt = primeiraConsulta?.horario || '__:__';

  const dataHoraConsultaFmt = primeiraConsulta?.data
    ? `${dataConsultaFmt}${primeiraConsulta?.horario ? ` às ${primeiraConsulta.horario}` : ''}`
    : '___/___/____ às __:__';

  const todasConsultasValidas = listaConsultas.filter(c => c?.data || c?.horario);
  const todasConsultasFmt = todasConsultasValidas.length > 0
    ? todasConsultasValidas
        .map((c, i) => `${i + 1}ª Consulta: ${c.data ? formatIsoDateToBr(c.data) : '___/___/____'}${c.horario ? ` às ${c.horario}` : ''}`)
        .join('; ')
    : dataHoraConsultaFmt;

  const resolvedNutriName = nutri?.name || (isDra ? fallback.name : '___________________________');
  const resolvedCrn = nutri?.crn || (isDra ? fallback.crn : '___________________________');
  const resolvedClinic = nutri?.clinic || fallback.clinic || 'Consultório de Nutrição';
  const resolvedAddress = nutri?.address || (isDra ? fallback.address : '___________________________');
  const resolvedPhone = nutri?.phone || (isDra ? fallback.phone : '___________________________');
  const resolvedEmail = nutri?.email || (isDra ? fallback.email : '___________________________');

  return {
    paciente: paciente?.name || '___________________________',
    plano: plano ? String(plano).toUpperCase() : '_____________',
    valor: valor ? (String(valor).startsWith('R$') ? valor : `R$ ${valor}`) : 'R$ 0,00',
    formaPagamento: formaPagamento || '__________________',
    data: dataHoje,
    dataAtual: dataHoje,
    dataConsulta: dataConsultaFmt,
    horaConsulta: horaConsultaFmt,
    horarioConsulta: horaConsultaFmt,
    dataHoraConsulta: dataHoraConsultaFmt,
    consultas: todasConsultasFmt,
    nutricionista: resolvedNutriName,
    nutritionist: resolvedNutriName,
    nomeNutricionista: resolvedNutriName,
    crn: resolvedCrn,
    clinica: resolvedClinic,
    clinic: resolvedClinic,
    nomeClinica: resolvedClinic,
    endereco: resolvedAddress,
    address: resolvedAddress,
    telefone: resolvedPhone,
    phone: resolvedPhone,
    email: resolvedEmail,
  };
}

export function replaceContractVariables(content, contextData = {}) {
  if (!content) return '';
  const values = getContractVariableValues(contextData);

  // Mapeamento normalizado de chaves para aceitar case-insensitive, camelCase e snake_case
  // Ex: PACIENTE, paciente, Paciente, FORMAPAGAMENTO, forma_pagamento, DATACONSULTA, etc.
  const lookup = {};
  for (const [key, val] of Object.entries(values)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    lookup[norm] = val;
    lookup[key] = val;
  }
  if (values.paciente) lookup['nome'] = values.paciente;
  if (values.formaPagamento) lookup['pagamento'] = values.formaPagamento;

  const resolveValue = (rawKey) => {
    const cleanKey = String(rawKey || '').trim();
    if (values[cleanKey] !== undefined) return values[cleanKey];
    const normKey = cleanKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lookup[normKey] !== undefined) return lookup[normKey];
    return null;
  };

  let result = content;

  // 1. Substitui os badges HTML (spans com data-var) pelo valor real
  result = result.replace(/<span[^>]*data-var=["']?([^"'>]+)["']?[^>]*>[\s\S]*?<\/span>(?:&nbsp;)?/gi, (_match, varName) => {
    const val = resolveValue(varName);
    return val !== null ? val : '';
  });

  // 2. Substitui tags puras {{ variavel }}
  result = result.replace(/\{\{\s*([a-zA-Z0-9_\-À-ÿ\s]+)\s*\}\}/gi, (_match, varName) => {
    const val = resolveValue(varName);
    return val !== null ? val : '';
  });

  // 3. Remove quaisquer tags span com classes de badge residuais
  result = result.replace(/<span[^>]*data-var=["'][^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '$1');
  result = result.replace(/<span[^>]*class=["'][^"']*bg-emerald-[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // 4. Remove categoricamente qualquer emoji de raio (⚡) de todo o documento final
  result = result.replace(/⚡\s*/g, '');

  return result;
}

export function formatContractTemplateToHTML(content) {
  if (!content) return '';
  const badges = [];
  const withPlaceholders = content.replace(/<span[^>]*data-var=["']?([^"']+)["']?[^>]*>[\s\S]*?<\/span>(?:&nbsp;)?/gi, (match) => {
    const idx = badges.length;
    badges.push(match);
    return `__BADGE_PLACEHOLDER_${idx}__`;
  });

  const withBadges = withPlaceholders.replace(/\{\{\s*([a-zA-Z0-9_\-À-ÿ]+)\s*\}\}/gi, (_match, varName) => {
    return getContractVariableBadgeHTML(varName.trim());
  });

  return withBadges.replace(/__BADGE_PLACEHOLDER_(\d+)__/g, (_match, idx) => {
    return badges[Number(idx)] || '';
  });
}

export function extractContractVariables(content) {
  if (!content) return [];
  const found = new Set();

  const spanMatches = content.matchAll(/data-var=["']?([a-zA-Z0-9_\-À-ÿ]+)["']?/gi);
  for (const match of spanMatches) {
    if (match[1]) found.add(match[1]);
  }

  const withoutBadges = content.replace(/<span[^>]*data-var=["']?[^"']+["']?[^>]*>[\s\S]*?<\/span>/gi, '');
  const tagMatches = withoutBadges.matchAll(/\{\{\s*([a-zA-Z0-9_\-À-ÿ]+)\s*\}\}/gi);
  for (const match of tagMatches) {
    if (match[1]) found.add(match[1]);
  }

  return Array.from(found);
}

