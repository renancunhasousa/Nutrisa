import React from 'react';
import { Droplets, Sparkles, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export function NotesSection({ plan, onUpdateField }) {
  const handleQuickWaterCalc = (mlPerKg) => {
    const weight = prompt('Qual o peso atual do paciente em kg? (Ex: 70)');
    const parsedWeight = parseFloat(weight);
    if (parsedWeight > 0) {
      const totalWater = Math.round(parsedWeight * mlPerKg);
      onUpdateField('water_intake_ml', totalWater);
    }
  };

  const defaultTemplates = [
    {
      label: 'Diretrizes Padrão de Hidratação e Mastigação',
      text: '• Beba pelo menos a quantidade recomendada de água ao longo do dia, evitando grandes volumes junto às refeições principais.\n• Mastigue devagar e evite distrações durante a alimentação.\n• Priorize temperos naturais como alho, cebola, azeite extravirgem, ervas frescas e limão.\n• Respeite os sinais de saciedade do seu corpo.',
    },
    {
      label: 'Orientações Pré e Pós Treino',
      text: '• Faça a refeição pré-treino com 45 a 60 minutos de antecedência para melhor digestão.\n• Hidrate-se bem antes, durante e após o exercício físico.\n• A refeição pós-treino deve fornecer carboidratos e proteínas para otimizar a recuperação muscular.',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Bloco de Hidratação */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Meta Diária de Hidratação</h3>
              <p className="text-xs text-slate-500">Calculada e destacada no relatório do paciente</p>
            </div>
          </div>

          {/* Atalhos de cálculo rápido */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Calcular:</span>
            <button
              type="button"
              onClick={() => handleQuickWaterCalc(35)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              title="Calcular 35ml por kg de peso"
            >
              35ml/kg
            </button>
            <button
              type="button"
              onClick={() => handleQuickWaterCalc(40)}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-lg cursor-pointer"
              title="Calcular 40ml por kg de peso (Atletas/Verão)"
            >
              40ml/kg
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            step="100"
            value={plan.water_intake_ml || 2500}
            onChange={(e) => onUpdateField('water_intake_ml', Number(e.target.value) || 0)}
            className="w-32 text-center text-sm font-bold text-teal-900 bg-teal-50/50 border border-teal-200 rounded-xl p-2.5 focus:border-teal-500 focus:outline-hidden"
          />
          <span className="text-xs font-semibold text-slate-600">ml por dia (≈ {((plan.water_intake_ml || 2500) / 1000).toFixed(1)} Litros)</span>
        </div>
      </div>

      {/* Bloco de Recados e Orientações Gerais */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Orientações e Recados Clínicos</h3>
              <p className="text-xs text-slate-500">Aparecerão ao final do plano alimentar entregue ao paciente</p>
            </div>
          </div>
        </div>

        {/* Modelos rápidos para aplicar em 1 clique */}
        <div className="flex flex-wrap gap-2">
          {defaultTemplates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const current = plan.general_notes ? `${plan.general_notes}\n\n` : '';
                onUpdateField('general_notes', `${current}${tpl.text}`);
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Inserir: {tpl.label}</span>
            </button>
          ))}
        </div>

        <div>
          <textarea
            rows={7}
            value={plan.general_notes || ''}
            onChange={(e) => onUpdateField('general_notes', e.target.value)}
            placeholder="Escreva aqui observações personalizadas sobre estilo de vida, temperos recomendados, manipulações, suplementação ou orientações sobre finais de semana..."
            className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:border-emerald-500 focus:outline-hidden resize-y font-sans leading-relaxed"
          />
        </div>
      </div>

    </div>
  );
}
