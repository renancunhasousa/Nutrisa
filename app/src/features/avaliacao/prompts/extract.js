export const EXTRACTION_PROMPT = `Você é um assistente especialista em nutrição esportiva e avaliação física.
Analise os arquivos de laudo anexados (um de adipometria/antropometria e/ou um de bioimpedância).
Extraia rigorosamente os dados identificados no formato JSON especificado.

IMPORTANTE PARA OS VALORES IDEIAIS: Extraia os valores de referência/ideais (idealMin e idealMax) diretamente dos laudos anexados quando disponíveis no exame (ex: faixas ideais ou normais impressas ao lado do resultado). Se não constar no laudo, forneça a faixa ideal padrão aceita pela literatura científica oficial (OMS para IMC/cintura, ACSM e Jackson & Pollock para % gordura/dobras, e equações normativas validadas contra DXA para massa magra e segmentos) para a idade/gênero do paciente.

ATENÇÃO AO RELATÓRIO DE 3 PÁGINAS:
Os dados alimentarão um Laudo Clínico estruturado em 3 páginas:
Pág 1: 6 Blocos Principais de Resumo (%G, Massa Magra, TMB, Idade Metabólica, Gordura Visceral, ACT) e Tabela Integrada de Parâmetros.
Pág 2: Dobras Cutâneas, Circunferências, Análise Segmentar por Membro (extraia diretamente do laudo de BIA a Massa Magra e Gordura em kg e % do Ideal para os 5 segmentos: Braço Direito, Braço Esquerdo, Tronco, Perna Direita e Perna Esquerda) e o "Parecer Nutricional Integrado".
Pág 3: Histórico Comparativo de Avaliações Físicas (com variação Δ) e Gráfico Evolutivo de Composição Corporal.

Portanto, gere o campo "aiAnalysisText" como um 'Diagnóstico e Parecer Nutricional Integrado' com cerca de 850 a 1000 caracteres, profissional, encorajador, focado na saúde metabólica, escrita direta para o paciente. IMPORTANTE: Escreva este campo como um texto contínuo de um único parágrafo, sem aspas duplas internas ou com quebras de linha devidamente escapadas como \\n.

REGRA RIGOROSA PARA DOBRAS CUTÂNEAS (skinfolds):
Extraia EXCLUSIVAMENTE as dobras cutâneas que estiverem explicitamente medidas no documento anexado. NUNCA invente, presuma ou deduza dobras que não constam no laudo (ex: NÃO invente Panturrilha ou Axilar se não foram medidas). Se foram medidas apenas 3, 5 ou 7 dobras, liste APENAS essas no array skinfolds.

REGRA CRÍTICA PARA HISTÓRICO COMPLETO DE AVALIAÇÕES PASSADAS (history):
Os laudos de Bioimpedância (AvaBio, InBody, Tanita, etc.) e Adipometria possuem tabelas ou gráficos com o histórico completo de consultas passadas (frequentemente com 2, 3, 4 ou mais colunas de datas anteriores).
- É OBRIGATÓRIO extrair TODAS as datas e avaliações anteriores presentes nos laudos para alimentar a evolução do paciente.
- NÃO extraia apenas a última consulta passada: se houver 2, 3, 4 ou mais consultas antigas no laudo, extraia TODAS elas no array "history".
- A consulta ATUAL (a mais recente) já é capturada em "patient" e "metrics", então "history" deve conter apenas as anteriores.
- Ordene as avaliações passadas cronologicamente no array "history", da mais antiga para a mais recente.
- Para o histórico (history), se houver dados antigos de Adipometria e Bioimpedância para a MESMA data, extraia ambos no formato { "adipometryValue": X, "biaValue": Y } para as métricas (ex: "fatPercentage"). Se for apenas um valor simples, pode retornar o número direto.
- Para cada consulta passada, inclua o objeto com a data ("DD/MM/AAAA" ou "DD/MM/AA") e todos os valores numéricos encontrados naquela data. Se algum valor não estiver disponível na coluna daquela data, use null.
- Exemplo: se o laudo tiver consultas em 10/01/2026, 15/03/2026 e a atual em 20/05/2026, o array "history" DEVE conter 2 objetos (10/01/2026 e 15/03/2026).

Se algum parâmetro não for encontrado em um dos laudos, atribua null.
Infira o equipamento de Bioimpedância utilizado (ex: InBody 270, AvaBio 380) e o Método Antropométrico (ex: Jackson & Pollock 7 dobras).

Retorne APENAS o JSON válido no seguinte formato:
{
  "patient": {
    "name": "Nome do Paciente",
    "age": "XX anos",
    "gender": "Feminino/Masculino",
    "height": "1.XX m",
    "weight": "XX.X kg",
    "date": "DD/MM/AAAA"
  },
  "biaEquipment": "Nome do equipamento identificado ou AvaBio 380",
  "anthropometricMethod": "Nome do protocolo ou Jackson & Pollock 7 Dobras",
  "metrics": [
    { "key": "weight", "title": "Peso Corporal", "unit": "kg", "biaValue": 64.7, "adipometryValue": 64.7, "category": "Geral", "idealMin": 45.0, "idealMax": 58.0 },
    { "key": "fatPercentage", "title": "Percentual de Gordura (%G)", "unit": "%", "biaValue": 35.2, "adipometryValue": 33.9, "category": "Composição", "idealMin": 18.0, "idealMax": 25.0 },
    { "key": "fatMass", "title": "Massa Gorda", "unit": "kg", "biaValue": 22.7, "adipometryValue": 21.9, "category": "Composição", "idealMin": 9.0, "idealMax": 15.0 },
    { "key": "leanMass", "title": "Massa Magra / Livre de Gordura", "unit": "kg", "biaValue": 42.0, "adipometryValue": 42.8, "category": "Composição", "idealMin": 38.0, "idealMax": 48.0 },
    { "key": "skeletalMuscle", "title": "Massa Muscular Esquelética (SMM)", "unit": "kg", "biaValue": 23.5, "adipometryValue": 24.0, "category": "Músculo", "idealMin": 20.0, "idealMax": 27.0 },
    { "key": "residualMass", "title": "Massa Residual", "unit": "kg", "biaValue": null, "adipometryValue": 13.5, "category": "Composição", "idealMin": 10.0, "idealMax": 15.0 },
    { "key": "boneMineral", "title": "Massa Mineral / Óssea", "unit": "kg", "biaValue": 2.45, "adipometryValue": null, "category": "Composição", "idealMin": 2.10, "idealMax": 2.90 },
    { "key": "totalBodyWater", "title": "Água Corporal Total (ACT)", "unit": "L", "biaValue": 31.2, "adipometryValue": null, "category": "Hidratação", "idealMin": 28.0, "idealMax": 36.0 },
    { "key": "icw", "title": "Água Intracelular (AIC / ICW)", "unit": "L", "biaValue": 19.5, "adipometryValue": null, "category": "Hidratação", "idealMin": 17.0, "idealMax": 22.0 },
    { "key": "ecw", "title": "Água Extracelular (AEC / ECW)", "unit": "L", "biaValue": 11.7, "adipometryValue": null, "category": "Hidratação", "idealMin": 10.0, "idealMax": 14.0 },
    { "key": "visceralFatLevel", "title": "Nível de Gordura Visceral", "unit": "Nível", "biaValue": 5, "adipometryValue": null, "category": "Risco Metabólico", "idealMin": 1, idealMax: 9 },
    { "key": "bmr", "title": "Taxa Metabólica Basal (TMB)", "unit": "kcal", "biaValue": 1310, "adipometryValue": 1295, "category": "Metabolismo", "idealMin": 1200, "idealMax": 1500 },
    { "key": "metabolicAge", "title": "Idade Metabólica", "unit": "anos", "biaValue": 28, "adipometryValue": null, "category": "Metabolismo", "idealMin": 18, "idealMax": 31 },
    { "key": "bmi", "title": "Índice de Massa Corporal (IMC)", "unit": "kg/m²", "biaValue": 27.6, "adipometryValue": 27.6, "category": "Geral", "idealMin": 18.5, "idealMax": 24.9 },
    { "key": "waistHipRatio", "title": "Relação Cintura/Quadril (RCQ)", "unit": "", "biaValue": null, "adipometryValue": 0.82, "category": "Risco Metabólico", "idealMin": 0.70, "idealMax": 0.85 },
    { "key": "skinfoldSum", "title": "Somatório de Dobras", "unit": "mm", "biaValue": null, "adipometryValue": 209.5, "category": "Dobras", "idealMin": 60.0, "idealMax": 140.0 },
    { "key": "bodyDensity", "title": "Densidade Corporal", "unit": "g/mL", "biaValue": null, "adipometryValue": 1.020, "category": "Composição", "idealMin": 1.030, "idealMax": 1.060 }
  ],
  "skinfolds": [
    { "site": "Tríceps", "value": 14.0 },
    { "site": "Subescapular", "value": 12.5 },
    { "site": "Suprailíaca", "value": 16.2 },
    { "site": "Abdomen", "value": 18.5 },
    { "site": "Coxa Média", "value": 21.0 }
  ],
  "circumferences": [
    { "site": "Cintura", "value": 71.5 },
    { "site": "Quadril", "value": 98.0 },
    { "site": "Abdomen", "value": 78.0 },
    { "site": "Braço Relaxado", "value": 27.5 },
    { "site": "Coxa Média", "value": 54.0 }
  ],
  "segmental": {
    "rightArm": { "leanMass": 2.15, "leanMassRatio": 102, "fatMass": 1.80, "fatMassRatio": 115 },
    "leftArm": { "leanMass": 2.10, "leanMassRatio": 100, "fatMass": 1.70, "fatMassRatio": 112 },
    "trunk": { "leanMass": 18.60, "leanMassRatio": 100, "fatMass": 3.50, "fatMassRatio": 105 },
    "rightLeg": { "leanMass": 6.40, "leanMassRatio": 98, "fatMass": 4.90, "fatMassRatio": 120 },
    "leftLeg": { "leanMass": 6.30, "leanMassRatio": 97, "fatMass": 4.80, "fatMassRatio": 118 }
  },
  "history": [
    { "date": "10/01/2026", "weight": { "adipometryValue": 68.5, "biaValue": 68.5 }, "fatPercentage": { "adipometryValue": 38.5, "biaValue": 39.2 }, "fatMass": { "adipometryValue": 26.4, "biaValue": 26.8 }, "leanMass": { "adipometryValue": 42.1, "biaValue": 41.7 }, "skeletalMuscle": { "adipometryValue": 23.1, "biaValue": 22.9 }, "totalBodyWater": 30.1, "visceralFatLevel": 7, "bmr": 1280, "metabolicAge": 33, "bmi": 29.2, "waistHipRatio": 0.85, "skinfoldSum": 245.0, "waist": 88.0, "abdomen": 92.0, "hip": 106.0 },
    { "date": "15/03/2026", "weight": { "adipometryValue": 67.0, "biaValue": 67.0 }, "fatPercentage": { "adipometryValue": 36.8, "biaValue": 37.1 }, "fatMass": { "adipometryValue": 24.6, "biaValue": 24.9 }, "leanMass": { "adipometryValue": 42.4, "biaValue": 42.1 }, "skeletalMuscle": { "adipometryValue": 23.4, "biaValue": 23.1 }, "totalBodyWater": 30.5, "visceralFatLevel": 6, "bmr": 1288, "metabolicAge": 31, "bmi": 28.6, "waistHipRatio": 0.84, "skinfoldSum": 230.0, "waist": 86.0, "abdomen": 90.0, "hip": 104.5 }
  ],
  "aiAnalysisText": "Parecer clínico discursivo gerado pela IA focando em saúde metabólica, riscos e composição corporal para o paciente..."
}`;
