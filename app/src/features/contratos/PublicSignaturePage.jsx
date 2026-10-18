import React, { useEffect, useState } from 'react';
import { getPublicContract, signRemoteContract } from './services/contracts';
import { SignaturePad } from './components/SignaturePad';
import logoPdf from '../../assets/logo.png';
import { isDraIsabelaProfile } from '../configuracoes/defaultProfile.js';

function getActiveNutritionist() {
  try {
    const raw = localStorage.getItem('nutrisa_nutritionist_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function PublicSignaturePage({ contractId }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [base64Signature, setBase64Signature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    getPublicContract(contractId)
      .then(data => {
        if (!data) throw new Error('Contrato não encontrado.');
        setContract(data);
        if (data.status === 'signed') setSigned(true);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [contractId]);

  const handleSign = async () => {
    if (!base64Signature) return alert('Por favor, assine o documento primeiro.');
    setIsSaving(true);
    try {
      await signRemoteContract(contractId, base64Signature);
      setSigned(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 animate-pulse">Carregando contrato...</p></div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-rose-500 font-bold">{error}</p></div>;
  }

  const activeNutri = getActiveNutritionist();
  const isDra = isDraIsabelaProfile(activeNutri);
  const headerTitle = activeNutri?.name || (isDra ? 'Dra. Isabela Muñoz Mendonça' : 'Consultório de Nutrição');
  const headerSubtitle = activeNutri?.title || (isDra ? 'Nutricionista Clínica e Esportiva' : 'Termo de Adesão e Acordo');

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-emerald-100 space-y-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✓</div>
          <h2 className="text-2xl font-black text-slate-800">Contrato Assinado!</h2>
          <p className="text-slate-500 text-sm">Obrigado, {contract?.patient_name}. Sua assinatura foi salva com sucesso e o consultório já foi notificado.</p>
          <img src={activeNutri?.logoUrl || logoPdf} alt="Logo" className="h-12 mx-auto opacity-70 mt-8 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:p-6 p-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white md:rounded-3xl shadow-xl overflow-hidden flex flex-col md:border border-slate-200">
        <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <img src={activeNutri?.logoUrl || logoPdf} alt="Logo" className="w-14 h-14 bg-white p-1.5 rounded-xl object-contain flex-shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase whitespace-nowrap truncate">{headerTitle}</h1>
              <p className="text-[10px] md:text-xs font-semibold text-emerald-400 uppercase tracking-wider whitespace-nowrap truncate">{headerSubtitle}</p>
            </div>
          </div>
          <div className="text-left md:text-right flex-shrink-0">
            <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
              Termo de Adesão e Acordo
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 text-sm text-slate-700 leading-relaxed overflow-y-auto bg-white">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-0.5">Paciente</p>
              <p className="text-slate-800 font-bold text-xs truncate">{contract?.patient_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-0.5">Plano</p>
              <p className="text-slate-800 font-bold text-xs truncate">{contract?.plan?.toUpperCase()}</p>
            </div>
          </div>

          {/<\/?(?:div|p|br|strong|b|em|i|u|s|ul|ol|li|h[1-3]|blockquote)\b/i.test(contract?.final_content || '') ? (
            <div 
              className="text-justify text-[13px] text-slate-800 leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:mb-1 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: contract?.final_content }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-justify text-[13px]">
              {contract?.final_content}
            </div>
          )}
        </div>

        <div className="bg-slate-100 p-6 md:p-8 border-t border-slate-200 mt-auto">
          <h3 className="font-bold text-slate-800 mb-4 text-center">Sua Assinatura</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
             <SignaturePad onSave={setBase64Signature} />
          </div>
          
          <button 
            onClick={handleSign}
            disabled={isSaving || !base64Signature}
            className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all shadow-md active:scale-95 flex justify-center items-center ${
              isSaving || !base64Signature ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isSaving ? 'Salvando...' : 'Confirmar Assinatura'}
          </button>
        </div>
      </div>
    </div>
  );
}
