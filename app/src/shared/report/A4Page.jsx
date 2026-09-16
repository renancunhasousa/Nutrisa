import React from 'react';

/**
 * Wrapper de página A4 pronto para impressão.
 * Aplica o tamanho, margens e a quebra de página correta automaticamente.
 *
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export default function A4Page({ children, className = '' }) {
  return (
    <div
      className={`a4-print-page bg-white w-full max-w-[210mm] mx-auto ${className}`}
      style={{ minHeight: '297mm', boxSizing: 'border-box' }}
    >
      {children}
    </div>
  );
}
