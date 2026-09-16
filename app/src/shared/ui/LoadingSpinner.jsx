import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Spinner de carregamento centralizado com ícone animado.
 *
 * @param {{ message?: string, size?: 'sm'|'md'|'lg' }} props
 */
export default function LoadingSpinner({ message = 'Carregando...', size = 'md' }) {
  const iconSizes = { sm: 28, md: 48, lg: 64 };
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-12"
      role="status"
      aria-label={message}
    >
      <div className="relative">
        <Sparkles
          size={iconSize}
          className="text-emerald-500 animate-bounce"
          aria-hidden="true"
        />
      </div>
      {message && (
        <p className="text-sm font-semibold text-slate-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}
