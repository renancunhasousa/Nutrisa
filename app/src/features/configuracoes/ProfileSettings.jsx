import React from 'react';

import { User } from 'lucide-react';

export default function ProfileSettings({ settings }) {
const { nutritionist, setNutritionist, activeModal, setActiveModal } = settings;
return (<>      {/* PANEL 1: PROFILE & PRINTING DENTISTRY MODAL */}
      {activeModal === 'profile' && (
        <div className="bg-slate-900 text-slate-100 p-5 border-b border-slate-700 print:hidden transition-all shadow-xl animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center text-emerald-400">
                <User className="w-4 h-4 mr-1.5 text-emerald-400" /> Perfil Profissional da Nutricionista (Dados de Impressão)
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                Utilizado nos cabeçalhos e rodapés dos laudos
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-emerald-400 mb-1 font-medium">Nome Completo</label>
                <input 
                  type="text" 
                  value={nutritionist.name} 
                  onChange={e => setNutritionist({...nutritionist, name: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-emerald-400 mb-1 font-medium">CRN / Registro Profissional</label>
                <input 
                  type="text" 
                  value={nutritionist.crn} 
                  onChange={e => setNutritionist({...nutritionist, crn: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-emerald-400 mb-1 font-medium">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={nutritionist.phone} 
                  onChange={e => setNutritionist({...nutritionist, phone: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-emerald-400 mb-1 font-medium">E-mail Profissional</label>
                <input 
                  type="text" 
                  value={nutritionist.email} 
                  onChange={e => setNutritionist({...nutritionist, email: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-emerald-400 mb-1 font-medium">Clínica / Consultório</label>
                <input 
                  type="text" 
                  value={nutritionist.clinic} 
                  onChange={e => setNutritionist({...nutritionist, clinic: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-emerald-400 mb-1 font-medium">Endereço Completo</label>
                <input 
                  type="text" 
                  value={nutritionist.address} 
                  onChange={e => setNutritionist({...nutritionist, address: e.target.value})}
                  className="w-full bg-emerald-900 border border-emerald-700 rounded p-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-1">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 py-1.5 rounded transition shadow"
              >
                Salvar & Concluir
              </button>
            </div>
          </div>
        </div>
      )}

</>);
}
