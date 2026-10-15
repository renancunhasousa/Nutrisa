import { requireSupabase } from './supabase.js';

const TYPES = new Set(['anamnese', 'contrato']);

function assertScope(organizationId, templateType) {
  if (!organizationId) throw new Error('Organização não identificada.');
  if (!TYPES.has(templateType)) throw new Error('Tipo de modelo inválido.');
}

function mapTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    ...(row.template_type === 'contrato'
      ? { pages: row.content?.pages || [] }
      : { content: row.content?.text || '' }),
  };
}

export async function listDocumentTemplates(organizationId, templateType) {
  assertScope(organizationId, templateType);
  const { data, error } = await requireSupabase()
    .from('document_templates')
    .select('id,template_type,name,content,updated_at')
    .eq('organization_id', organizationId)
    .eq('template_type', templateType)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message || 'Erro ao carregar modelos.');
  return (data || []).map(mapTemplate);
}

export async function saveDocumentTemplate({ id, organizationId, templateType, name, content }) {
  assertScope(organizationId, templateType);
  const payload = {
    organization_id: organizationId,
    template_type: templateType,
    name: name.trim(),
    content: templateType === 'contrato' ? { pages: content } : { text: content },
  };
  const query = id
    ? requireSupabase().from('document_templates').update(payload).eq('id', id).eq('organization_id', organizationId)
    : requireSupabase().from('document_templates').insert(payload);
  const { data, error } = await query.select('id,template_type,name,content').single();
  if (error) throw new Error(error.message || 'Erro ao salvar modelo.');
  return mapTemplate(data);
}

export async function importLocalDocumentTemplates({ organizationId, templateType, templates }) {
  assertScope(organizationId, templateType);
  if (!templates?.length) return [];
  const rows = templates.map((template) => ({
    organization_id: organizationId,
    template_type: templateType,
    name: String(template.name || 'Modelo importado').trim().slice(0, 120),
    content: templateType === 'contrato'
      ? { pages: Array.isArray(template.pages) ? template.pages : [{ label: 'Página 1', content: template.content || '' }] }
      : { text: template.content || '' },
    source_key: `local:${template.id}`,
  }));
  const { data, error } = await requireSupabase()
    .from('document_templates')
    .upsert(rows, { onConflict: 'organization_id,template_type,source_key' })
    .select('id,template_type,name,content');
  if (error) throw new Error(error.message || 'Erro ao migrar modelos locais.');
  return (data || []).map(mapTemplate);
}
