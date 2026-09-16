import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TYPES = {
  success: {
    bg: 'bg-emerald-600',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-rose-600',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-sky-600',
    Icon: Info,
  },
};

/**
 * Toast de notificação flutuante (canto inferior direito).
 *
 * @param {{ message: string, type?: 'success'|'error'|'warning'|'info' }} props
 */
export default function Toast({ message, type = 'info' }) {
  if (!message) return null;
  const { bg, Icon } = TYPES[type] || TYPES.info;
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-bounce-in z-50 ${bg}`}
      role="status"
      aria-live="polite"
    >
      <Icon size={18} aria-hidden="true" />
      <span className="text-xs font-bold">{message}</span>
    </div>
  );
}
