import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POST_FORMATS,
  POST_THEMES,
  SUGGESTED_TOPICS,
  DEFAULT_POST_DATA,
  DEFAULT_CAROUSEL_SLIDES,
  buildAiPrompt,
  sanitizePostData,
  generatePostContent,
  getOfflinePreset
} from '../../app/src/features/marketing/services/postGeneratorService.js';

describe('postGeneratorService', () => {
  it('deve conter os formatos de post exigidos para o feed incluindo carrossel', () => {
    assert.equal(POST_FORMATS.length, 7);
    const ids = POST_FORMATS.map(f => f.id);
    assert.deepEqual(ids, ['autoridade', 'prato', 'ciencia', 'dicas', 'cta', 'manifesto', 'passo']);
  });

  it('deve disponibilizar as 3 paletas de cores solicitadas: marrom, tiffany e bege', () => {
    assert.equal(POST_THEMES.length, 3);
    const themeIds = POST_THEMES.map(t => t.id);
    assert.ok(themeIds.includes('marrom'), 'Deve conter tema marrom & dourado');
    assert.ok(themeIds.includes('tiffany'), 'Deve conter tema verde tiffany');
    assert.ok(themeIds.includes('bege'), 'Deve conter tema bege claro editorial');

    // Valida propriedades visuais de cada tema
    const tiffanyTheme = POST_THEMES.find(t => t.id === 'tiffany');
    assert.equal(tiffanyTheme.dotColor, '#14B8A6');
    assert.equal(tiffanyTheme.isDark, true);

    const begeTheme = POST_THEMES.find(t => t.id === 'bege');
    assert.equal(begeTheme.dotColor, '#B88237');
    assert.equal(begeTheme.isDark, false);
  });

  it('deve construir o prompt de IA com papel de especialista ACSM e estrutura JSON', () => {
    const prompt = buildAiPrompt({ topic: 'Creatina e hipertrofia', format: 'ciencia' });
    assert.ok(prompt.includes('Dra. Isabela Muñoz'));
    assert.ok(prompt.includes('ACSM'));
    assert.ok(prompt.includes('"headline"'));
    assert.ok(prompt.includes('"caption"'));
    assert.ok(prompt.includes('Creatina e hipertrofia'));
  });

  it('deve construir prompt específico de carrossel solicitando múltiplos slides estruturados', () => {
    const prompt = buildAiPrompt({ topic: '5 erros no emagrecimento', format: 'carrossel' });
    assert.ok(prompt.includes('CARROSSEL COMPLETO'));
    assert.ok(prompt.includes('"slides"'));
    assert.ok(prompt.includes('"cover"'));
    assert.ok(prompt.includes('"content"'));
    assert.ok(prompt.includes('"cta"'));
  });

  it('deve conter estrutura padrão de carrossel com capa, conteúdos e CTA final', () => {
    assert.equal(DEFAULT_CAROUSEL_SLIDES.length, 5);
    assert.equal(DEFAULT_CAROUSEL_SLIDES[0].type, 'cover');
    assert.equal(DEFAULT_CAROUSEL_SLIDES[1].type, 'content');
    assert.equal(DEFAULT_CAROUSEL_SLIDES[4].type, 'cta');
    assert.ok(DEFAULT_CAROUSEL_SLIDES[1].tip.length > 0);
  });

  it('deve sanitizar e preservar valores default de dados de post e slides de carrossel', () => {
    const rawData = {
      headline: '  Título com espaços   ',
      highlightText: '  com espaços ',
      caption: '  Legenda gerada pela IA  ',
      slides: [
        { type: 'cover', headline: '  Capa teste  ' },
        { type: 'content', title: '  Dica 1  ', text: '  Texto explicativo  ' }
      ]
    };
    const sanitized = sanitizePostData(rawData);
    assert.equal(sanitized.headline, 'Título com espaços');
    assert.equal(sanitized.highlightText, 'com espaços');
    assert.equal(sanitized.caption, 'Legenda gerada pela IA');
    assert.equal(sanitized.authorName, 'Isabela Muñoz');
    assert.equal(sanitized.slides.length, 2);
    assert.equal(sanitized.slides[0].headline, 'Capa teste');
  });

  it('deve fornecer presets inteligentes offline para tópicos de carrossel', () => {
    const preset = getOfflinePreset('5 erros que travam o emagrecimento', 'carrossel');
    assert.equal(preset.format, 'carrossel');
    assert.ok(preset.slides.length >= 4);
    assert.ok(preset.caption.includes('Deslize'));
  });

  it('deve chamar a função de IA remota quando fornecida e retornar dados formatados', async () => {
    const mockCallAi = async () => ({
      json: {
        headline: 'A verdade sobre o jejum intermitente',
        highlightText: 'verdade sobre o jejum',
        badge: 'Nutrição Baseada em Evidências',
        description: 'O gasto calórico e a qualidade dos macronutrientes definem o resultado.',
        caption: 'Legenda completa gerada pelo Gemini.'
      }
    });

    const result = await generatePostContent({
      topic: 'Jejum intermitente',
      format: 'autoridade',
      model: 'gemini-1.5-flash',
      callAiFn: mockCallAi
    });

    assert.equal(result.headline, 'A verdade sobre o jejum intermitente');
    assert.equal(result.highlightText, 'verdade sobre o jejum');
    assert.equal(result.badge, 'Nutrição Baseada em Evidências');
    assert.equal(result.caption, 'Legenda completa gerada pelo Gemini.');
  });

  it('deve lançar erro amigável se o tema for vazio', async () => {
    await assert.rejects(
      async () => {
        await generatePostContent({ topic: '   ' });
      },
      /Informe um tema/
    );
  });
});
