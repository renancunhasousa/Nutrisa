import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

export function SignaturePad({ onSave, onCancel }) {
  const sigCanvas = useRef(null);
  const [error, setError] = useState('');

  const clear = () => {
    sigCanvas.current.clear();
    setError('');
    onSave(null);
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      onSave(null);
      return;
    }
    // Usando getCanvas() em vez de getTrimmedCanvas() para evitar bug com Vite
    const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white/50 relative">
        <SignatureCanvas 
          ref={sigCanvas} 
          penColor="black"
          onEnd={save}
          canvasProps={{ className: 'w-full h-48 cursor-crosshair' }} 
        />
        {error && (
          <p className="absolute bottom-2 left-2 text-xs text-rose-500 bg-white/90 px-2 py-1 rounded shadow-sm">
            {error}
          </p>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <button 
          type="button"
          onClick={clear}
          className="flex items-center text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5 mr-1" />
          Limpar
        </button>
        
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-600 hover:text-slate-800 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
