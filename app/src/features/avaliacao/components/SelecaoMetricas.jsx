import React from 'react';

import { Sparkles, ArrowRight, ArrowLeft, Activity, User, Sliders, Scale } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function SelecaoMetricas() {
const { currentStep, setCurrentStep, isGeneratingAI, extractedData, setExtractedData, biaEquipment, setBiaEquipment, anthropometricMethod, setAnthropometricMethod, customValues, generateAIAnalysis, handleSourceChange, handleCustomValueChange, getFinalValue } = useAvaliacaoContext();
return (<>        {/* STEP 2: COMPARATIVE TABLE & SELECTION KEYS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Header / Info box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Conferência e Seleção de Parâmetros</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione a chave correspondente para escolher se prefere o valor da <strong className="font-semibold text-teal-800">Bioimpedância</strong> ou da <strong className="font-semibold text-emerald-800">Adipometria</strong> para compor o laudo final.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg flex items-center transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow flex items-center transition"
                >
                  Gerar Laudo Final <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </div>

            {/* General Patient & Methods Settings Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Nome do Paciente</label>
                <input 
                  type="text" 
                  value={extractedData.patient.name}
                  onChange={e => setExtractedData({
                    ...extractedData, 
                    patient: {...extractedData.patient, name: e.target.value}
                  })}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Equipamento de Bioimpedância Utilizado</label>
                <input 
                  type="text" 
                  value={biaEquipment}
                  onChange={e => setBiaEquipment(e.target.value)}
                  placeholder="Ex: InBody 270 / Biodynamics 310"
                  className="w-full border border-teal-300 bg-teal-50/30 rounded p-2 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Método Antropométrico Utilizado</label>
                <input 
                  type="text" 
                  list="anthropometricMethods"
                  value={anthropometricMethod}
                  onChange={e => setAnthropometricMethod(e.target.value)}
                  placeholder="Ex: Jackson & Pollock 7 Dobras"
                  className="w-full border border-emerald-300 bg-emerald-50/30 rounded p-2 text-slate-800 font-medium"
                />
                <datalist id="anthropometricMethods">
                  <option value="Protocolo Jackson & Pollock (7 Dobras)" />
                  <option value="Protocolo Jackson & Pollock (3 Dobras)" />
                  <option value="Protocolo Durnin & Womersley (4 Dobras)" />
                  <option value="Protocolo Faulkner (4 Dobras)" />
                  <option value="Protocolo Guedes (3 Dobras)" />
                  <option value="Protocolo Yuhasz (6 Dobras)" />
                </datalist>
              </div>
            </div>

            {/* Metrics Selection Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                  <Sliders className="w-4 h-4 text-emerald-600 mr-2" />
                  Parâmetros Identificados e Chaves de Seleção
                </h3>
                <span className="text-xs text-slate-500">
                  Valores obtidos nos laudos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <th className="p-3 font-semibold">Parâmetro / Título</th>
                      <th className="p-3 font-semibold text-center text-teal-800 bg-teal-50/50">Valor Bioimpedância</th>
                      <th className="p-3 font-semibold text-center text-emerald-800 bg-emerald-50/50">Valor Adipometria</th>
                      <th className="p-3 font-semibold text-center min-w-[220px]">Fonte Selecionada no Laudo Final</th>
                      <th className="p-3 font-semibold text-right">Valor Final Utilizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedData.metrics.map((m) => {
                      const finalVal = getFinalValue(m);
                      return (
                        <tr key={m.key} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-medium text-slate-800">
                            <div>{m.title}</div>
                            <span className="text-[10px] text-slate-400 font-normal">Faixa ideal: {m.idealMin} - {m.idealMax} {m.unit}</span>
                          </td>

                          {/* BIA Value Cell */}
                          <td className="p-3 text-center bg-teal-50/20">
                            {m.biaValue !== null ? (
                              <span className="font-semibold text-teal-900 bg-teal-100/60 px-2 py-0.5 rounded">
                                {m.biaValue} {m.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">N/A</span>
                            )}
                          </td>

                          {/* Adipometry Value Cell */}
                          <td className="p-3 text-center bg-emerald-50/20">
                            {m.adipometryValue !== null ? (
                              <span className="font-semibold text-emerald-900 bg-emerald-100/60 px-2 py-0.5 rounded">
                                {m.adipometryValue} {m.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">N/A</span>
                            )}
                          </td>

                          {/* Selection Switch / Toggle Buttons */}
                          <td className="p-3 text-center">
                            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                              <button
                                type="button"
                                disabled={m.biaValue === null}
                                onClick={() => handleSourceChange(m.key, 'bia')}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                  m.selected === 'bia' 
                                    ? 'bg-teal-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-30'
                                }`}
                              >
                                Bioimpedância
                              </button>

                              <button
                                type="button"
                                disabled={m.adipometryValue === null}
                                onClick={() => handleSourceChange(m.key, 'adipometry')}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                  m.selected === 'adipometry' 
                                    ? 'bg-emerald-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-30'
                                }`}
                              >
                                Adipometria
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSourceChange(m.key, 'custom')}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                  m.selected === 'custom' 
                                    ? 'bg-amber-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Personalizado
                              </button>
                            </div>

                            {/* Custom value input if custom selected */}
                            {m.selected === 'custom' && (
                              <div className="mt-2">
                                <input 
                                  type="number"
                                  step="0.1"
                                  placeholder="Digite..."
                                  value={customValues[m.key] || ''}
                                  onChange={e => handleCustomValueChange(m.key, parseFloat(e.target.value))}
                                  className="w-24 text-center border border-amber-400 rounded p-1 text-xs"
                                />
                              </div>
                            )}
                          </td>

                          {/* Final Value Cell */}
                          <td className="p-3 text-right font-bold text-slate-900">
                            <span className="text-sm bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                              {finalVal} {m.unit}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dobras Cutâneas & Circunferências Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Dobras Cutâneas (Editável) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-emerald-800 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-1.5 text-emerald-600" /> Dobras Cutâneas (mm) - Editável
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extractedData.skinfolds.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 gap-2 shadow-2xs">
                      <span className="text-slate-700 font-semibold">{s.site}:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          step="0.1"
                          value={s.value ?? ''}
                          onChange={e => {
                            const newSkinfolds = [...extractedData.skinfolds];
                            newSkinfolds[idx] = { ...s, value: parseFloat(e.target.value) || 0 };
                            setExtractedData({ ...extractedData, skinfolds: newSkinfolds });
                          }}
                          className="w-16 text-right font-bold text-slate-900 text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 font-medium">mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circunferências (Editável) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-teal-800 mb-3 flex items-center">
                  <Scale className="w-4 h-4 mr-1.5 text-teal-600" /> Perímetros e Circunferências (cm) - Editável
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extractedData.circumferences.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 gap-2 shadow-2xs">
                      <span className="text-slate-700 font-semibold">{c.site}:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          step="0.1"
                          value={c.value ?? ''}
                          onChange={e => {
                            const newCircumferences = [...extractedData.circumferences];
                            newCircumferences[idx] = { ...c, value: parseFloat(e.target.value) || 0 };
                            setExtractedData({ ...extractedData, circumferences: newCircumferences });
                          }}
                          className="w-16 text-right font-bold text-slate-900 text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                        <span className="text-[10px] text-slate-500 font-medium">cm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análise Segmentar por Membro (Editável) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-1 md:col-span-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-emerald-800 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-emerald-600" /> Análise Segmentar de Massa Magra & Gordura (Editável)
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">Ajuste a Massa Magra (kg e % ideal) e Gordura (kg e % ideal) medidos pela Bioimpedância Octopolar para cada segmento:</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  {[
                    { key: "rightArm", title: "Braço Direito (BD)", hasFat: true },
                    { key: "leftArm", title: "Braço Esquerdo (BE)", hasFat: true },
                    { key: "trunk", title: "Tronco (TR)", hasFat: true },
                    { key: "rightLeg", title: "Perna Direita (PD)", hasFat: true },
                    { key: "leftLeg", title: "Perna Esquerda (PE)", hasFat: true }
                  ].map(limb => {
                    const seg = extractedData.segmental?.[limb.key] || {};
                    return (
                      <div key={limb.key} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                        <strong className="text-[11px] font-bold text-slate-900 block border-b border-slate-100 pb-1.5">{limb.title}</strong>
                        
                        <div>
                          <label className="text-[9.5px] font-bold text-emerald-800 block uppercase">Massa Magra (kg)</label>
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <input 
                              type="number"
                              step="0.01"
                              value={seg.leanMass || ''}
                              onChange={e => setExtractedData({
                                ...extractedData,
                                segmental: {
                                  ...extractedData.segmental,
                                  [limb.key]: { ...seg, leanMass: parseFloat(e.target.value) || 0 }
                                }
                              })}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="kg"
                            />
                            <input 
                              type="number"
                              value={seg.leanMassRatio || ''}
                              onChange={e => setExtractedData({
                                ...extractedData,
                                segmental: {
                                  ...extractedData.segmental,
                                  [limb.key]: { ...seg, leanMassRatio: parseInt(e.target.value) || 0 }
                                }
                              })}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="% Ideal"
                            />
                          </div>
                        </div>

                        {limb.hasFat && (
                          <div>
                            <label className="text-[9.5px] font-bold text-amber-800 block uppercase">Gordura (kg)</label>
                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                              <input 
                                type="number"
                                step="0.01"
                                value={seg.fatMass || ''}
                                onChange={e => setExtractedData({
                                  ...extractedData,
                                  segmental: {
                                    ...extractedData.segmental,
                                    [limb.key]: { ...seg, fatMass: parseFloat(e.target.value) || 0 }
                                  }
                                })}
                                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                placeholder="kg"
                              />
                              <input 
                                type="number"
                                value={seg.fatMassRatio || ''}
                                onChange={e => setExtractedData({
                                  ...extractedData,
                                  segmental: {
                                    ...extractedData.segmental,
                                    [limb.key]: { ...seg, fatMassRatio: parseInt(e.target.value) || 0 }
                                  }
                                })}
                                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                placeholder="% Ideal"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* AI Clinical Remarks Editor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-900 text-xs uppercase tracking-wide text-amber-800 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" /> Parecer Nutricional Integrado (IA / Editável)
                </label>
                <button
                  onClick={generateAIAnalysis}
                  disabled={isGeneratingAI}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-xl flex items-center transition shadow-2xs disabled:opacity-50 active:scale-95"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1.5" /> Gerar Diagnóstico com IA
                    </>
                  )}
                </button>
              </div>
              <textarea 
                rows={10}
                maxLength={1100}
                value={extractedData.aiAnalysisText}
                onChange={e => setExtractedData({...extractedData, aiAnalysisText: e.target.value})}
                className={`w-full border rounded-xl p-3.5 text-xs text-slate-800 bg-white leading-relaxed focus:ring-2 focus:outline-none transition-all ${
                  (extractedData.aiAnalysisText?.length || 0) >= 1000 
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/10' 
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-[10px] font-bold ${
                  (extractedData.aiAnalysisText?.length || 0) >= 1000 ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {(extractedData.aiAnalysisText?.length || 0)} / 1100 caracteres (limite p/ paginação do PDF)
                </span>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition"
              >
                Voltar para Upload
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-md transition flex items-center"
              >
                Visualizar Laudo Final <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>

          </div>
        )}

</>);
}
