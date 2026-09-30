import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';
import {
  DEFAULT_POST_DATA,
  DEFAULT_CAROUSEL_SLIDES,
  generatePostContent,
  generateInstagramCaption
} from '../services/postGeneratorService.js';
import {
  extractMarketingIdeasFromWhatsApp,
  DEFAULT_WHATSAPP_IDEAS
} from '../services/whatsappPostService.js';
import {
  fetchTrendingWebTopics,
  DEFAULT_TRENDING_TOPICS
} from '../services/trendingTopicsService.js';

export function usePostStudio(activeModel) {
  const [postData, setPostData] = useState(DEFAULT_POST_DATA);
  const [currentTheme, setCurrentTheme] = useState('marrom');
  const [customPhotoUrl, setCustomPhotoUrl] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [whatsappIdeas, setWhatsappIdeas] = useState(DEFAULT_WHATSAPP_IDEAS);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [trendingWebTopics, setTrendingWebTopics] = useState(DEFAULT_TRENDING_TOPICS);
  const [isLoadingWeb, setIsLoadingWeb] = useState(false);
  const canvasRef = useRef(null);

  // Navegação entre lâminas do carrossel
  const goToSlide = (idx) => {
    const total = (postData.slides || []).length;
    if (idx >= 0 && idx < total) {
      setCurrentSlideIndex(idx);
    }
  };

  const nextSlide = () => {
    const total = (postData.slides || []).length;
    if (currentSlideIndex < total - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const addSlide = () => {
    const currentSlides = (postData.format === 'carrossel' && Array.isArray(postData.slides)) ? postData.slides : [];
    const newSlideId = Date.now();
    const newIndex = currentSlides.length + 1;
    const newSlide = {
      id: newSlideId,
      format: 'autoridade',
      type: 'content',
      stepNumber: String(newIndex).padStart(2, '0'),
      badge: `Slide ${String(newIndex).padStart(2, '0')}`,
      title: 'Novo Slide',
      highlightText: '',
      text: 'Adicione aqui o conteúdo para este slide.'
    };

    const updated = [...currentSlides, newSlide];
    setPostData((prev) => ({ ...prev, format: 'carrossel', slides: updated }));
    setCurrentSlideIndex(updated.length - 1);
    setStatusMessage({ type: 'info', text: 'Novo slide adicionado ao carrossel!' });
  };

  // Adiciona o post atual como uma nova lâmina em um carrossel
  // Converte o post único (dicas/cta/autoridade) em slide de carrossel e mescla com os slides existentes
  const addCurrentPostAsSlide = () => {
    const currentFormat = postData.format;
    const existingSlides = (postData.slides && postData.slides.length > 0) ? postData.slides : DEFAULT_CAROUSEL_SLIDES;

    let newSlide;
    if (currentFormat === 'dicas') {
      newSlide = {
        id: Date.now(),
        type: 'content',
        stepNumber: String(existingSlides.length).padStart(2, '0'),
        badge: postData.dicasBadge || 'Dicas Clínicas',
        title: postData.dicasTitle || 'Dicas de Nutrição',
        highlightText: postData.dicasHighlight || '',
        text: [postData.dica1Text, postData.dica2Text, postData.dica3Text].filter(Boolean).join(' | '),
        tip: `💡 ${postData.dica1Title || ''} • ${postData.dica2Title || ''} • ${postData.dica3Title || ''}`
      };
    } else if (currentFormat === 'cta') {
      newSlide = {
        id: Date.now(),
        type: 'cta',
        badge: postData.ctaBadge || 'Acompanhamento Individualizado',
        headline: postData.ctaTitle || 'Agende sua consulta',
        highlightText: postData.ctaHighlight || '',
        description: postData.ctaSubtitle || '',
        ctaBoxText: postData.ctaCallout || 'Link na bio!',
        authorName: 'Isabela Muñoz',
        authorTitle: 'Nutrição Clínica, Esportiva & Performance • ACSM'
      };
    } else {
      newSlide = {
        id: Date.now(),
        type: 'content',
        stepNumber: String(existingSlides.length).padStart(2, '0'),
        badge: postData.badge || 'Dica Clínica',
        title: postData.headline || 'Título do Slide',
        highlightText: postData.highlightText || '',
        text: postData.description || ''
      };
    }

    // Insere antes da lâmina CTA final se existir
    let updated;
    const lastSlide = existingSlides[existingSlides.length - 1];
    if (existingSlides.length > 1 && lastSlide && lastSlide.type === 'cta' && newSlide.type !== 'cta') {
      updated = [
        ...existingSlides.slice(0, existingSlides.length - 1),
        newSlide,
        lastSlide
      ];
    } else {
      updated = [...existingSlides, newSlide];
    }

    setPostData((prev) => ({ ...prev, format: 'carrossel', slides: updated }));
    setCurrentSlideIndex(updated.length - 1);
    setStatusMessage({ type: 'success', text: `Slide "${currentFormat}" adicionado ao carrossel com sucesso!` });
  };

  const handleConvertToCarousel = () => {
    setPostData((prev) => ({
      ...prev,
      format: 'carrossel',
      slides: (prev.slides && prev.slides.length > 0) ? prev.slides : DEFAULT_CAROUSEL_SLIDES
    }));
    setCurrentSlideIndex(0);
    setStatusMessage({ type: 'info', text: 'Publicação convertida em carrossel!' });
  };

  // Adiciona uma lâmina de qualquer formato ao carrossel pelo id do formato
  const addFormatAsSlide = (formatId) => {
    const existingSlides = (postData.slides && postData.slides.length > 0) ? postData.slides : DEFAULT_CAROUSEL_SLIDES;

    const formatLabels = {
      autoridade: 'Autoridade',
      prato: 'Prato & Performance',
      ciencia: 'Ciência vs Senso Comum',
      dicas: 'Dicas 01/02/03',
      cta: 'CTA de Consulta',
      manifesto: 'Manifesto Clínico'
    };

    let newSlide;
    if (formatId === 'cta' || formatId === 'manifesto') {
      newSlide = {
        id: Date.now(),
        type: 'cta',
        badge: formatId === 'manifesto'
          ? (postData.manifestoBadge || 'Manifesto Clínico')
          : (postData.ctaBadge || 'Acompanhamento Individualizado'),
        headline: formatId === 'manifesto'
          ? (postData.manifestoCitacao || 'A nutrição é a linguagem do seu corpo.')
          : (postData.ctaTitle || 'Chegou a hora da sua melhor versão'),
        highlightText: formatId === 'manifesto'
          ? (postData.manifestoHighlight || '')
          : (postData.ctaHighlight || ''),
        description: formatId === 'manifesto'
          ? (postData.manifestoCta || 'Link na Bio ↗')
          : (postData.ctaSubtitle || ''),
        ctaBoxText: formatId === 'manifesto'
          ? (postData.manifestoCta || 'Agende sua consulta pelo link da bio!')
          : (postData.ctaCallout || 'Link na bio!'),
        authorName: 'Isabela Muñoz',
        authorTitle: 'Nutrição Clínica, Esportiva & Performance • ACSM'
      };
    } else if (formatId === 'dicas') {
      newSlide = {
        id: Date.now(),
        type: 'content',
        stepNumber: String(existingSlides.length).padStart(2, '0'),
        badge: postData.dicasBadge || 'Dicas Clínicas',
        title: postData.dicasTitle || 'Dicas de Nutrição',
        highlightText: postData.dicasHighlight || '',
        text: [postData.dica1Text, postData.dica2Text, postData.dica3Text].filter(Boolean).join(' | '),
        tip: `💡 ${postData.dica1Title || ''} • ${postData.dica2Title || ''} • ${postData.dica3Title || ''}`
      };
    } else {
      newSlide = {
        id: Date.now(),
        type: 'content',
        stepNumber: String(existingSlides.length).padStart(2, '0'),
        badge: formatLabels[formatId] || formatId,
        title: postData.headline || postData.cienciaTitle || postData.dishHeadline || 'Slide de Conteúdo',
        highlightText: postData.highlightText || '',
        text: postData.description || postData.debateRightText || ''
      };
    }

    // Insere antes da lâmina CTA final se existir
    const lastSlide = existingSlides[existingSlides.length - 1];
    let updated;
    if (existingSlides.length > 1 && lastSlide && lastSlide.type === 'cta' && newSlide.type !== 'cta') {
      updated = [
        ...existingSlides.slice(0, existingSlides.length - 1),
        newSlide,
        lastSlide
      ];
    } else {
      updated = [...existingSlides, newSlide];
    }

    setPostData((prev) => ({ ...prev, format: 'carrossel', slides: updated }));
    setCurrentSlideIndex(updated.length - 1);
    setStatusMessage({ type: 'success', text: `Slide "${formatLabels[formatId] || formatId}" adicionado ao carrossel!` });
  };

  // Adiciona uma lâmina com configuração específica: modelo + cor + foto
  const addSlideWithConfig = ({ formatId, themeId, photoUrl }) => {
    // Se o post não estiver em modo carrossel, inicia uma lista limpa com 0 slides anteriores
    const existingSlides = (postData.format === 'carrossel' && Array.isArray(postData.slides))
      ? postData.slides
      : [];

    const formatLabels = {
      autoridade: 'Autoridade',
      prato: 'Prato & Performance',
      ciencia: 'Ciência vs Senso Comum',
      dicas: 'Dicas 01/02/03',
      cta: 'CTA de Consulta',
      manifesto: 'Manifesto Clínico',
      passo: 'Ponto / Passo Clínico'
    };

    // Metadados completos do slide baseados no formato selecionado
    let slideBase = {};
    if (formatId === 'autoridade') {
      slideBase = {
        badge: postData.badge || 'Nutrição de Precisão',
        tagline: postData.tagline || 'Performance & Saúde',
        headline: postData.headline || 'Por que dietas radicais destroem seu metabolismo e sua massa muscular?',
        highlightText: postData.highlightText || 'destroem seu metabolismo',
        description: postData.description || 'A restrição calórica sem periodização induz à perda de massa magra, desacelerando o gasto calórico diário e provocando o efeito rebote.',
        authorName: postData.authorName || 'Isabela Muñoz',
        authorTitle: postData.authorTitle || 'Nutrição Clínica, Esportiva & Performance'
      };
    } else if (formatId === 'prato') {
      slideBase = {
        dishCategory: postData.dishCategory || 'Pós-Treino Estratégico',
        dishHeadline: postData.dishHeadline || 'Recuperação Muscular & Reposição de Glicogênio',
        dishSubheadline: postData.dishSubheadline || 'A janela pós-exercício exige um balanço preciso de carboidratos de absorção equilibrada com fontes nobres de aminoácidos para acelerar a síntese proteica.',
        dishKcal: postData.dishKcal || '540',
        dishProteina: postData.dishProteina || '42g',
        dishCarbos: postData.dishCarbos || '58g',
        dishGorduras: postData.dishGorduras || '14g'
      };
    } else if (formatId === 'ciencia') {
      slideBase = {
        cienciaBadge: postData.cienciaBadge || 'American College of Sports Medicine',
        cienciaTitle: postData.cienciaTitle || 'Treinar em jejum queima mais gordura?',
        debateWrongTitle: postData.debateWrongTitle || 'Gasta mais gordura pura',
        debateWrongText: postData.debateWrongText || 'A oxidação de gordura momentânea pode ser levemente superior, porém a perda de intensidade no treino reduz o gasto calórico total do dia e compromete a musculatura.',
        debateRightTitle: postData.debateRightTitle || 'O balanço de 24h é soberano',
        debateRightText: postData.debateRightText || 'Estar nutrido permite manter volume e carga maiores de treino. O déficit energético ao longo do dia, e não o estômago vazio durante o exercício, dita o emagrecimento real.'
      };
    } else if (formatId === 'dicas') {
      slideBase = {
        dicasBadge: postData.dicasBadge || 'Nutrição de Elite',
        dicasTitle: postData.dicasTitle || '3 estratégias que aceleram seu resultado sem cortar o que você ama',
        dicasHighlight: postData.dicasHighlight || 'sem cortar o que você ama',
        dica1Num: postData.dica1Num || '01',
        dica1Title: postData.dica1Title || 'Distribua proteína em todas as refeições',
        dica1Text: postData.dica1Text || 'Mínimo de 25g por refeição para maximizar a síntese proteica e preservar massa magra.',
        dica2Num: postData.dica2Num || '02',
        dica2Title: postData.dica2Title || 'Priorize carboidratos ao redor do treino',
        dica2Text: postData.dica2Text || 'Glicogênio bem reposto = mais força, menos fadiga e recuperação acelerada.',
        dica3Num: postData.dica3Num || '03',
        dica3Title: postData.dica3Title || 'Ajuste as calorias por fase de treino',
        dica3Text: postData.dica3Text || 'Periodização calórica alinhada ao calendário de treino é o que separa resultado de estagnação.',
        dicasFooter: postData.dicasFooter || 'Salve e aplique esta semana!'
      };
    } else if (formatId === 'cta') {
      slideBase = {
        ctaBadge: postData.ctaBadge || 'Acompanhamento Individualizado',
        ctaTitle: postData.ctaTitle || 'Chegou a hora da sua nutrição trabalhar para a sua melhor versão',
        ctaHighlight: postData.ctaHighlight || 'sua melhor versão',
        ctaSubtitle: postData.ctaSubtitle || 'Cada organismo tem uma taxa metabólica única. Pare de seguir protocolos genéricos — periodize com precisão clínica e ACSM.',
        ctaBullet1: postData.ctaBullet1 || 'Periodização nutricional alinhada ao seu treino',
        ctaBullet2: postData.ctaBullet2 || 'Suplementação baseada em evidências (ACSM)',
        ctaBullet3: postData.ctaBullet3 || 'Ajustes semanais para resultados contínuos',
        ctaCallout: postData.ctaCallout || 'Agende sua consulta pelo link da bio e transforme sua performance!'
      };
    } else if (formatId === 'manifesto') {
      slideBase = {
        manifestoBadge: postData.manifestoBadge || 'Nutrição de Precisão • ACSM',
        manifestoCitacao: postData.manifestoCitacao || 'A nutrição não é uma dieta.\nÉ a linguagem que o seu corpo usa para alcançar a sua melhor versão.',
        manifestoHighlight: postData.manifestoHighlight || 'sua melhor versão',
        manifestoAutor: postData.manifestoAutor || 'Dra. Isabela Muñoz',
        manifestoTitulo: postData.manifestoTitulo || 'Nutricionista Clínica & Esportiva',
        manifestoCred: postData.manifestoCred || 'Certificação Internacional ACSM',
        manifestoCta: postData.manifestoCta || 'Agende sua consulta pelo link da bio ↗'
      };
    } else if (formatId === 'passo') {
      const nextStepNum = String(existingSlides.length + 1).padStart(2, '0');
      slideBase = {
        type: 'content',
        stepNumber: nextStepNum,
        badge: postData.passoBadge || `Ponto ${nextStepNum} • Estratégia Clínica`,
        title: postData.passoTitle || 'Superávit calórico disfarçado de comida saudável',
        highlightText: postData.passoHighlight || 'Superávit calórico',
        text: postData.passoText || 'Pasta de amendoim, azeite de oliva, castanhas e açaí puro são alimentos nobres, porém extremamente densos energeticamente. Uma colherada despretensiosa pode adicionar 150 kcal extras e anular todo o déficit calórico gerado pelo seu treino.',
        tip: postData.passoTip || '💡 Conduta clínica: use balança de precisão nas primeiras 2 a 3 semanas para recalibrar a percepção visual das porções.'
      };
    }

    const newSlide = {
      id: Date.now(),
      format: formatId,
      slideTheme: themeId || undefined,
      slidePhotoUrl: photoUrl !== undefined ? photoUrl : undefined,
      ...slideBase
    };

    // Adiciona SEMPRE 1 slide novo no final da lista
    const updated = [...existingSlides, newSlide];

    setPostData((prev) => ({ ...prev, format: 'carrossel', slides: updated }));
    setCurrentSlideIndex(updated.length - 1);
    const label = formatLabels[formatId] || formatId;
    setStatusMessage({ type: 'success', text: `Slide "${label}" adicionado ao carrossel!` });
  };

  // Reseta todos os slides e volta ao post único padrão
  const resetSlides = () => {
    setPostData((prev) => ({ ...prev, format: 'autoridade', slides: [] }));
    setCurrentSlideIndex(0);
    setStatusMessage({ type: 'info', text: 'Slides resetados. Post voltou ao modo único.' });
  };

  const removeSlide = (idxToRemove) => {
    const currentSlides = (postData.format === 'carrossel' && Array.isArray(postData.slides)) ? postData.slides : [];
    if (currentSlides.length <= 1) {
      // Se tiver só 1 slide e o usuário excluir, volta ao post único limpo
      resetSlides();
      return;
    }
    const updated = currentSlides.filter((_, idx) => idx !== idxToRemove);
    setPostData((prev) => ({ ...prev, slides: updated }));
    setCurrentSlideIndex((prev) => Math.min(prev, updated.length - 1));
    setStatusMessage({ type: 'info', text: 'Slide removido com sucesso.' });
  };

  // Geração com IA
  const handleGenerateWithAI = async (topic) => {
    setIsGeneratingAI(true);
    setStatusMessage(null);
    try {
      const generated = await generatePostContent({
        topic,
        format: postData.format,
        model: activeModel,
        callAiFn: callGeminiWithFallback
      });

      setPostData((prev) => ({
        ...prev,
        ...generated
      }));
      setCurrentSlideIndex(0);
      setStatusMessage({
        type: 'success',
        text: postData.format === 'carrossel'
          ? 'Carrossel completo de 5 slides e legenda gerados pela IA!'
          : 'Post e legenda gerados com sucesso pela IA!'
      });
    } catch (err) {
      console.error('Erro ao gerar post com IA:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao gerar post com IA.' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Geração de legenda com IA com base no contexto completo dos posts / slides
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const captionText = await generateInstagramCaption({
        postData,
        model: activeModel,
        callAiFn: callGeminiWithFallback
      });

      if (captionText) {
        setPostData((prev) => ({
          ...prev,
          caption: captionText
        }));
      }
    } catch (err) {
      console.error('Erro ao gerar legenda com IA:', err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Upload de foto personalizada
  const handleCustomPhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomPhotoUrl(url);
    setStatusMessage({ type: 'info', text: 'Foto atualizada com sucesso no preview!' });
  };

  // Restaurar foto oficial da Dra. Isabela
  const handleResetPhoto = () => {
    setCustomPhotoUrl(null);
    setStatusMessage({ type: 'info', text: 'Foto oficial da Dra. Isabela restaurada.' });
  };

  // Download do slide atual em 1080x1350 PNG
  const handleDownloadSingleImage = async () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);
    try {
      const node = canvasRef.current;
      const originalTransform = node.style.transform;
      node.style.transform = 'scale(1)';

      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 1,
        width: 1080,
        height: 1350,
        cacheBust: true
      });

      node.style.transform = originalTransform;

      const link = document.createElement('a');
      const safeTitle = (postData.headline || 'post-instagram')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 25);
      const slideSuffix = postData.format === 'carrossel' ? `-slide-${currentSlideIndex + 1}` : '';
      link.download = `dra-isabela-${safeTitle}${slideSuffix}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setStatusMessage({ type: 'success', text: 'Slide baixado em alta resolução (1080x1350 PNG)!' });
    } catch (err) {
      console.error('Erro ao renderizar imagem para download:', err);
      if (canvasRef.current) {
        canvasRef.current.style.transform = 'scale(0.5)';
      }
      setStatusMessage({ type: 'error', text: 'Não foi possível exportar a imagem. Tente novamente.' });
    } finally {
      setIsDownloading(false);
    }
  };

  // Download do Carrossel Completo (ZIP com todas as lâminas + legenda.txt)
  const handleDownloadCarouselZip = async () => {
    if (!canvasRef.current) return;
    const slides = postData.slides || [];
    if (slides.length === 0) return;

    setIsDownloading(true);
    const originalIndex = currentSlideIndex;
    const zip = new JSZip();

    try {
      for (let i = 0; i < slides.length; i++) {
        setDownloadProgress(`Gerando lâmina ${i + 1} de ${slides.length}...`);
        setCurrentSlideIndex(i);
        // Aguarda o ciclo de render do React
        await new Promise((resolve) => setTimeout(resolve, 180));

        const node = canvasRef.current;
        const originalTransform = node.style.transform;
        node.style.transform = 'scale(1)';

        const dataUrl = await toPng(node, {
          quality: 1.0,
          pixelRatio: 1,
          width: 1080,
          height: 1350,
          cacheBust: true
        });

        node.style.transform = originalTransform;

        const base64Data = dataUrl.split(',')[1];
        const slideNum = String(i + 1).padStart(2, '0');
        const slideName = i === 0 ? '01-capa' : i === slides.length - 1 ? `${slideNum}-fechamento-cta` : `${slideNum}-conteudo`;
        zip.file(`slide-${slideName}.png`, base64Data, { base64: true });
      }

      // Adiciona o arquivo de texto com a legenda pronta
      if (postData.caption) {
        zip.file('legenda-instagram.txt', postData.caption);
      }

      setDownloadProgress('Compactando arquivo ZIP...');
      const blob = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeTitle = (postData.headline || 'carrossel-instagram')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 25);
      link.download = `carrossel-dra-isabela-${safeTitle}-${Date.now()}.zip`;
      link.click();

      setStatusMessage({
        type: 'success',
        text: `Carrossel completo (${slides.length} lâminas + Legenda) baixado em ZIP com sucesso!`
      });
    } catch (err) {
      console.error('Erro ao gerar carrossel ZIP:', err);
      setStatusMessage({ type: 'error', text: 'Falha ao empacotar carrossel em ZIP. Tente baixar slide a slide.' });
    } finally {
      setCurrentSlideIndex(originalIndex);
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Busca e analisa dúvidas reais do WhatsApp dos pacientes
  const handleLoadWhatsAppIdeas = async () => {
    setIsLoadingWhatsApp(true);
    try {
      const ideas = await extractMarketingIdeasFromWhatsApp({
        callAiFn: callGeminiWithFallback,
        model: activeModel
      });
      setWhatsappIdeas(ideas);
      setStatusMessage({
        type: 'success',
        text: `Identificamos ${ideas.length} ideias com base nas conversas do WhatsApp!`
      });
      return ideas;
    } catch (err) {
      console.error('Erro ao analisar mensagens do WhatsApp:', err);
      setStatusMessage({ type: 'error', text: 'Não foi possível analisar as mensagens do WhatsApp agora.' });
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  // Busca e analisa temas em alta na web e redes sociais
  const handleLoadWebTopics = async () => {
    setIsLoadingWeb(true);
    try {
      const topics = await fetchTrendingWebTopics({
        callAiFn: callGeminiWithFallback,
        model: activeModel
      });
      setTrendingWebTopics(topics);
      setStatusMessage({
        type: 'success',
        text: `Identificamos ${topics.length} tendências em alta na internet e redes!`
      });
      return topics;
    } catch (err) {
      console.error('Erro ao buscar tendências da web:', err);
      setStatusMessage({ type: 'error', text: 'Não foi possível buscar tendências da web agora.' });
    } finally {
      setIsLoadingWeb(false);
    }
  };

  return {
    postData,
    setPostData,
    currentTheme,
    setCurrentTheme,
    customPhotoUrl,
    currentSlideIndex,
    setCurrentSlideIndex,
    goToSlide,
    nextSlide,
    prevSlide,
    addSlide,
    addCurrentPostAsSlide,
    addFormatAsSlide,
    addSlideWithConfig,
    resetSlides,
    removeSlide,
    isGeneratingAI,
    isGeneratingCaption,
    handleGenerateCaption,
    isDownloading,
    downloadProgress,
    statusMessage,
    setStatusMessage,
    whatsappIdeas,
    isLoadingWhatsApp,
    handleLoadWhatsAppIdeas,
    trendingWebTopics,
    isLoadingWeb,
    handleLoadWebTopics,
    canvasRef,
    handleGenerateWithAI,
    handleCustomPhotoUpload,
    handleResetPhoto,
    handleDownloadSingleImage,
    handleDownloadCarouselZip,
    handleConvertToCarousel
  };
}
