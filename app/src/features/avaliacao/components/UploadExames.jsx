import React from 'react';

import { Sparkles, FileText, Scale, Zap, RefreshCw, CloudUpload } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function UploadExames() {
const { currentStep, adipometryFile, setAdipometryFile, bioimpedanceFile, setBioimpedanceFile, isAnalyzing, analysisProgress, processFilesWithGemini, loadDemoData } = useAvaliacaoContext();
return (<>        {/* STEP 1: UPLOAD SCREEN - EXACT MOCKUP STYLE */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in mt-4">
            
            {/* Header Title & Subtitle */}
            <div className="text-center space-y-2 pt-2 pb-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Plataforma de Geração de Laudo Integrado
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto font-normal">
                Extração, cruzamento e interpretação automática de parâmetros antropométricos e de composição corporal, com validação clínica.
              </p>
            </div>

            {/* Dropzones Cards (Fundo Branco Puro com Borda Pontilhada Suave) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              
              {/* Card 1: Adipometria */}
              <div className={`bg-white rounded-3xl p-8 text-center transition-all duration-300 border-2 border-dashed flex flex-col justify-between shadow-xs hover:shadow-md ${
                adipometryFile 
                  ? 'border-emerald-500 bg-emerald-50/20' 
                  : 'border-slate-300/90 hover:border-emerald-500'
              }`}>
                <div>
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 transition-transform hover:scale-105">
                    <CloudUpload className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-center space-x-2">
                    <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laudo de Adipometria</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 mb-6 max-w-xs mx-auto">
                    Dobras cutâneas, perímetros, circunferências e protocolo Jackson & Pollock.
                  </p>
                </div>

                <div>
                  {adipometryFile ? (
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{adipometryFile.name}</span>
                      </div>
                      <button 
                        onClick={() => setAdipometryFile(null)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 px-2 py-0.5 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-full transition-all border border-slate-200 shadow-2xs active:scale-95">
                      ou Selecionar Arquivo
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={e => e.target.files?.[0] && setAdipometryFile(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Card 2: Bioimpedância */}
              <div className={`bg-white rounded-3xl p-8 text-center transition-all duration-300 border-2 border-dashed flex flex-col justify-between shadow-xs hover:shadow-md ${
                bioimpedanceFile 
                  ? 'border-emerald-500 bg-emerald-50/20' 
                  : 'border-slate-300/90 hover:border-emerald-500'
              }`}>
                <div>
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 transition-transform hover:scale-105">
                    <CloudUpload className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-center space-x-2">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laudo de Bioimpedância (BIA)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 mb-6 max-w-xs mx-auto">
                    Avaliação multifrequência InBody, AvaBio, Seca ou equivalente.
                  </p>
                </div>

                <div>
                  {bioimpedanceFile ? (
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{bioimpedanceFile.name}</span>
                      </div>
                      <button 
                        onClick={() => setBioimpedanceFile(null)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 px-2 py-0.5 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-full transition-all border border-slate-200 shadow-2xs active:scale-95">
                      ou Selecionar Arquivo
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={e => e.target.files?.[0] && setBioimpedanceFile(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions Card (Barra Branca com Botão Verde Esmeralda) */}
            <div className="bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto mt-6">
              <div className="text-left space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center">
                  <Sparkles className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                  Processamento com Inteligência Artificial
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Os valores dos laudos serão extraídos, unificados e calibrados automaticamente pelo motor Gemini com validação clínica.
                </p>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="px-4 py-2.5 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center space-x-1.5 hover:bg-slate-100/80 rounded-full"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Carregar Dados Demo</span>
                </button>

                <button
                  type="button"
                  onClick={processFilesWithGemini}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 disabled:opacity-50 active:scale-95"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interpretar Laudos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isAnalyzing && (
              <div className="p-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-2xl text-emerald-900 text-xs font-semibold text-center animate-pulse shadow-sm max-w-5xl mx-auto">
                {analysisProgress}
              </div>
            )}
          </div>
        )}

</>);
}
