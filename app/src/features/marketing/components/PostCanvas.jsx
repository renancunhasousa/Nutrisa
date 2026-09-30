import React, { forwardRef } from 'react';
import defaultDraPhoto from '../../../assets/dra_isabela.png';
import { POST_THEMES } from '../services/postGeneratorService.js';

export const PostCanvas = forwardRef(function PostCanvas(
  {
    postData: rawPostData,
    theme = 'marrom',
    customPhotoUrl = null,
    scale = 0.5,
    dishPhotoUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
    currentSlideIndex = 0
  },
  ref
) {
  const slides = rawPostData.slides && rawPostData.slides.length > 0 ? rawPostData.slides : [];
  const isCarousel = rawPostData.format === 'carrossel';
  const currentSlide = isCarousel ? (slides[currentSlideIndex] || slides[0] || {}) : {};
  const totalSlides = slides.length || 1;

  // Formato ativo: se for carrossel, cada slide pode ter seu próprio formato (autoridade, prato, ciencia, dicas, cta, manifesto)
  const activeFormat = isCarousel
    ? (currentSlide.format || (currentSlide.type === 'cover' ? 'autoridade' : (currentSlide.type === 'cta' ? 'cta' : 'carrossel')))
    : rawPostData.format;

  // Mescla dados do slide atual com os dados gerais do post, atualizando o format ativo
  const postData = isCarousel
    ? { ...rawPostData, ...currentSlide, format: activeFormat }
    : rawPostData;

  // Slide-level overrides: cada slide pode ter seu próprio tema e foto
  const resolvedTheme = currentSlide.slideTheme || theme;
  const resolvedPhotoUrl = currentSlide.slidePhotoUrl !== undefined ? currentSlide.slidePhotoUrl : customPhotoUrl;

  const activeTheme = POST_THEMES.find(t => t.id === resolvedTheme) || POST_THEMES[0];
  const photoSrc = resolvedPhotoUrl || defaultDraPhoto;
  const effectiveDishPhoto = (isCarousel && currentSlide.slidePhotoUrl)
    ? currentSlide.slidePhotoUrl
    : (customPhotoUrl || postData.dishPhotoUrl || dishPhotoUrl);

  // Renderiza o título com a parte destacada em degradê
  const renderHighlightedHeadline = (headline, highlight) => {
    if (!highlight || !headline || !headline.includes(highlight)) {
      return headline;
    }
    const parts = headline.split(highlight);
    return (
      <>
        {parts[0]}
        <span
          style={{
            color: activeTheme.accentColor,
            display: 'inline'
          }}
        >
          {highlight}
        </span>
        {parts.slice(1).join(highlight)}
      </>
    );
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-2xl transition-all"
      style={{
        width: 1080 * scale,
        height: 1350 * scale,
        border: `1px solid ${activeTheme.borderGold}`
      }}
    >
      {/* O CANVAS REAL DE 1080 x 1350 */}
      <div
        ref={ref}
        id="instagram-post-render-canvas"
        style={{
          width: '1080px',
          height: '1350px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          background: activeTheme.canvasBg,
          color: activeTheme.textColor,
          fontFamily: "'Montserrat', sans-serif",
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          boxSizing: 'border-box'
        }}
      >
        {/* =========================================================
            FORMATO 1: DRA. ISABELA EXPLICA (AUTORIDADE & FOTO OFICIAL)
            ========================================================= */}
        {postData.format === 'autoridade' && (
          <>
            {/* Header com Badge e Assinatura */}
            <div className="flex justify-between items-center z-10 w-full">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: activeTheme.cardBg,
                  border: `1px solid ${activeTheme.borderGold}`,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  padding: '12px 26px',
                  borderRadius: '999px',
                  color: activeTheme.accentColor,
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {postData.badge}
              </div>
              <div className="flex items-center gap-4">
                {isCarousel && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: activeTheme.accentColor,
                      letterSpacing: '1px'
                    }}
                  >
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Conteúdo Principal (Texto) */}
            <div className="z-10" style={{ maxWidth: '530px', marginTop: '20px' }}>
              <div
                style={{
                  fontFamily: "'Allison', cursive",
                  fontSize: '66px',
                  color: activeTheme.accentColor,
                  lineHeight: '0.9',
                  marginBottom: '10px'
                }}
              >
                {postData.tagline}
              </div>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '58px',
                  lineHeight: '1.18',
                  fontWeight: 700,
                  color: activeTheme.headerColor,
                  marginBottom: '24px',
                  letterSpacing: '0.5px'
                }}
              >
                {renderHighlightedHeadline(postData.headline, postData.highlightText)}
              </div>
              {postData.description && (
                <div
                  style={{
                    background: activeTheme.cardBg,
                    border: `1px solid ${activeTheme.borderGold}`,
                    backdropFilter: 'blur(16px)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                    fontSize: '23px',
                    lineHeight: '1.55',
                    color: activeTheme.textColor,
                    fontWeight: 300
                  }}
                >
                  {postData.description}
                </div>
              )}
            </div>

            {/* Foto Oficial da Dra. Isabela com Enquadramento e Máscara */}
            <div
              style={{
                position: 'absolute',
                right: '0px',
                bottom: '0',
                width: '740px',
                height: '1160px',
                zIndex: 5,
                pointerEvents: 'none',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 12%, rgba(0,0,0,0.85) 28%, black 42%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 12%, rgba(0,0,0,0.85) 28%, black 42%, black 100%)'
              }}
            >
              <img
                src={photoSrc}
                alt="Dra. Isabela Muñoz"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  WebkitMaskImage: 'linear-gradient(to top, black 82%, rgba(0,0,0,0.4) 93%, transparent 100%)',
                  maskImage: 'linear-gradient(to top, black 82%, rgba(0,0,0,0.4) 93%, transparent 100%)'
                }}
              />
            </div>

            {/* Card de Rodapé da Dra. */}
            <div
              style={{
                zIndex: 10,
                background: activeTheme.cardBg,
                border: `1px solid ${activeTheme.borderGold}`,
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '24px 34px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '620px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: '26px',
                    fontWeight: 700,
                    color: activeTheme.headerColor
                  }}
                >
                  {postData.authorName || 'Isabela Muñoz'}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    color: activeTheme.accentColor,
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    marginTop: '4px'
                  }}
                >
                  {postData.authorTitle || 'Nutrição Clínica, Esportiva & Performance'}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: activeTheme.accentColor,
                  fontSize: '19px',
                  fontWeight: 600
                }}
              >
                <span>Deslize</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
          </>
        )}

        {/* =========================================================
            FORMATO 2: PRATO & PERFORMANCE DE ELITE (HUD NUTRICIONAL)
            ========================================================= */}
        {postData.format === 'prato' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Foto de Fundo do Prato */}
            <img
              src={effectiveDishPhoto}
              alt="Estratégia Nutricional"
              style={{
                position: 'absolute',
                top: '-80px',
                left: '-80px',
                width: '1080px',
                height: '1350px',
                maxWidth: 'none',
                minWidth: '1080px',
                minHeight: '1350px',
                objectFit: 'cover',
                objectPosition: 'center center',
                zIndex: 1,
                opacity: 0.70
              }}
            />
            {/* Gradiente de Fusão */}
            <div
              style={{
                position: 'absolute',
                top: '-80px',
                left: '-80px',
                width: '1080px',
                height: '1350px',
                maxWidth: 'none',
                minWidth: '1080px',
                minHeight: '1350px',
                background: activeTheme.id === 'tiffany'
                  ? 'linear-gradient(180deg, rgba(13,69,64, 0.94) 0%, rgba(13,69,64, 0.4) 40%, rgba(8,41,38, 0.97) 85%)'
                  : activeTheme.isDark
                    ? 'linear-gradient(180deg, rgba(37,33,29, 0.94) 0%, rgba(37,33,29, 0.4) 40%, rgba(20,18,15, 0.97) 85%)'
                    : 'linear-gradient(180deg, rgba(250,246,238, 0.95) 0%, rgba(250,246,238, 0.4) 40%, rgba(245,239,230, 0.97) 85%)',
                zIndex: 2
              }}
            />

            {/* Topo: Categoria + Logo */}
            <div className="relative z-10 flex justify-between items-center w-full">
              <div
                style={{
                  background: activeTheme.cardBg,
                  border: `1px solid ${activeTheme.borderGold}`,
                  backdropFilter: 'blur(16px)',
                  color: activeTheme.accentColor,
                  fontWeight: 800,
                  fontSize: '18px',
                  padding: '10px 24px',
                  borderRadius: '999px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {postData.dishCategory}
              </div>
              <div className="flex items-center gap-4">
                {isCarousel && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: activeTheme.accentColor,
                      letterSpacing: '1px'
                    }}
                  >
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Centro: Título e Descrição */}
            <div className="relative z-10" style={{ marginTop: '80px', maxWidth: '820px' }}>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '60px',
                  fontWeight: 700,
                  color: activeTheme.headerColor,
                  lineHeight: '1.18',
                  marginBottom: '16px'
                }}
              >
                {postData.dishHeadline}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: activeTheme.textColor,
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}
              >
                {postData.dishSubheadline}
              </div>
            </div>

            {/* HUD de Macronutrientes */}
            <div className="relative z-10 w-full">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  background: activeTheme.cardBg,
                  border: `1px solid ${activeTheme.borderGold}`,
                  backdropFilter: 'blur(18px)',
                  padding: '24px',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ textAlign: 'center', borderRight: `1px solid ${activeTheme.borderGold}`, padding: '10px' }}>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: activeTheme.hudValColor }}>{postData.dishKcal}</div>
                  <div style={{ fontSize: '15px', color: activeTheme.hudLblColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Kcal</div>
                </div>
                <div style={{ textAlign: 'center', borderRight: `1px solid ${activeTheme.borderGold}`, padding: '10px' }}>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: activeTheme.hudValColor }}>{postData.dishProteina}</div>
                  <div style={{ fontSize: '15px', color: activeTheme.hudLblColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Proteína</div>
                </div>
                <div style={{ textAlign: 'center', borderRight: `1px solid ${activeTheme.borderGold}`, padding: '10px' }}>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: activeTheme.hudValColor }}>{postData.dishCarbos}</div>
                  <div style={{ fontSize: '15px', color: activeTheme.hudLblColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Carboidratos</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: activeTheme.hudValColor }}>{postData.dishGorduras}</div>
                  <div style={{ fontSize: '15px', color: activeTheme.hudLblColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Gorduras</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-lg" style={{ color: activeTheme.accentColor }}>
                <span style={{ fontWeight: 700 }}>@nutri.isabelamunoz</span>
                <span>Salve para sua rotina esportiva ↗</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 3: CIÊNCIA vs. SENSO COMUM (ACSM & EVIDÊNCIAS)
            ========================================================= */}
        {postData.format === 'ciencia' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Header Centralizado */}
            <div className="text-center w-full z-10">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: `1px solid ${activeTheme.borderGold}`,
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  color: activeTheme.accentColor,
                  fontSize: '18px',
                  fontWeight: 700,
                  padding: '8px 24px',
                  borderRadius: '999px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '20px'
                }}
              >
                {postData.cienciaBadge}
              </div>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '54px',
                  lineHeight: '1.22',
                  color: activeTheme.headerColor,
                  fontWeight: 700
                }}
              >
                {postData.cienciaTitle}
              </div>
            </div>

            {/* Cards de Comparação */}
            <div className="flex flex-col gap-7 my-6 z-10">
              {/* Card Errado (Senso Comum) */}
              <div
                style={{
                  padding: '34px 38px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)'
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    letterSpacing: '1px',
                    flexShrink: 0
                  }}
                >
                  SENSO COMUM
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '30px',
                      color: activeTheme.headerColor,
                      marginBottom: '8px'
                    }}
                  >
                    "{postData.debateWrongTitle}"
                  </h4>
                  <p style={{ fontSize: '21px', lineHeight: '1.5', color: activeTheme.textColor, fontWeight: 300 }}>
                    {postData.debateWrongText}
                  </p>
                </div>
              </div>

              {/* Card Certo (Ciência Clínica) */}
              <div
                style={{
                  padding: '34px 38px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${activeTheme.borderStrong}`,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: activeTheme.cardBg,
                    color: activeTheme.accentColor,
                    border: `1px solid ${activeTheme.accentColor}`,
                    letterSpacing: '1px',
                    flexShrink: 0
                  }}
                >
                  CIÊNCIA CLÍNICA
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '30px',
                      color: activeTheme.headerColor,
                      marginBottom: '8px'
                    }}
                  >
                    "{postData.debateRightTitle}"
                  </h4>
                  <p style={{ fontSize: '21px', lineHeight: '1.5', color: activeTheme.textColor, fontWeight: 300 }}>
                    {postData.debateRightText}
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé Ciência */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${activeTheme.borderGold}`,
                paddingTop: '26px',
                zIndex: 10
              }}
            >
              <div>
                <div style={{ fontFamily: "'Amiri', serif", fontSize: '24px', color: activeTheme.headerColor, fontWeight: 700 }}>
                  Isabela Muñoz
                </div>
                <div style={{ color: activeTheme.accentColor, fontSize: '16px' }}>
                  Certificação Internacional ACSM
                </div>
              </div>
              <div style={{ fontSize: '19px', fontWeight: 600, color: activeTheme.accentColor }}>
                Envie para quem treina com você ↗
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 4: DICAS 01 / 02 / 03 (LISTA NUMERADA CLÍNICA)
            ========================================================= */}
        {postData.format === 'dicas' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Header: Badge + Assinatura */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${activeTheme.borderGold}`,
                  padding: '12px 26px',
                  borderRadius: '999px',
                  color: activeTheme.accentColor,
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {postData.dicasBadge || 'Nutrição de Elite'}
              </div>
              <div className="flex items-center gap-4">
                {isCarousel && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: activeTheme.accentColor,
                      letterSpacing: '1px'
                    }}
                  >
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Título Principal */}
            <div style={{ zIndex: 10, marginTop: '30px', marginBottom: '30px' }}>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '52px',
                  lineHeight: '1.2',
                  fontWeight: 700,
                  color: activeTheme.headerColor,
                  marginBottom: '10px'
                }}
              >
                {renderHighlightedHeadline(postData.dicasTitle, postData.dicasHighlight)}
              </div>
            </div>

            {/* Dicas Numeradas 01 / 02 / 03 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', zIndex: 10, flex: 1 }}>
              {[
                { num: postData.dica1Num || '01', title: postData.dica1Title, text: postData.dica1Text },
                { num: postData.dica2Num || '02', title: postData.dica2Title, text: postData.dica2Text },
                { num: postData.dica3Num || '03', title: postData.dica3Title, text: postData.dica3Text }
              ].map((dica) => (
                <div
                  key={dica.num}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '28px',
                    background: activeTheme.cardBg,
                    border: `1px solid ${activeTheme.borderStrong}`,
                    backdropFilter: 'blur(16px)',
                    borderRadius: '20px',
                    padding: '30px 36px',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.22)'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '72px',
                      fontWeight: 800,
                      lineHeight: '0.85',
                      color: activeTheme.accentColor,
                      opacity: 0.9,
                      flexShrink: 0,
                      minWidth: '70px'
                    }}
                  >
                    {dica.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Amiri', serif",
                        fontSize: '28px',
                        fontWeight: 700,
                        color: activeTheme.headerColor,
                        marginBottom: '8px',
                        lineHeight: '1.25'
                      }}
                    >
                      {dica.title}
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        lineHeight: '1.55',
                        color: activeTheme.textColor,
                        fontWeight: 300
                      }}
                    >
                      {dica.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${activeTheme.borderGold}`,
                paddingTop: '26px',
                marginTop: '28px',
                zIndex: 10
              }}
            >
              <div style={{ fontSize: '19px', fontWeight: 700, color: activeTheme.accentColor }}>
                @nutri.isabelamunoz
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTheme.cardBg,
                  border: `1px solid ${activeTheme.borderGold}`,
                  backdropFilter: 'blur(16px)',
                  color: activeTheme.accentColor,
                  fontWeight: 800,
                  fontSize: '17px',
                  padding: '10px 24px',
                  borderRadius: '999px'
                }}
              >
                {postData.dicasFooter || 'Salve e aplique esta semana!'}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 5: CTA DE CONSULTA (CHAMADA PARA AÇÃO)
            ========================================================= */}
        {postData.format === 'cta' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Header: Badge + Contador */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${activeTheme.borderGold}`,
                  padding: '12px 26px',
                  borderRadius: '999px',
                  color: activeTheme.accentColor,
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {postData.ctaBadge || 'Acompanhamento Individualizado'}
              </div>
              <div className="flex items-center gap-4">
                {isCarousel && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: activeTheme.accentColor,
                      letterSpacing: '1px'
                    }}
                  >
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Título Principal */}
            <div style={{ textAlign: 'center', zIndex: 10, marginTop: '30px' }}>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '60px',
                  lineHeight: '1.18',
                  fontWeight: 700,
                  color: activeTheme.headerColor,
                  marginBottom: '20px'
                }}
              >
                {renderHighlightedHeadline(postData.ctaTitle, postData.ctaHighlight)}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  lineHeight: '1.55',
                  color: activeTheme.textColor,
                  fontWeight: 300,
                  maxWidth: '820px',
                  margin: '0 auto'
                }}
              >
                {postData.ctaSubtitle}
              </div>
            </div>

            {/* Bullets de Benefício */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10, margin: '30px 0' }}>
              {[postData.ctaBullet1, postData.ctaBullet2, postData.ctaBullet3].filter(Boolean).map((bullet, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    background: activeTheme.cardBg,
                    border: `1px solid ${activeTheme.borderGold}`,
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    padding: '22px 28px'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: activeTheme.cardBg,
                      border: `1px solid ${activeTheme.borderGold}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTheme.accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 600,
                      color: activeTheme.headerColor,
                      lineHeight: '1.3'
                    }}
                  >
                    {bullet}
                  </div>
                </div>
              ))}
            </div>

            {/* Callout CTA */}
            <div
              style={{
                background: activeTheme.cardBg,
                border: `2px solid ${activeTheme.accentColor}`,
                backdropFilter: 'blur(18px)',
                borderRadius: '24px',
                padding: '36px 44px',
                textAlign: 'center',
                zIndex: 10,
                boxShadow: '0 20px 45px rgba(0,0,0,0.35)'
              }}
            >
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: activeTheme.headerColor,
                  lineHeight: '1.35'
                }}
              >
                {postData.ctaCallout || 'Agende sua consulta pelo link da bio e transforme sua performance! 🚀'}
              </div>
            </div>

            {/* Rodapé com foto perfil */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${activeTheme.borderGold}`,
                paddingTop: '24px',
                marginTop: '28px',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${activeTheme.accentColor}`,
                    flexShrink: 0
                  }}
                >
                  <img
                    src={photoSrc}
                    alt="Dra. Isabela Muñoz"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "'Amiri', serif", fontSize: '22px', fontWeight: 700, color: activeTheme.headerColor }}>
                    Isabela Muñoz
                  </div>
                  <div style={{ fontSize: '14px', color: activeTheme.accentColor, fontWeight: 500 }}>
                    Nutrição Clínica, Esportiva & Performance • ACSM
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: activeTheme.accentColor }}>
                Link na Bio ↗
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FORMATO 6: MANIFESTO CLÍNICO (FRASE DE IMPACTO EDITORIAL)
            ========================================================= */}
        {postData.format === 'manifesto' && (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Faixa decorativa diagonal no canto superior direito */}
            <div
              style={{
                position: 'absolute',
                top: '-120px',
                right: '-120px',
                width: '520px',
                height: '520px',
                borderRadius: '50%',
                background: activeTheme.gradientText,
                opacity: 0.07,
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '60px',
                right: '60px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: activeTheme.gradientText,
                opacity: 0.05,
                pointerEvents: 'none'
              }}
            />

            {/* Header: Badge + Assinatura */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: activeTheme.cardBg,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${activeTheme.borderGold}`,
                  padding: '12px 26px',
                  borderRadius: '999px',
                  color: activeTheme.accentColor,
                  fontWeight: 700,
                  fontSize: '17px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {postData.manifestoBadge || 'Nutrição de Precisão • ACSM'}
              </div>
              <div className="flex items-center gap-4">
                {isCarousel && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: activeTheme.accentColor,
                      letterSpacing: '1px'
                    }}
                  >
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* Linha decorativa de acento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10, margin: '50px 0 0' }}>
              <div style={{ height: '3px', width: '60px', background: activeTheme.gradientText, borderRadius: '2px' }} />
              <div style={{ height: '3px', flex: 1, background: activeTheme.borderGold, borderRadius: '2px' }} />
            </div>

            {/* Citação Principal — tipografia editorial grande */}
            <div style={{ zIndex: 10, flex: 1, display: 'flex', alignItems: 'center' }}>
              <div>
                {/* Aspas decorativas */}
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '140px',
                    lineHeight: '0.6',
                    color: activeTheme.accentColor,
                    opacity: 0.5,
                    marginBottom: '10px',
                    userSelect: 'none'
                  }}
                >
                  &ldquo;
                </div>
                <div
                  style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: '62px',
                    lineHeight: '1.25',
                    fontWeight: 700,
                    color: activeTheme.headerColor,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {postData.manifestoCitacao
                    ? postData.manifestoCitacao.split(postData.manifestoHighlight || '|||').map((part, i, arr) =>
                        i < arr.length - 1
                          ? <React.Fragment key={i}>{part}<span style={{ color: activeTheme.accentColor, display: 'inline' }}>{postData.manifestoHighlight}</span></React.Fragment>
                          : <React.Fragment key={i}>{part}</React.Fragment>
                      )
                    : 'A nutrição não é uma dieta.\nÉ a linguagem que o seu corpo usa para alcançar a sua melhor versão.'}
                </div>
                {/* Aspas fechando */}
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '140px',
                    lineHeight: '0.3',
                    color: activeTheme.accentColor,
                    opacity: 0.5,
                    textAlign: 'right',
                    userSelect: 'none'
                  }}
                >
                  &rdquo;
                </div>
              </div>
            </div>

            {/* Linha de separação inferior */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10, margin: '0 0 36px' }}>
              <div style={{ height: '3px', flex: 1, background: activeTheme.borderGold, borderRadius: '2px' }} />
              <div style={{ height: '3px', width: '60px', background: activeTheme.gradientText, borderRadius: '2px' }} />
            </div>

            {/* Rodapé: Autora + CTA */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                background: activeTheme.cardBg,
                border: `1px solid ${activeTheme.borderGold}`,
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '24px 32px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${activeTheme.accentColor}`,
                    flexShrink: 0
                  }}
                >
                  <img
                    src={photoSrc}
                    alt="Dra. Isabela Muñoz"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "'Amiri', serif", fontSize: '24px', fontWeight: 700, color: activeTheme.headerColor }}>
                    {postData.manifestoAutor || 'Dra. Isabela Muñoz'}
                  </div>
                  <div style={{ fontSize: '14px', color: activeTheme.accentColor, fontWeight: 500, marginTop: '2px' }}>
                    {postData.manifestoTitulo || 'Nutricionista Clínica & Esportiva'}
                  </div>
                  <div style={{ fontSize: '12px', color: activeTheme.textColor, opacity: 0.6, marginTop: '2px' }}>
                    {postData.manifestoCred || 'Certificação Internacional ACSM'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTheme.cardBg,
                  border: `1px solid ${activeTheme.borderGold}`,
                  backdropFilter: 'blur(16px)',
                  color: activeTheme.accentColor,
                  fontWeight: 800,
                  fontSize: '16px',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap'
                }}
              >
                {postData.manifestoCta || 'Link na Bio ↗'}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            CARROSSEL EDITORIAL & PONTO / PASSO CLÍNICO
            ========================================================= */}
        {(postData.format === 'carrossel' || postData.format === 'passo') && (
          <>
            {/* LÂMINA 1: CAPA DO CARROSSEL */}
            {currentSlide.type === 'cover' && (
              <>
                <div className="flex justify-between items-center z-10 w-full">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: activeTheme.cardBg,
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${activeTheme.borderGold}`,
                      padding: '12px 24px',
                      borderRadius: '999px',
                      color: activeTheme.accentColor,
                      fontWeight: 700,
                      fontSize: '17px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {currentSlide.badge || 'Guia Clínico'}
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: activeTheme.accentColor,
                        letterSpacing: '1px'
                      }}
                    >
                      01 / {String(totalSlides).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="z-10" style={{ maxWidth: '590px', marginTop: '30px' }}>
                  <div
                    style={{
                      fontFamily: "'Allison', cursive",
                      fontSize: '66px',
                      color: activeTheme.accentColor,
                      lineHeight: '0.9',
                      marginBottom: '10px'
                    }}
                  >
                    {currentSlide.tagline || 'Performance & Saúde'}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '58px',
                      lineHeight: '1.18',
                      fontWeight: 700,
                      color: activeTheme.headerColor,
                      marginBottom: '26px'
                    }}
                  >
                    {renderHighlightedHeadline(currentSlide.headline, currentSlide.highlightText)}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      lineHeight: '1.5',
                      color: activeTheme.textColor,
                      fontWeight: 300
                    }}
                  >
                    {currentSlide.description}
                  </div>
                </div>

                {/* Foto Oficial da Dra. */}
                <div
                  style={{
                    position: 'absolute',
                    right: '10px',
                    bottom: '0',
                    width: '640px',
                    height: '1020px',
                    zIndex: 5,
                    pointerEvents: 'none'
                  }}
                >
                  <img
                    src={photoSrc}
                    alt="Dra. Isabela Muñoz"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      maskImage: activeTheme.isDark
                        ? 'linear-gradient(to top, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%), linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%)'
                        : 'none',
                      WebkitMaskImage: activeTheme.isDark
                        ? 'linear-gradient(to top, black 85%, transparent 100%)'
                        : 'none'
                    }}
                  />
                </div>

                {/* Footer Capa */}
                <div
                  style={{
                    zIndex: 10,
                    background: activeTheme.cardBg,
                    border: `1px solid ${activeTheme.borderGold}`,
                    backdropFilter: 'blur(16px)',
                    borderRadius: '20px',
                    padding: '22px 32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '600px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'Amiri', serif", fontSize: '24px', fontWeight: 700, color: activeTheme.headerColor }}>
                      Isabela Muñoz
                    </div>
                    <div style={{ fontSize: '15px', color: activeTheme.accentColor, fontWeight: 500, marginTop: '2px' }}>
                      Nutrição Clínica, Esportiva & Performance
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: activeTheme.accentColor,
                      fontSize: '18px',
                      fontWeight: 700
                    }}
                  >
                    <span>{currentSlide.ctaIndicator || 'Deslize ➔'}</span>
                  </div>
                </div>
              </>
            )}

            {/* LÂMINAS DE CONTEÚDO / PONTO CLÍNICO (PASSO A PASSO) */}
            {(activeFormat === 'passo' || currentSlide.type === 'content' || postData.format === 'passo') && (
              <div className="w-full h-full flex flex-col justify-between z-10">
                {/* Header Conteúdo */}
                <div className="flex justify-between items-center w-full">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeTheme.cardBg,
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${activeTheme.borderGold}`,
                      padding: '10px 22px',
                      borderRadius: '999px',
                      color: activeTheme.accentColor,
                      fontWeight: 700,
                      fontSize: '16px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {postData.passoBadge || currentSlide.badge || postData.badge || `Ponto ${postData.stepNumber || currentSlide.stepNumber || currentSlideIndex + 1}`}
                  </div>

                  <div className="flex items-center gap-4">
                    {isCarousel && (
                      <span
                        style={{
                          fontSize: '17px',
                          fontWeight: 800,
                          color: activeTheme.accentColor,
                          letterSpacing: '1px'
                        }}
                      >
                        {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Miolo: Número Grande + Título + Explicação */}
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <div
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '110px',
                      fontWeight: 800,
                      lineHeight: '0.85',
                      color: activeTheme.accentColor,
                      opacity: 0.85,
                      marginBottom: '15px'
                    }}
                  >
                    {postData.stepNumber || currentSlide.stepNumber || String(currentSlideIndex + 1).padStart(2, '0')}
                  </div>

                  <div
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '52px',
                      lineHeight: '1.2',
                      fontWeight: 700,
                      color: activeTheme.headerColor,
                      marginBottom: '26px'
                    }}
                  >
                    {renderHighlightedHeadline(
                      postData.passoTitle || currentSlide.title || postData.title || 'Ponto de Estratégia Clínica',
                      postData.passoHighlight || currentSlide.highlightText || postData.highlightText
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '25px',
                      lineHeight: '1.6',
                      color: activeTheme.textColor,
                      fontWeight: 300,
                      marginBottom: '35px'
                    }}
                  >
                    {postData.passoText || currentSlide.text || postData.text}
                  </div>

                  {/* Caixa de Dica Prática */}
                  {(postData.passoTip || currentSlide.tip || postData.tip) && (
                    <div
                      style={{
                        background: activeTheme.cardBg,
                        border: `1px solid ${activeTheme.borderStrong}`,
                        backdropFilter: 'blur(16px)',
                        borderRadius: '20px',
                        padding: '26px 32px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '21px',
                          lineHeight: '1.5',
                          fontWeight: 500,
                          color: activeTheme.headerColor
                        }}
                      >
                        {postData.passoTip || currentSlide.tip || postData.tip}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé Conteúdo */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${activeTheme.borderGold}`,
                    paddingTop: '22px'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 600, color: activeTheme.accentColor }}>
                    Dra. Isabela Muñoz • Nutrição Esportiva
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: activeTheme.headerColor }}>
                    Deslize ➔
                  </div>
                </div>
              </div>
            )}

            {/* LÂMINA FINAL: CONCLUSÃO & CTA */}
            {currentSlide.type === 'cta' && (
              <div className="w-full h-full flex flex-col justify-between z-10">
                {/* Header CTA */}
                <div className="flex justify-between items-center w-full">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeTheme.cardBg,
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${activeTheme.borderGold}`,
                      padding: '10px 24px',
                      borderRadius: '999px',
                      color: activeTheme.accentColor,
                      fontWeight: 700,
                      fontSize: '16px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {currentSlide.badge || 'Acompanhamento Individualizado'}
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        color: activeTheme.accentColor,
                        letterSpacing: '1px'
                      }}
                    >
                      {String(totalSlides).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Centro CTA */}
                <div style={{ textAlign: 'center', maxWidth: '880px', margin: '40px auto 0' }}>
                  <div
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: '56px',
                      lineHeight: '1.2',
                      fontWeight: 700,
                      color: activeTheme.headerColor,
                      marginBottom: '24px'
                    }}
                  >
                    {renderHighlightedHeadline(currentSlide.headline, currentSlide.highlightText)}
                  </div>

                  <div
                    style={{
                      fontSize: '25px',
                      lineHeight: '1.6',
                      color: activeTheme.textColor,
                      fontWeight: 300,
                      marginBottom: '40px'
                    }}
                  >
                    {currentSlide.description}
                  </div>

                  {/* Card de Chamada para Ação */}
                  <div
                    style={{
                      background: activeTheme.cardBg,
                      border: `2px solid ${activeTheme.accentColor}`,
                      backdropFilter: 'blur(18px)',
                      borderRadius: '24px',
                      padding: '36px 40px',
                      boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
                      marginBottom: '20px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '24px',
                        lineHeight: '1.5',
                        fontWeight: 700,
                        color: activeTheme.headerColor
                      }}
                    >
                      {currentSlide.ctaBoxText || 'Salve este carrossel e agende sua consulta pelo link da bio!'}
                    </div>
                  </div>
                </div>

                {/* Rodapé CTA com Perfil da Dra. */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${activeTheme.borderGold}`,
                    paddingTop: '24px'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `2px solid ${activeTheme.accentColor}`,
                        boxShadow: '0 0 15px rgba(243, 169, 80, 0.3)'
                      }}
                    >
                      <img
                        src={photoSrc}
                        alt="Dra. Isabela Muñoz"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Amiri', serif", fontSize: '24px', fontWeight: 700, color: activeTheme.headerColor }}>
                        {currentSlide.authorName || 'Isabela Muñoz'}
                      </div>
                      <div style={{ fontSize: '15px', color: activeTheme.accentColor, fontWeight: 500 }}>
                        {currentSlide.authorTitle || 'Nutrição Clínica, Esportiva & Performance • ACSM'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeTheme.cardBg,
                      border: `1px solid ${activeTheme.borderGold}`,
                      backdropFilter: 'blur(16px)',
                      color: activeTheme.accentColor,
                      fontWeight: 800,
                      fontSize: '17px',
                      padding: '12px 28px',
                      borderRadius: '999px',
                      letterSpacing: '1px'
                    }}
                  >
                    <span>Link na Bio ↗</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
