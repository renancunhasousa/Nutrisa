import React from 'react';

/**
 * Ícone de Abacate (Lipídios / Gorduras) no padrão de traço Lucide (24x24, stroke 2px).
 * Representa lipídios e gorduras boas na prescrição nutricional clínica.
 */
export function LipidIcon({ className = 'w-3.5 h-3.5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Silhueta externa do abacate */}
      <path d="M12 2.5C8 2.5 5.5 7 5.5 12.5C5.5 17.5 8.2 21.5 12 21.5C15.8 21.5 18.5 17.5 18.5 12.5C18.5 7 16 2.5 12 2.5Z" />
      {/* Caroço central */}
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}
