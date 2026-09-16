import React from 'react';
import logoPdf from '../../../assets/logo.png';

import signatureImg from '../../../assets/assinatura.png';
import { CheckCircle, ShieldCheck } from 'lucide-react';

import { useAvaliacaoContext } from '../AvaliacaoContext.jsx';

export default function OrientacoesPage() {
const { extractedData, getFinalValue, nutritionist } = useAvaliacaoContext();
return (<>            {/* PÁGINA 4: GUIA EDUCATIVO E INTERPRETAÇÃO DOS VALORES IDEIAIS */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-5 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">

              {/* CABEÇALHO DA PÁGINA 4 (IGUAL ÀS DEMAIS PÁGINAS) */}
              <div className="border-b-2 border-emerald-800 pb-4 print:pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logoPdf} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
                    <div>
                      <h1 className="text-2xl print:text-lg font-black tracking-tight text-emerald-950 uppercase whitespace-nowrap truncate">{nutritionist.name}</h1>
                      <p className="text-xs print:text-[10px] font-semibold text-emerald-700 uppercase tracking-wider whitespace-nowrap truncate">{nutritionist.title}</p>
                      <p className="text-[11px] print:text-[9px] text-slate-500 mt-0.5 whitespace-nowrap truncate">{nutritionist.crn} • {nutritionist.clinic}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block bg-emerald-900 text-white text-[10px] print:text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Laudo de Avaliação Física Integrada
                    </span>
                    <p className="text-xs print:text-[10px] text-slate-500 mt-2 whitespace-nowrap">Data da Avaliação: <strong className="text-slate-800">{extractedData.patient.date}</strong></p>
                  </div>
                </div>

                {/* Patient Info Header */}
                <div className="mt-4 print:mt-2 grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 text-xs">
                  <div className="min-w-0">
                    <span className="text-slate-400 uppercase text-[9px] font-bold block whitespace-nowrap">Paciente</span>
                    <strong className="text-slate-900 text-sm print:text-xs font-bold block truncate whitespace-nowrap" title={extractedData.patient.name}>{extractedData.patient.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Idade / Gênero</span>
                    <span className="text-slate-800 font-medium">{extractedData.patient.age} • {extractedData.patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Estatura / Peso</span>
                    <span className="text-slate-800 font-medium">{extractedData.patient.height} • {extractedData.patient.weight}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">IMC Calculado</span>
                    <span className="text-slate-800 font-bold">
                      {getFinalValue(extractedData.metrics.find(m => m.key === 'bmi') || {})} kg/m²
                    </span>
                  </div>
                </div>
              </div>

              {/* INTRODUÇÃO DA PÁGINA EDUCATIVA */}
              <div className="space-y-1 mb-4 print:mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                  Entendendo seus Parâmetros de Composição Corporal
                </h3>
                <p className="text-xs print:text-[9.5px] text-slate-600 leading-relaxed pt-0.5">
                  Este guia foi preparado para que você compreenda o significado prático e científico das principais métricas do seu exame de bioimpedância e antropometria. Entender esses números é fundamental para acompanhar sua evolução com clareza e motivação!
                </p>
              </div>

              {/* BLOCS EDUCATIVOS EM GRADE (8 CARDS ORGANIZADOS EM PARES DIDÁTICOS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-1.5 text-xs">
                
                {/* LINHA 1: MASSA LIVRE DE GORDURA & MASSA MUSCULAR ESQUELÉTICA */}
                {/* CARD 1: MASSA LIVRE DE GORDURA (MLG / FFM) */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-rose-800 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-rose-50 p-1 rounded text-rose-900 font-bold text-xs">⚖️</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Massa Livre de Gordura (MLG / FFM)</h4>
                      <span className="text-[8.5px] font-semibold text-rose-900 uppercase">Tudo o que não é gordura no corpo</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    A MLG engloba <strong>músculos, ossos, órgãos vitais, sangue e água corporal</strong>. Não é apenas músculo! Ter uma MLG elevada garante uma estrutura óssea forte, órgãos saudáveis e um metabolismo baseline altamente ativo.
                  </p>
                </div>

                {/* CARD 2: MASSA MUSCULAR ESQUELÉTICA (SMM) */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-rose-800 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-rose-50 p-1 rounded text-rose-900 font-bold text-xs">💪</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Massa Muscular Esquelética (SMM)</h4>
                      <span className="text-[8.5px] font-semibold text-rose-900 uppercase">Músculos de Movimento & Treino</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    Diferente da MLG, a SMM refere-se exclusivamente aos <strong>músculos acoplados aos ossos</strong> que você exercita na musculação. É o verdadeiro motor que queima calorias, dá forma ao corpo e absorve a glicose sanguínea.
                  </p>
                </div>

                {/* LINHA 2: DENSIDADE CORPORAL & ÂNGULO DE FASE */}
                {/* CARD 3: DENSIDADE CORPORAL & MASSA VS VOLUME */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-indigo-600 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-indigo-50 p-1 rounded text-indigo-700 font-bold text-xs">📦</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Densidade Corporal: Massa vs. Volume</h4>
                      <span className="text-[8.5px] font-semibold text-indigo-700 uppercase">Por que o espelho engana a balança</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    O músculo é denso e compacto, enquanto a gordura é leve e ocupa cerca de <strong>18% mais espaço visual</strong> para o mesmo peso. Ao trocar gordura por músculo, suas medidas diminuem drasticamente mesmo se o peso bruto na balança não mudar!
                  </p>
                </div>

                {/* CARD 4: ÂNGULO DE FASE (PHASE ANGLE) */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-indigo-600 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-indigo-50 p-1 rounded text-indigo-700 font-bold text-xs">⚡</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Ângulo de Fase (Phase Angle)</h4>
                      <span className="text-[8.5px] font-semibold text-indigo-700 uppercase">Integridade e Jovialidade Celular</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    Indica a integridade e saúde da membrana celular. Valores elevados (ex: &gt; 6.0°) sinalizam células musculares íntegras, forte imunidade, alta capacidade reparadora e excelente estado nutricional.
                  </p>
                </div>

                {/* LINHA 3: ÁGUA INTRACELULAR & ÁGUA EXTRACELULAR */}
                {/* CARD 5: ÁGUA INTRACELULAR (AIC) */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-teal-600 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-teal-50 p-1 rounded text-teal-700 font-bold text-xs">💧</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Água Intracelular (AIC / ICW)</h4>
                      <span className="text-[8.5px] font-semibold text-teal-700 uppercase">Nutrição Celular & Síntese Proteica</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    É o líquido guardado no interior das células musculares. Níveis elevados de AIC indicam músculos hidratados, cheios de glicogênio e nutrientes, ideais para hipertrofia, força e recuperação rápida.
                  </p>
                </div>

                {/* CARD 6: ÁGUA EXTRACELULAR (AEC) & RAZÃO AEC/ACT */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-teal-600 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-teal-50 p-1 rounded text-teal-700 font-bold text-xs">🌊</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Água Extracelular (AEC) & Retenção</h4>
                      <span className="text-[8.5px] font-semibold text-teal-700 uppercase">Equilíbrio Hídrico & Inflamação</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    É a água fora das células (na circulação e tecidos). A razão AEC/ACT (ideal entre 0.360 e 0.390) avalia se há retenção de líquidos provocada por excesso de sódio, desidratação ou estresse metabólico.
                  </p>
                </div>

                {/* LINHA 4: TAXA METABÓLICA BASAL & GORDURA VISCERAL */}
                {/* CARD 7: TMB & IDADE METABÓLICA */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-amber-500 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-amber-50 p-1 rounded text-amber-700 font-bold text-xs">🔥</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Taxa Metabólica Basal & Idade Metabólica</h4>
                      <span className="text-[8.5px] font-semibold text-amber-700 uppercase">Eficiência no Repouso & Queima Calórica</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    A TMB representa o consumo de calorias do seu corpo para se manter vivo em repouso. Quanto mais massa livre de gordura, maior a TMB e menor a sua Idade Metabólica em relação à idade cronológica.
                  </p>
                </div>

                {/* CARD 8: GORDURA VISCERAL E RCQ */}
                <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-amber-500 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-1">
                    <div className="bg-amber-50 p-1 rounded text-amber-700 font-bold text-xs">🫀</div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">Gordura Visceral & Relação Cintura/Quadril</h4>
                      <span className="text-[8.5px] font-semibold text-amber-700 uppercase">Proteção Cardiovascular & Orgânica</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] print:text-[8.5px] text-slate-600 leading-snug">
                    Mede a gordura localizada profundamente ao redor dos órgãos vitais no abdômen. Níveis dentro da faixa normal (1 a 9) previnem resistência à insulina, hipertensão e complicações metabólicas.
                  </p>
                </div>

              </div>

              {/* SEÇÃO COMPLEMENTAR: RECOMENDAÇÕES PARA A PRÓXIMA AVALIAÇÃO & PILARES */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2 mt-5 pt-3 print:mt-3 print:pt-2 border-t border-slate-100">
                
                {/* BLOCO A: PROTOCOLO PRÉ-EXAME PARA A PRÓXIMA CONSULTA */}
                <div className="bg-slate-50 p-3 print:p-2 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center border-b border-slate-200 pb-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    Protocolo para a Próxima Avaliação
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[8.5px]">
                    <div className="bg-white p-1.5 rounded border border-slate-100 flex items-center space-x-1.5">
                      <span className="text-xs">⏳</span>
                      <span className="text-slate-700 leading-tight"><strong>Jejum:</strong> 4h alimentos e 2h de água em excesso.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100 flex items-center space-x-1.5">
                      <span className="text-xs">🚫</span>
                      <span className="text-slate-700 leading-tight"><strong>Álcool/Café:</strong> Evitar café 8h e álcool 48h pré-exame.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100 flex items-center space-x-1.5">
                      <span className="text-xs">🏃‍♂️</span>
                      <span className="text-slate-700 leading-tight"><strong>Sem Treino Intenso:</strong> Não treinar no dia do exame.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100 flex items-center space-x-1.5">
                      <span className="text-xs">🚽</span>
                      <span className="text-slate-700 leading-tight"><strong>Bexiga Vazia:</strong> Urinar antes do teste de BIA.</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] print:text-[8px] text-slate-500 italic pt-0.5 leading-tight">
                    📌 <strong>Por que seguir o protocolo?</strong> A bioimpedância avalia a condução elétrica nos tecidos. Padronizar a hidratação e o jejum elimina interferências e garante comparabilidade 100% precisa entre as consultas.
                  </p>
                </div>

                {/* BLOCO B: OS 4 PILARES DA RECOMPOSIÇÃO CORPORAL */}
                <div className="bg-slate-50 p-3 print:p-2 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center border-b border-slate-200 pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    Os 4 Pilares do Seu Resultado
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[8.5px]">
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <strong className="font-bold text-slate-800 block">1. Dietoterapia</strong>
                      <span className="text-slate-600 leading-tight text-[9px] print:text-[8px] block">Proteína adequada & calorias sob medida.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <strong className="font-bold text-slate-800 block">2. Treino de Força</strong>
                      <span className="text-slate-600 leading-tight text-[9px] print:text-[8px] block">Estímulo constante para síntese muscular.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <strong className="font-bold text-slate-800 block">3. Hidratação</strong>
                      <span className="text-slate-600 leading-tight text-[9px] print:text-[8px] block">35 a 45ml de água por kg ao dia.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <strong className="font-bold text-slate-800 block">4. Sono Reparador</strong>
                      <span className="text-slate-600 leading-tight text-[9px] print:text-[8px] block">7h a 8h para regulação metabólica.</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] print:text-[8px] text-slate-500 italic pt-0.5 leading-tight">
                    ⚡ <strong>Por que os pilares funcionam?</strong> O corpo responde à sinergia. O treino sinaliza a síntese, a dieta fornece os blocos de construção, enquanto o sono e a água otimizam a recuperação e o metabolismo.
                  </p>
                </div>

              </div>

              {/* NOTA DE ORIENTAÇÃO DA NUTRICIONISTA */}
              <div className="bg-slate-50 p-2.5 print:p-1.5 rounded-lg border border-slate-200 text-center">
                <p className="text-xs print:text-[9px] font-bold text-emerald-950">
                  💡 Lembre-se: O acompanhamento nutricional constante é o segredo da longevidade saudável!
                </p>
                <p className="text-[10.5px] print:text-[8px] text-slate-600 italic mt-0.5">
                  "Pequenas evoluções diárias geram grandes transformações na sua saúde. Conte conosco em cada etapa da sua jornada."
                </p>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 4) */}
              <div className="pt-6 print:pt-3 border-t border-slate-300 mt-6 print:mt-auto a4-print-footer">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{nutritionist.name}</p>
                    <p>{nutritionist.title} • {nutritionist.crn}</p>
                    <p>{nutritionist.address}</p>
                    <p>{nutritionist.phone} • {nutritionist.email}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-1">
                    <div className="flex flex-col items-center md:items-end print:items-end">
                      <img 
                        src={signatureImg} 
                        alt="Assinatura da Nutricionista" 
                        className="h-18 md:h-20 w-auto object-contain drop-shadow-xs" 
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 4 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
</>);
}
