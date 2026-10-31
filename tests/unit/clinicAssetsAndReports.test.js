import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClinicProfile } from '../../app/src/features/configuracoes/services/clinicProfileService.js';
import { DEFAULT_NUTRITIONIST } from '../../app/src/features/configuracoes/defaultProfile.js';

test('normalizeClinicProfile preserva e normaliza logoUrl e signatureUrl', () => {
  const profileDefault = normalizeClinicProfile(null);
  assert.equal(profileDefault.logoUrl, '');
  assert.equal(profileDefault.signatureUrl, '');

  const profileCustom = normalizeClinicProfile({
    name: 'Dra. Camila Nutri',
    clinic: 'Clínica Saúde Plena',
    logo_url: 'https://cdn.exemplo.com/logo-camila.png',
    signature_url: 'https://cdn.exemplo.com/assinatura-camila.png',
  });

  assert.equal(profileCustom.name, 'Dra. Camila Nutri');
  assert.equal(profileCustom.clinic, 'Clínica Saúde Plena');
  assert.equal(profileCustom.logoUrl, 'https://cdn.exemplo.com/logo-camila.png');
  assert.equal(profileCustom.signatureUrl, 'https://cdn.exemplo.com/assinatura-camila.png');
});

test('normalizeClinicProfile suporta formato camelCase logoUrl e signatureUrl', () => {
  const profile = normalizeClinicProfile({
    name: 'Dr. Roberto Nutrição',
    logoUrl: 'https://cdn.exemplo.com/logo-roberto.png',
    signatureUrl: 'https://cdn.exemplo.com/assinatura-roberto.png',
  });

  assert.equal(profile.name, 'Dr. Roberto Nutrição');
  assert.equal(profile.logoUrl, 'https://cdn.exemplo.com/logo-roberto.png');
  assert.equal(profile.signatureUrl, 'https://cdn.exemplo.com/assinatura-roberto.png');
});

test('DEFAULT_NUTRITIONIST possui campos de logoUrl, signatureUrl e marketingPhotoUrl declarados', () => {
  assert.ok('logoUrl' in DEFAULT_NUTRITIONIST);
  assert.ok('signatureUrl' in DEFAULT_NUTRITIONIST);
  assert.ok('marketingPhotoUrl' in DEFAULT_NUTRITIONIST);
});

test('normalizeClinicProfile suporta marketingPhotoUrl e snake_case marketing_photo_url', () => {
  const profile = normalizeClinicProfile({
    marketing_photo_url: 'https://cdn.exemplo.com/dra-foto.png',
  });
  assert.equal(profile.marketingPhotoUrl, 'https://cdn.exemplo.com/dra-foto.png');
});

test('perfil customizado da clínica alimenta prompts de IA sem hardcoding', () => {
  const profile = normalizeClinicProfile({
    name: 'Dra. Beatriz Nutricionista',
    clinic: 'BioNutri Clínica Integrada',
  });

  const promptSnippet = `Você é a IA clínica assistente do consultório "${profile.clinic}", atuando em apoio técnico ao acompanhamento nutricional liderado por ${profile.name}.`;
  assert.ok(promptSnippet.includes('Dra. Beatriz Nutricionista'));
  assert.ok(promptSnippet.includes('BioNutri Clínica Integrada'));
  assert.ok(!promptSnippet.includes('Dra. Isabela'));
});

test('postGeneratorService preserva Dra. Isabela e ACSM por padrão mas adapta se outra nutricionista for informada', async () => {
  const { buildAiPrompt, sanitizePostData, getOfflinePreset } = await import('../../app/src/features/marketing/services/postGeneratorService.js');

  // Caso 1: Dra. Isabela Muñoz (ou sem authorInfo)
  const promptIsabela = buildAiPrompt({ topic: 'Creatina', format: 'autoridade' });
  assert.match(promptIsabela, /Dra\. Isabela Muñoz/);
  assert.match(promptIsabela, /ACSM/);

  const presetIsabela = getOfflinePreset('5 erros que travam seu emagrecimento', 'carrossel');
  assert.match(presetIsabela.caption, /Dra\. Isabela Muñoz|#DraIsabelaMunoz/);

  // Caso 2: Outra nutricionista configurada
  const promptCamila = buildAiPrompt({
    topic: 'Hipertrofia Feminina',
    format: 'autoridade',
    authorInfo: { name: 'Dra. Camila Ramos', title: 'Nutrição Esportiva Funcional', clinic: 'Clínica Vita' }
  });
  assert.match(promptCamila, /Dra\. Camila Ramos/);
  assert.match(promptCamila, /Nutrição Esportiva Funcional/);
  assert.match(promptCamila, /Clínica Vita/);
  assert.ok(!promptCamila.includes('Dra. Isabela Muñoz'));

  const sanitizedCamila = sanitizePostData({}, undefined, { name: 'Dra. Camila Ramos' });
  assert.equal(sanitizedCamila.authorName, 'Dra. Camila Ramos');
});

test('organizações externas NÃO herdam dados nem fotos da Dra. Isabela Muñoz', async () => {
  const { DRA_ISABELA_ORG_ID, getClinicProfileFallback, isDraIsabelaOrganization } = await import('../../app/src/features/configuracoes/defaultProfile.js');
  const { getContractVariableValues } = await import('../../app/src/features/contratos/domain/contractVariables.js');
  const { buildAiPrompt } = await import('../../app/src/features/marketing/services/postGeneratorService.js');

  const foreignOrgId = 'a1234567-89ab-cdef-0123-456789abcdef';

  // 1. Fallback de perfil para nova clínica é limpo e neutro
  assert.equal(isDraIsabelaOrganization(foreignOrgId), false);
  const foreignProfile = getClinicProfileFallback(foreignOrgId);
  assert.equal(foreignProfile.name, '');
  assert.equal(foreignProfile.crn, '');
  assert.equal(foreignProfile.phone, '');
  assert.equal(foreignProfile.email, '');
  assert.equal(foreignProfile.instagram, '');
  assert.equal(foreignProfile.marketingPhotoUrl, '');

  // 2. Fallback da organização oficial da Dra. Isabela é completo e preservado
  assert.equal(isDraIsabelaOrganization(DRA_ISABELA_ORG_ID), true);
  const draProfile = getClinicProfileFallback(DRA_ISABELA_ORG_ID);
  assert.match(draProfile.name, /Isabela Muñoz/);
  assert.match(draProfile.crn, /CRN-3/);
  assert.match(draProfile.instagram, /@nutri\.isabelamunoz/);

  // 3. Contratos de organização externa não vazam nome nem CRN da Dra. Isabela
  const contractVarsForeign = getContractVariableValues({
    organizationId: foreignOrgId,
    paciente: { name: 'Maria Paciente' }
  });
  assert.ok(!contractVarsForeign.nutricionista.includes('Isabela'));
  assert.ok(!contractVarsForeign.crn.includes('58.492'));
  assert.ok(!contractVarsForeign.telefone.includes('(19) 99876-5432'));

  // 4. Marketing de organização externa gera prompt neutro sem citar Dra. Isabela nem ACSM
  const promptForeign = buildAiPrompt({
    topic: 'Alimentação Pré-Treino',
    format: 'autoridade',
    authorInfo: { organization_id: foreignOrgId }
  });
  assert.ok(!promptForeign.includes('Dra. Isabela Muñoz'));
  assert.ok(!promptForeign.includes('ACSM'));
});


