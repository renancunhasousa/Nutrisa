import React from 'react';

/**
 * Cabeçalho de página padrão da NutrIsa (estilo aberto e limpo).
 *
 * @param {Object} props
 * @param {string} [props.category] - Tag/categoria superior (ex: "Base da clínica", "Operação WhatsApp")
 * @param {string} props.title - Título principal da ferramenta (H1)
 * @param {React.ReactNode} [props.badge] - Badge ou tag opcional exibida ao lado do título
 * @param {React.ReactNode} [props.description] - Subtítulo / descrição contextualizada
 * @param {React.ReactNode} [props.actions] - Elementos de ação (botões primários, secundários, menus)
 * @param {string} [props.className] - Classes CSS adicionais para o container do cabeçalho
 */
export default function PageHeader({
  category,
  title,
  badge,
  description,
  actions,
  className = '',
}) {
  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {category && (
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
            {category}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
