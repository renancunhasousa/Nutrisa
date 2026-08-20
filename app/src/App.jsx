import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import { 
  FileUp, 
  Sparkles, 
  CheckCircle2, 
  CheckCircle,
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  Settings, 
  Activity, 
  User, 
  Calendar, 
  Sliders, 
  FileText, 
  ChevronRight, 
  Info,
  Scale,
  Zap,
  Edit3,
  Download,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';
import Anamnese from './Anamnese';

const DEFAULT_NUTRITIONIST = {
  name: "Dra. Isabela Muñoz Mendonça",
  title: "Nutricionista Cl\u00ednica e Esportiva",
  crn: "CRN-3 / 58.492",
  phone: "(19) 99876-5432",
  email: "isabelamunoznutri@hotmail.com",
  clinic: "Cl\u00ednica Integrada de Sa\u00fade & Performance",
  address: "Rua Barão de Jaguara, 655 - Centro, Campinas - SP",
  instagram: "@nutri.isabelamunoz"
};

const DEMO_EXTRACTED_DATA = {
  patient: {
    name: "Isabella Cristina Zambelli",
    age: "31 anos",
    gender: "Feminino",
    height: "1.53 m",
    weight: "64.7 kg",
    date: new Date().toLocaleDateString('pt-BR')
  },
  biaEquipment: "AvaBio 380 (Multifrequência Octopolar)",
  anthropometricMethod: "Protocolo Jackson & Pollock (7 Dobras)",
  metrics: [
    { key: "weight", title: "Peso Corporal", unit: "kg", biaValue: 64.7, adipometryValue: 64.7, selected: "bia", category: "Geral", idealMin: 45.0, idealMax: 58.0 },
    { key: "fatPercentage", title: "Percentual de Gordura (%G)", unit: "%", biaValue: 35.2, adipometryValue: 33.9, selected: "adipometry", category: "Composição", idealMin: 18.0, idealMax: 25.0 },
    { key: "fatMass", title: "Massa Gorda", unit: "kg", biaValue: 22.7, adipometryValue: 21.9, selected: "adipometry", category: "Composição", idealMin: 9.0, idealMax: 15.0 },
    { key: "leanMass", title: "Massa Magra / Livre de Gordura", unit: "kg", biaValue: 42.0, adipometryValue: 42.8, selected: "adipometry", category: "Composição", idealMin: 38.0, idealMax: 48.0 },
    { key: "skeletalMuscle", title: "Massa Muscular Esquelética (SMM)", unit: "kg", biaValue: 23.5, adipometryValue: 24.0, selected: "bia", category: "Músculo", idealMin: 20.0, idealMax: 27.0 },
    { key: "residualMass", title: "Massa Residual", unit: "kg", biaValue: null, adipometryValue: 13.5, selected: "adipometry", category: "Composição", idealMin: 10.0, idealMax: 15.0 },
    { key: "boneMineral", title: "Massa Mineral / Óssea", unit: "kg", biaValue: 2.45, adipometryValue: null, selected: "bia", category: "Composição", idealMin: 2.10, idealMax: 2.90 },
    { key: "totalBodyWater", title: "Água Corporal Total (ACT)", unit: "L", biaValue: 31.2, adipometryValue: null, selected: "bia", category: "Hidratação", idealMin: 28.0, idealMax: 36.0 },
    { key: "icw", title: "Água Intracelular (AIC / ICW)", unit: "L", biaValue: 19.5, adipometryValue: null, selected: "bia", category: "Hidratação", idealMin: 17.0, idealMax: 22.0 },
    { key: "ecw", title: "Água Extracelular (AEC / ECW)", unit: "L", biaValue: 11.7, adipometryValue: null, selected: "bia", category: "Hidratação", idealMin: 10.0, idealMax: 14.0 },
    { key: "visceralFatLevel", title: "Nível de Gordura Visceral", unit: "Nível", biaValue: 5, adipometryValue: null, selected: "bia", category: "Risco Metabólico", idealMin: 1, idealMax: 9 },
    { key: "bmr", title: "Taxa Metabólica Basal (TMB)", unit: "kcal", biaValue: 1310, adipometryValue: 1295, selected: "adipometry", category: "Metabolismo", idealMin: 1200, idealMax: 1500 },
    { key: "metabolicAge", title: "Idade Metabólica", unit: "anos", biaValue: 28, adipometryValue: null, selected: "bia", category: "Metabolismo", idealMin: 18, idealMax: 31 },
    { key: "bmi", title: "Índice de Massa Corporal (IMC)", unit: "kg/m²", biaValue: 27.6, adipometryValue: 27.6, selected: "bia", category: "Geral", idealMin: 18.5, idealMax: 24.9 },
    { key: "waistHipRatio", title: "Relação Cintura/Quadril (RCQ)", unit: "", biaValue: null, adipometryValue: 0.82, selected: "adipometry", category: "Risco Metabólico", idealMin: 0.70, idealMax: 0.85 },
    { key: "skinfoldSum", title: "Somatório de Dobras", unit: "mm", biaValue: null, adipometryValue: 209.5, selected: "adipometry", category: "Dobras", idealMin: 60.0, idealMax: 140.0 },
    { key: "bodyDensity", title: "Densidade Corporal", unit: "g/mL", biaValue: null, adipometryValue: 1.020, selected: "adipometry", category: "Composição", idealMin: 1.030, idealMax: 1.060 }
  ],
  skinfolds: [
    { site: "Tríceps", value: 35.0 },
    { site: "Bicipital", value: 10.0 },
    { site: "Subescapular", value: 32.0 },
    { site: "Axilar Média", value: 16.0 },
    { site: "Suprailíaca", value: 35.0 },
    { site: "Abdomen", value: 30.0 },
    { site: "Coxa Média", value: 40.5 },
    { site: "Panturrilha", value: 11.0 },
    { site: "Torácica / Peitoral", value: 21.0 }
  ],
  circumferences: [
    { site: "Ombro", value: 109.0 },
    { site: "Tórax", value: 100.0 },
    { site: "Cintura", value: 83.5 },
    { site: "Quadril", value: 102.0 },
    { site: "Abdomen", value: 87.0 },
    { site: "Braço Relaxado", value: 33.0 },
    { site: "Coxa Medial", value: 55.5 },
    { site: "Panturrilha", value: 37.0 }
  ],
  segmental: {
    rightArm: { leanMass: 2.15, leanMassRatio: 102, fatMass: 1.80, fatMassRatio: 115 },
    leftArm: { leanMass: 2.10, leanMassRatio: 100, fatMass: 1.70, fatMassRatio: 112 },
    trunk: { leanMass: 18.60, leanMassRatio: 100, fatMass: 3.50, fatMassRatio: 105 },
    rightLeg: { leanMass: 6.40, leanMassRatio: 98, fatMass: 4.90, fatMassRatio: 120 },
    leftLeg: { leanMass: 6.30, leanMassRatio: 97, fatMass: 4.80, fatMassRatio: 118 }
  },
  aiAnalysisText: "A paciente apresenta evolução positiva com redução no percentual de gordura (33.9%) e preservação da massa magra (42.8 kg). A relação cintura/quadril (0.82) indica evolução no perfil de risco metabólico. Nível de hidratação celular satisfatório e Ângulo de Fase dentro do padrão para o perfil."
};

export default function App() {
  const [appMode, setAppMode] = useState('laudo'); // 'laudo' | 'anamnese'
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Comparativo/Chaves, 3: Laudo Final
  const [nutritionist, setNutritionist] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrisa_nutritionist');
      return saved ? JSON.parse(saved) : DEFAULT_NUTRITIONIST;
    } catch (e) {
      return DEFAULT_NUTRITIONIST;
    }
  });
  const [activeModal, setActiveModal] = useState(null); // null | 'profile' | 'ai'
  // Persistência segura do modelo selecionado pelo usuário no localStorage
  const sanitizeInitialModel = () => {
    try {
      const saved = localStorage.getItem('nutrisa_selected_model');
      const validModels = [
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.5-pro",
        "gemini-3.5-flash"
      ];
      if (saved && validModels.includes(saved)) {
        return saved;
      }
      return import.meta.env.VITE_GEMINI_MODEL || "gemini-3.7-flash";
    } catch (e) {
      return import.meta.env.VITE_GEMINI_MODEL || "gemini-3.7-flash";
    }
  };

  const [selectedModel, setSelectedModel] = useState(sanitizeInitialModel);

  // Save profile and model changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nutrisa_nutritionist', JSON.stringify(nutritionist));
    } catch (e) {
      console.error("Erro ao salvar perfil no localStorage", e);
    }
  }, [nutritionist]);

  useEffect(() => {
    try {
      localStorage.setItem('nutrisa_selected_model', selectedModel);
    } catch (e) {
      console.error("Erro ao salvar modelo de IA no localStorage", e);
    }
  }, [selectedModel]);
  
  // File upload state
  const [adipometryFile, setAdipometryFile] = useState(null);
  const [bioimpedanceFile, setBioimpedanceFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [appNotification, setAppNotification] = useState(null); // { message, type: 'info' | 'warning' | 'error' }

  const showAppNotification = (message, type = 'info', duration = 6000) => {
    setAppNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setAppNotification(null), duration);
    }
  };

  // Ordem de Fallback em Camadas (Cascata Multi-Nível)
  const getModelFallbackChain = (initialModel) => {
    const defaultChain = [
      "gemini-3.7-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite"
    ];
    // Garante que o modelo inicial seja o primeiro e sem duplicatas
    return [initialModel, ...defaultChain.filter(m => m !== initialModel)];
  };

  // Helper com cascata para chamadas Gemini na aplicação
  const executeGeminiWithFallback = async (payload, onModelChangeText = "Processando com modelo alternativo...") => {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey.includes("Sua_Chave")) {
      alert("Atenção: A chave API do Gemini (VITE_GEMINI_API_KEY) não está configurada no painel da Vercel!\n\nAcesse Vercel -> Seu Projeto -> Settings -> Environment Variables, adicione VITE_GEMINI_API_KEY com sua chave do Google AI Studio e faça um Novo Deploy.");
      throw new Error("Chave VITE_GEMINI_API_KEY ausente ou inválida.");
    }

    const modelsToTry = getModelFallbackChain(selectedModel);
    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        if (i > 0) {
          console.warn(`[Fallback Ativo] Tentando modelo alternativo ${model} (tentativa ${i + 1}/${modelsToTry.length})...`);
          showAppNotification(
            `Cota ou instabilidade no modelo anterior. Alternando automaticamente para ${model}...`,
            'warning',
            5000
          );
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          const isQuota = response.status === 429 || errBody.includes("RESOURCE_EXHAUSTED") || errBody.includes("quota");
          console.warn(`Modelo ${model} retornou status ${response.status} ${isQuota ? '(Cota Excedida / 429)' : ''}: ${errBody}`);
          lastError = new Error(`Model ${model} falhou (${response.status}): ${errBody}`);
          continue; // Tenta o próximo da cascata
        }

        const result = await response.json();
        return { result, usedModel: model };
      } catch (err) {
        lastError = err;
        console.warn(`Falha de rede ou execução no modelo ${model}:`, err);
      }
    }

    throw lastError || new Error("Todos os modelos da cascata do Gemini falharam.");
  };

  // Extracted and calculated data state
  const [extractedData, setExtractedData] = useState(DEMO_EXTRACTED_DATA);
  const [biaEquipment, setBiaEquipment] = useState(DEMO_EXTRACTED_DATA.biaEquipment);
  const [anthropometricMethod, setAnthropometricMethod] = useState(DEMO_EXTRACTED_DATA.anthropometricMethod);
  const [customValues, setCustomValues] = useState({});

  // Convert File to Base64 (Extrai base64 puro para a API do Gemini)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        try {
          const resultStr = reader.result.toString();
          const base64Clean = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
          resolve(base64Clean);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFilesWithGemini = async () => {
    if (!adipometryFile && !bioimpedanceFile) {
      alert("Por favor, selecione ao menos um arquivo PDF ou clique em 'Usar Dados de Exemplo' para testar.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress("Lendo arquivos e preparando dados para a IA...");

    try {
      let adipometryB64 = null;
      let bioimpedanceB64 = null;

      if (adipometryFile) {
        adipometryB64 = await fileToBase64(adipometryFile);
      }
      if (bioimpedanceFile) {
        bioimpedanceB64 = await fileToBase64(bioimpedanceFile);
      }

      setAnalysisProgress("Enviando para a IA Gemini analisar ambos os laudos...");

      const prompt = `Você é um assistente especialista em nutrição esportiva e avaliação física.
Analise os arquivos de laudo anexados (um de adipometria/antropometria e/ou um de bioimpedância).
Extraia rigorosamente os dados identificados no formato JSON especificado.

IMPORTANTE PARA OS VALORES IDEIAIS: Extraia os valores de referência/ideais (idealMin e idealMax) diretamente dos laudos anexados quando disponíveis no exame (ex: faixas ideais ou normais impressas ao lado do resultado). Se não constar no laudo, forneça a faixa ideal padrão aceita pela literatura científica para a idade/gênero do paciente.

ATENÇÃO AO RELATÓRIO DE 3 PÁGINAS:
Os dados alimentarão um Laudo Clínico estruturado em 3 páginas:
Pág 1: 6 Blocos Principais de Resumo (%G, Massa Magra, TMB, Idade Metabólica, Gordura Visceral, ACT) e Tabela Integrada de Parâmetros.
Pág 2: Dobras Cutâneas, Circunferências, Análise Segmentar por Membro (extraia diretamente do laudo de BIA a Massa Magra e Gordura em kg e % do Ideal para os 5 segmentos: Braço Direito, Braço Esquerdo, Tronco, Perna Direita e Perna Esquerda) e o "Parecer Nutricional Integrado".
Pág 3: Histórico Comparativo de Avaliações Físicas (com variação Δ) e Gráfico Evolutivo de Composição Corporal.

Portanto, gere o campo "aiAnalysisText" como um 'Diagnóstico e Parecer Nutricional Integrado' com cerca de 850 a 1000 caracteres, profissional, encorajador, focado na saúde metabólica, escrita direta para o paciente. IMPORTANTE: Escreva este campo como um texto contínuo de um único parágrafo, sem aspas duplas internas ou com quebras de linha devidamente escapadas como \\n.

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
    { "key": "visceralFatLevel", "title": "Nível de Gordura Visceral", "unit": "Nível", "biaValue": 5, "adipometryValue": null, "category": "Risco Metabólico", "idealMin": 1, "idealMax": 9 },
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
    { "site": "Coxa Média", "value": 21.0 },
    { "site": "Panturrilha", "value": 11.0 }
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
  "aiAnalysisText": "Parecer clínico discursivo gerado pela IA focando em saúde metabólica, riscos e composição corporal para o paciente..."
}`;

      const contentsParts = [{ text: prompt }];

      if (adipometryB64) {
        contentsParts.push({
          inline_data: {
            mime_type: adipometryFile.type || "application/pdf",
            data: adipometryB64
          }
        });
      }

      if (bioimpedanceB64) {
        contentsParts.push({
          inline_data: {
            mime_type: bioimpedanceFile.type || "application/pdf",
            data: bioimpedanceB64
          }
        });
      }

      const payload = {
        contents: [{ role: "user", parts: contentsParts }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const { result, usedModel } = await executeGeminiWithFallback(payload);
      if (usedModel !== selectedModel) {
        console.log(`Extração concluída com sucesso usando o modelo de fallback: ${usedModel}`);
      }

      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        // Parser ultrarrobusto com reparo automático de JSON gerado por IA
        const repairAndParseJson = (text) => {
          if (!text) throw new Error("A IA retornou uma resposta vazia.");
          let cleaned = text.trim();

          // 1. Remove delimitadores markdown
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          }

          // Extrai o bloco entre a primeira '{' e a última '}'
          const firstBrace = cleaned.indexOf("{");
          const lastBrace = cleaned.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }

          // Tentativa 1: Parse direto
          try {
            return JSON.parse(cleaned);
          } catch (e1) {
            console.warn("Parse direto falhou. Aplicando higienização de quebras de linha e vírgulas...", e1);
          }

          // Tentativa 2: Reparar quebras de linha literais dentro de strings e trailing commas
          let aggressiveSanitized = "";
          let inString = false;
          let isEscaped = false;

          for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (char === '"' && !isEscaped) {
              inString = !inString;
            }

            if (inString && (char === '\n' || char === '\r')) {
              aggressiveSanitized += '\\n';
            } else if (inString && char === '\t') {
              aggressiveSanitized += '\\t';
            } else {
              aggressiveSanitized += char;
            }

            if (char === '\\' && !isEscaped) {
              isEscaped = true;
            } else {
              isEscaped = false;
            }
          }

          // Remove vírgulas sobressalentes antes de fechar chaves ou colchetes
          aggressiveSanitized = aggressiveSanitized.replace(/,\s*([\}\]])/g, "$1");

          try {
            return JSON.parse(aggressiveSanitized);
          } catch (e2) {
            console.error("Conteúdo bruto recebido que falhou no parse:", text);
            throw new Error("Não foi possível parsear a resposta da IA. Formato JSON inválido.");
          }
        };

        const parsed = repairAndParseJson(rawText);
        // Pre-select logic: if adipometry has value prefer adipometry for % fat, else bia
        const processedMetrics = parsed.metrics.map(m => ({
          ...m,
          selected: m.adipometryValue !== null ? 'adipometry' : 'bia'
        }));

        setExtractedData({
          ...parsed,
          metrics: processedMetrics
        });
        setBiaEquipment(parsed.biaEquipment || "InBody 270");
        setAnthropometricMethod(parsed.anthropometricMethod || "Jackson & Pollock 7 Dobras");
        setCurrentStep(2);
      } else {
        throw new Error("Não foi possível extrair dados legíveis dos PDFs.");
      }
    } catch (err) {
      console.error("Erro na leitura de PDFs:", err);
      alert("Houve um problema ao processar os PDFs via IA. Carregando dados de demonstração estruturados.");
      setCurrentStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAIAnalysis = async () => {
    setIsGeneratingAI(true);
    try {
      const prompt = `Você é um(a) nutricionista clínico(a) esportivo(a) redigindo o 'Parecer Nutricional Integrado' detalhado, de forma direta e acolhedora para o paciente.
Com base nos dados a seguir extraídos da avaliação física:
Nome: ${extractedData.patient?.name || "Paciente"}
Métricas (Valores): ${JSON.stringify(extractedData.metrics.map(m => m.title + ": " + (m.biaValue || m.adipometryValue) + " " + m.unit))}
Dobras Cutâneas: ${JSON.stringify(extractedData.skinfolds)}
Circunferências: ${JSON.stringify(extractedData.circumferences)}

Escreva um diagnóstico clínico completo, profundo e objetivo, contendo de 2 a 3 parágrafos bem elaborados (limite aproximado de 850 a 1000 caracteres).
O parecer deve cobrir:
1. Avaliação do estado atual da composição corporal (Gordura vs. Massa Magra/Músculo e peso geral).
2. Análise da saúde metabólica e risco cardiovascular (focando nos níveis de Gordura Visceral e RCQ).
3. Conclusão clínica encorajadora com recomendações e próximos passos.

Mantenha um tom profissional, técnico porém empático e encorajador. Respeite o limite máximo de 1000 caracteres para encaixe perfeito no layout impresso A4.
NÃO use formatações Markdown (como asteriscos duplos **), NÃO crie títulos. Retorne APENAS o texto contínuo.`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { 
          maxOutputTokens: 4000,
          temperature: 0.7 
        }
      };

      const { result } = await executeGeminiWithFallback(payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setExtractedData(prev => ({ ...prev, aiAnalysisText: text.trim() }));
    } catch (err) {
      alert("Erro ao gerar o diagnóstico: " + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSourceChange = (metricKey, source) => {
    setExtractedData(prev => ({
      ...prev,
      metrics: prev.metrics.map(m => m.key === metricKey ? { ...m, selected: source } : m)
    }));
  };

  const handleCustomValueChange = (metricKey, val) => {
    setCustomValues(prev => ({ ...prev, [metricKey]: val }));
  };

  const loadDemoData = () => {
    setExtractedData(DEMO_EXTRACTED_DATA);
    setBiaEquipment(DEMO_EXTRACTED_DATA.biaEquipment);
    setAnthropometricMethod(DEMO_EXTRACTED_DATA.anthropometricMethod);
    setCurrentStep(2);
  };

  // Helper to get final selected value for a metric
  const getFinalValue = (m) => {
    if (m.selected === 'custom') return customValues[m.key] || 0;
    if (m.selected === 'adipometry') return m.adipometryValue ?? m.biaValue ?? 0;
    return m.biaValue ?? m.adipometryValue ?? 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans print:bg-white print:p-0">
      
      {/* Top Navbar - Hidden on Print */}
      <header className="bg-emerald-900 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white/10 p-1.5 rounded-xl border border-emerald-700/60 flex items-center justify-center shadow-inner overflow-hidden">
              <img src={logo} alt="NutrIsa Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{nutritionist.name}</h1>
              <p className="text-xs text-emerald-200">{nutritionist.title} • {nutritionist.crn}</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="hidden sm:flex items-center text-emerald-200 text-xs font-medium uppercase tracking-widest">
            {appMode === 'laudo' ? 'Análise de Composição Corporal' : 'Assistente Clínico IA'}
          </div>

          {/* Header Action Buttons: Separated Profile & AI Config */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center bg-emerald-950 p-1 rounded-lg border border-emerald-800 mr-2 shadow-inner">
              <button
                onClick={() => setAppMode('laudo')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center ${appMode === 'laudo' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300 hover:text-emerald-100 hover:bg-emerald-800'}`}
              >
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Laudo Físico
              </button>
              <button
                onClick={() => setAppMode('anamnese')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center ${appMode === 'anamnese' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300 hover:text-emerald-100 hover:bg-emerald-800'}`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Anamnese
              </button>
            </div>
            <button 
              onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
              className={`flex items-center text-xs px-3 py-1.5 rounded-md transition shadow-sm border ${
                activeModal === 'profile' 
                  ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400 font-bold' 
                  : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-700'
              }`}
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Perfil Profissional
            </button>

            <button 
              onClick={() => setActiveModal(activeModal === 'ai' ? null : 'ai')}
              className={`flex items-center text-xs px-3 py-1.5 rounded-md transition shadow-sm border ${
                activeModal === 'ai' 
                  ? 'bg-amber-600 text-white border-amber-300 ring-2 ring-amber-400 font-bold' 
                  : 'bg-amber-900/80 hover:bg-amber-800 text-amber-100 border-amber-700/80'
              }`}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              Configuração da IA
            </button>
          </div>
        </div>
      </header>

      {/* PANEL 1: PROFILE & PRINTING DENTISTRY MODAL */}
      {activeModal === 'profile' && (
        <div className="bg-emerald-950 text-emerald-100 p-4 border-b border-emerald-800 print:hidden transition-all shadow-inner">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
              <h3 className="font-bold text-sm flex items-center text-emerald-300">
                <User className="w-4 h-4 mr-1.5 text-emerald-400" /> Perfil Profissional da Nutricionista (Dados de Impressão)
              </h3>
              <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">Utilizado nos cabeçalhos e rodapés dos laudos</span>
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

      {/* PANEL 2: AI ENGINE & MODEL CONFIGURATION MODAL */}
      {activeModal === 'ai' && (
        <div className="bg-slate-900 text-slate-100 p-4 border-b border-amber-500/30 print:hidden transition-all shadow-inner">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm flex items-center text-amber-300">
                <Zap className="w-4 h-4 mr-1.5 text-amber-400" /> Configuração do Motor de IA (Google Gemini)
              </h3>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">Conexão Ativa via Gemini API</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-amber-200 font-bold">Modelo Ativo de Leitura e Interpretação</label>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                >
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (Recomendado - Mais Inteligente e Preciso)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Super Rápido e Econômico)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Geração 2.5 - Cota e Fila Separadas)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Leve e Baixa Latência)</option>
                  <option value="gemini-3.5-pro">Gemini 3.5 Pro (Raciocínio Clínico Avançado)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                </select>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  🛡️ <strong>Cascata Inteligente Ativa:</strong> Se o modelo principal exceder a cota diária (Erro 429), a aplicação alternará automaticamente na sequência (<em>3.7 Flash → 3.5 Flash-Lite → 2.5 Flash → 2.5 Flash-Lite</em>) para nunca interromper seu atendimento.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Status da Conexão</span>
                <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Gemini API Operacional</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Modelo Selecionado: <strong className="text-amber-300">{selectedModel}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-slate-800">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-5 py-1.5 rounded transition shadow"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Fallback & Notification Banner */}
      {appNotification && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in print:hidden border-b border-amber-600">
          <div className="max-w-7xl mx-auto w-full flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0 animate-bounce" />
            <span>{appNotification.message}</span>
          </div>
          <button 
            onClick={() => setAppNotification(null)}
            className="text-slate-900 hover:text-black font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {appMode === 'anamnese' ? (
        <main className="flex-1 w-full mx-auto p-4 md:p-6 print:p-0">
          <Anamnese activeModel={selectedModel} />
        </main>
      ) : (
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 print:p-0">

        {/* LAUDO TABS */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto print:hidden">
          <button 
            onClick={() => setCurrentStep(1)} 
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wide rounded-t-lg transition-all whitespace-nowrap ${currentStep === 1 ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
          >
            1. Upload PDFs
          </button>
          <button 
            onClick={() => currentStep >= 2 && setCurrentStep(2)} 
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wide rounded-t-lg transition-all whitespace-nowrap ${currentStep === 2 ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-sm' : 'text-slate-400 hover:text-emerald-600'} ${currentStep < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            2. Seleção de Dados
          </button>
          <button 
            onClick={() => currentStep >= 2 && setCurrentStep(3)} 
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wide rounded-t-lg transition-all whitespace-nowrap ${currentStep === 3 ? 'bg-white text-emerald-700 border-x border-t border-slate-200 shadow-sm' : 'text-slate-400 hover:text-emerald-600'} ${currentStep < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            3. Laudo Unificado
          </button>
        </div>

        {/* STEP 1: UPLOAD SCREEN */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-3 pt-2 pb-2">
              <span className="inline-block px-3.5 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider border border-emerald-200/50">
                Interpretador Inteligente de Laudos
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Plataforma de geração de Laudo Integrado
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                Envie o laudo de <strong className="font-semibold text-emerald-800">Adipometria</strong> e o de <strong className="font-semibold text-teal-800">Bioimpedância</strong>. A IA extrairá os valores automaticamente para você conferir, editar e/ou selecionar os dados ideais.
              </p>
            </div>

            {/* Dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Adipometry PDF Dropzone */}
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${adipometryFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-white hover:border-emerald-400'}`}>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base">Laudo de Adipometria / Antropometria</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Medidas de dobras cutâneas, circunferências e protocolo utilizado.
                </p>

                {adipometryFile ? (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-left truncate">
                      <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700 truncate">{adipometryFile.name}</span>
                    </div>
                    <button 
                      onClick={() => setAdipometryFile(null)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs rounded-lg transition border border-emerald-200">
                    <FileUp className="w-4 h-4 mr-2" />
                    Selecionar PDF Adipometria
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="hidden" 
                      onChange={e => e.target.files?.[0] && setAdipometryFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>

              {/* Bioimpedance PDF Dropzone */}
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${bioimpedanceFile ? 'border-teal-500 bg-teal-50/50' : 'border-slate-300 bg-white hover:border-teal-400'}`}>
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base">Laudo de Bioimpedância (BIA)</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Resultados InBody, Biodynamics, Seca ou equivalente.
                </p>

                {bioimpedanceFile ? (
                  <div className="bg-white p-3 rounded-lg border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-left truncate">
                      <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700 truncate">{bioimpedanceFile.name}</span>
                    </div>
                    <button 
                      onClick={() => setBioimpedanceFile(null)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-xs rounded-lg transition border border-teal-200">
                    <FileUp className="w-4 h-4 mr-2" />
                    Selecionar PDF Bioimpedância
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

            {/* Actions & Analyze Trigger */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left space-y-1.5 max-w-md">
                <h4 className="font-bold text-slate-800 text-base flex items-center">
                  <Sparkles className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" /> Leitura Inteligente com IA Gemini
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Os dados de ambos os laudos serão mapeados e organizados automaticamente para sua conferência e escolha de fontes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto min-w-[360px] sm:min-w-[440px]">
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="w-full h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center border border-slate-200 shadow-sm hover:shadow"
                >
                  <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
                  Usar Dados de Exemplo (Demo)
                </button>

                <button
                  type="button"
                  onClick={processFilesWithGemini}
                  disabled={isAnalyzing}
                  className="w-full h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Interpretar Laudos com IA
                    </>
                  )}
                </button>
              </div>
            </div>

            {isAnalyzing && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs text-center animate-pulse">
                {analysisProgress}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: COMPARATIVE TABLE & SELECTION KEYS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Header / Info box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                  Passo 2 de 3 • Seleção de Fontes
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">Conferência e Seleção de Parâmetros</h2>
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
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-emerald-700 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-1.5" /> Dobras Cutâneas (mm) - Editável
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extractedData.skinfolds.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 gap-2">
                      <span className="text-slate-600 font-medium">{s.site}:</span>
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
                          className="w-16 text-right font-semibold text-slate-800 text-xs p-1 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500">mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circunferências (Editável) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-teal-700 mb-3 flex items-center">
                  <Scale className="w-4 h-4 mr-1.5" /> Perímetros e Circunferências (cm) - Editável
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extractedData.circumferences.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 gap-2">
                      <span className="text-slate-600 font-medium">{c.site}:</span>
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
                          className="w-16 text-right font-semibold text-slate-800 text-xs p-1 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-teal-500"
                        />
                        <span className="text-[10px] text-slate-500">cm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análise Segmentar por Membro (Editável) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide text-emerald-800 mb-3 flex items-center">
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
                    const seg = extractedData.segmental?.[limb.key] || DEMO_EXTRACTED_DATA.segmental[limb.key];
                    return (
                      <div key={limb.key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                        <strong className="text-[11px] font-bold text-slate-800 block border-b border-slate-200 pb-1">{limb.title}</strong>
                        
                        <div>
                          <label className="text-[9.5px] font-semibold text-emerald-800 block uppercase">Massa Magra (kg)</label>
                          <div className="grid grid-cols-2 gap-1 mt-0.5">
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
                              className="w-full text-xs p-1 border border-slate-300 rounded bg-white"
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
                              className="w-full text-xs p-1 border border-slate-300 rounded bg-white"
                              placeholder="% Ideal"
                            />
                          </div>
                        </div>

                        {limb.hasFat && (
                          <div>
                            <label className="text-[9.5px] font-semibold text-amber-800 block uppercase">Gordura (kg)</label>
                            <div className="grid grid-cols-2 gap-1 mt-0.5">
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
                                className="w-full text-xs p-1 border border-slate-300 rounded bg-white"
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
                                className="w-full text-xs p-1 border border-slate-300 rounded bg-white"
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-slate-800 text-xs uppercase tracking-wide text-amber-700 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" /> Parecer Nutricional Integrado (IA / Editável)
                </label>
                <button
                  onClick={generateAIAnalysis}
                  disabled={isGeneratingAI}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded flex items-center transition disabled:opacity-50"
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
                className={`w-full border rounded-lg p-3 text-xs text-slate-700 leading-relaxed focus:ring-2 focus:outline-none transition-colors ${
                  (extractedData.aiAnalysisText?.length || 0) >= 1000 
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/10' 
                    : 'border-slate-300 focus:ring-emerald-500'
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

        {/* STEP 3: CUSTOM UNIFIED REPORT (PRINT READY) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            
            {/* Top Toolbar (Hidden on Print) */}
            <div className="bg-slate-800 text-white p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-md print:hidden">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition flex items-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Editar Seleções
                </button>
                <span className="text-xs text-slate-300">
                  Laudo estruturado e pronto para envio ao paciente ou impressão.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded shadow transition flex items-center"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Imprimir / Salvar em PDF
                </button>
              </div>
            </div>

            {/* LAUDO FINAL DE NUTRIÇÃO - ESTILO A4 IMPRESSÃO (PÁGINA 1) */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page">
              
              {/* CABEÇALHO DO LAUDO */}
              <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
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

                {/* Patient Information & Methods Badge Header */}
                <div className="mt-5 print:mt-3 grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 text-xs">
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

                {/* MANDATORY REQUIREMENT: BIA Equipment & Anthropometric Method Banner */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 text-xs">
                  <div className="bg-teal-50/80 border border-teal-200 p-2.5 print:p-2 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-teal-700 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-800 block leading-tight">Bioimpedância Utilizada:</span>
                        <strong className="text-teal-950 font-semibold">{biaEquipment}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 print:p-2 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">Método Antropométrico:</span>
                        <strong className="text-emerald-950 font-semibold">{anthropometricMethod}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VISUAL BODY COMPOSITION SUMMARY (GRAPH & METRICS) */}
              <div className="space-y-3 print:space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                  Resumo da Composição Corporal Selecionada
                </h3>

                <div className="grid grid-cols-3 gap-3 print:gap-2">
                  {/* 1. % Gordura Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'fatPercentage');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          % Gordura (%G)
                        </span>
                        <span className="text-xl print:text-lg font-black text-emerald-800 block my-0.5">{val}%</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Ideal: {m?.idealMin}% - {m?.idealMax}%</span>
                      </div>
                    );
                  })()}

                  {/* 2. Massa Livre de Gordura (Massa Magra) Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'leanMass');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          Massa Livre de Gordura
                        </span>
                        <span className="text-xl print:text-lg font-black text-slate-800 block my-0.5">{val} kg</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Ideal: {m?.idealMin}kg - {m?.idealMax}kg</span>
                      </div>
                    );
                  })()}

                  {/* 3. TMB Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'bmr');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          Taxa Metabólica (TMB)
                        </span>
                        <span className="text-xl print:text-lg font-black text-amber-700 block my-0.5">{val} kcal</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Ideal: {m?.idealMin || 1200} - {m?.idealMax || 1500}</span>
                      </div>
                    );
                  })()}

                  {/* 4. Idade Metabólica Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'metabolicAge');
                    const val = m ? getFinalValue(m) : (extractedData.patient?.age ? parseInt(extractedData.patient.age) : 31);
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          Idade Metabólica
                        </span>
                        <span className="text-xl print:text-lg font-black text-indigo-800 block my-0.5">{val} anos</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Idade Real: {extractedData.patient?.age || '31 anos'}</span>
                      </div>
                    );
                  })()}

                  {/* 5. Gordura Visceral Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'visceralFatLevel');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          Gordura Visceral
                        </span>
                        <span className="text-xl print:text-lg font-black text-rose-800 block my-0.5">Nível {val}</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Faixa Ideal: {m?.idealMin || 1} a {m?.idealMax || 9}</span>
                      </div>
                    );
                  })()}

                  {/* 6. Água Corporal Total Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'totalBodyWater');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-bold text-slate-500 block truncate">
                          Água Corporal (ACT)
                        </span>
                        <span className="text-xl print:text-lg font-black text-cyan-800 block my-0.5">{val} L</span>
                        <span className="text-[9.5px] print:text-[8px] text-slate-500 block">Ideal: {m?.idealMin}L - {m?.idealMax}L</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* TABELA DETALHADA UNIFICADA */}
              <div className="space-y-3 print:space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                  Tabela Integrada de Parâmetros
                </h3>

                <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] print:text-[8px]">
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200">Parâmetro Avaliado</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">Fonte Selecionada</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">Faixa de Referência</th>
                      <th className="p-2.5 print:py-1 print:px-1.5 font-bold text-right">Resultado Obtido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {extractedData.metrics.map((m) => {
                      const finalVal = getFinalValue(m);
                      const isAdipometry = m.selected === 'adipometry';
                      return (
                        <tr key={m.key} className="hover:bg-slate-50">
                          <td className="p-2.5 print:py-1 print:px-1.5 font-medium text-slate-800 border-r border-slate-200">
                            {m.title}
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-center border-r border-slate-200">
                            <span className={`text-[10px] print:text-[8px] font-semibold px-2 py-0.5 rounded ${
                              isAdipometry 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : m.selected === 'custom' 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                            }`}>
                              {isAdipometry ? 'Adipometria' : m.selected === 'custom' ? 'Manual' : 'Bioimpedância'}
                            </span>
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">
                            {m.idealMin} - {m.idealMax} {m.unit}
                          </td>
                          <td className="p-2.5 print:py-1 print:px-1.5 text-right font-bold text-slate-900">
                            {finalVal} {m.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NOTA EXPLICATIVA SOBRE A ORIGEM DOS VALORES IDEIAIS NA PÁGINA 1 (TEXTO LIMPO) */}
              <p className="text-[9.5px] print:text-[8px] text-slate-500 leading-tight text-right pt-0.5">
                💡 <strong>Origem dos Valores Ideais:</strong> Calculados via algoritmos antropométricos normatizados para gênero, idade e estatura do paciente.
              </p>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 1) */}
              <div className="pt-8 print:pt-4 border-t border-slate-300 mt-8 print:mt-auto a4-print-footer">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{nutritionist.name}</p>
                    <p>{nutritionist.title} • {nutritionist.crn}</p>
                    <p>{nutritionist.address}</p>
                    <p>{nutritionist.phone} • {nutritionist.email}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-2">
                    <div className="text-center w-48 border-t border-slate-400 pt-2">
                      <p className="text-[11px] font-semibold text-slate-800">{nutritionist.name}</p>
                      <p className="text-[10px] text-slate-500">{nutritionist.crn}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Assinatura Digital / Carimbo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 1 de 4</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LAUDO FINAL DE NUTRIÇÃO - ESTILO A4 IMPRESSÃO (PÁGINA 2) */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">
              
              {/* CABEÇALHO DA PÁGINA 2 */}
              <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
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

                <div className="mt-5 print:mt-3 grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 text-xs">
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

              {/* DETALHAMENTO DE DOBRAS E CIRCUNFERÊNCIAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3 pt-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 border-b border-slate-200 pb-0.5">
                    Dobras Cutâneas (mm) • Antropometria
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[9px]">
                    {extractedData.skinfolds.map((s, idx) => (
                      <div key={idx} className="flex justify-between py-1 print:py-0 border-b border-slate-100">
                        <span className="text-slate-600">{s.site}</span>
                        <strong className="text-slate-800">{s.value} mm</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 border-b border-slate-200 pb-0.5">
                    Circunferências Corporais (cm)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:text-[9px]">
                    {extractedData.circumferences.map((c, idx) => (
                      <div key={idx} className="flex justify-between py-1 print:py-0 border-b border-slate-100">
                        <span className="text-slate-600">{c.site}</span>
                        <strong className="text-slate-800">{c.value} cm</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ANÁLISE VISUAL SEGMENTAR (ESTILO AVABIO COM LINHAS DE CONEXÃO) */}
              {(() => {
                const seg = extractedData.segmental || DEMO_EXTRACTED_DATA.segmental;
                
                // Função utilitária para verificar se um membro está adequado (ex: massa magra ratio >= 90 e fat ratio <= 125)
                const isAdequate = (item) => {
                  if (!item) return true;
                  const lm = item.leanMassRatio ?? 100;
                  const fm = item.fatMassRatio ?? 100;
                  return lm >= 90 && fm <= 125;
                };

                const isTrunkOk = isAdequate(seg?.trunk);
                const isRightArmOk = isAdequate(seg?.rightArm);
                const isLeftArmOk = isAdequate(seg?.leftArm);
                const isRightLegOk = isAdequate(seg?.rightLeg);
                const isLeftLegOk = isAdequate(seg?.leftLeg);

                return (
                  <div className="bg-slate-50 p-4 print:p-2.5 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 print:mb-1 border-b border-slate-200 pb-1.5 gap-1">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                          <User className="w-4 h-4 mr-1.5 text-emerald-700" />
                          Análise Segmentar de Massa Magra e Gordura
                        </h3>
                        <p className="text-[10px] print:text-[8.5px] text-slate-500">Avaliação quantitativa por membro em relação à faixa ideal de referência</p>
                      </div>

                      {/* EXPLICAÇÃO DO VALOR IDEAL NO CANTO SUPERIOR DIREITO (TEXTO LIMPO) */}
                      <p className="text-[9.5px] print:text-[8px] text-slate-500 leading-tight max-w-xs text-left sm:text-right">
                        💡 <strong>Origem do Valor Ideal:</strong> Calculado via algoritmos antropométricos normatizados para gênero, idade e estatura do paciente.
                      </p>
                    </div>

                    <div className="relative flex flex-col md:flex-row print:flex-row items-center justify-between gap-3 print:gap-2 py-1 print:py-0">
                      
                      {/* COLUNA ESQUERDA: Braço Direito & Perna Direita */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* BRAÇO DIREITO */}
                        <div className={`bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 ${isRightArmOk ? 'border-l-emerald-600' : 'border-l-amber-500'} border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Direito (BD)</strong>
                            <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${isRightArmOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {isRightArmOk ? 'Adequado' : 'Atenção'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900">{seg?.rightArm?.leanMass ?? 2.15} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.rightArm?.leanMassRatio ?? 102}% do Ideal</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900">{seg?.rightArm?.fatMass ?? 1.80} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.rightArm?.fatMassRatio ?? 115}% do Ideal</span>
                            </div>
                          </div>
                        </div>

                        {/* PERNA DIREITA */}
                        <div className={`bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 ${isRightLegOk ? 'border-l-emerald-600' : 'border-l-amber-500'} border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Direita (PD)</strong>
                            <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${isRightLegOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {isRightLegOk ? 'Adequado' : 'Atenção'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900">{seg?.rightLeg?.leanMass ?? 6.40} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.rightLeg?.leanMassRatio ?? 98}% do Ideal</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900">{seg?.rightLeg?.fatMass ?? 4.90} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.rightLeg?.fatMassRatio ?? 120}% do Ideal</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* CENTRO: SILHUETA HUMANA COM LINHAS DE CONEXÃO E PONTOS DE APONTAMENTO */}
                      <div className="relative flex-shrink-0 flex items-center justify-center py-1 w-full md:w-2/12 print:w-2/12">
                        <div className="relative w-36 h-60 print:h-52 bg-gradient-to-b from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-200/80 flex items-center justify-center p-2 shadow-inner">
                          
                          {/* SVG Silhueta Humana com Linhas de Conexão Integradas */}
                          <svg className="w-full h-full text-emerald-800/80 drop-shadow-md relative z-10 overflow-visible" viewBox="0 0 100 200" fill="currentColor">
                            {/* Corpo Humano */}
                            <circle cx="50" cy="20" r="13" />
                            <rect x="46" y="32" width="8" height="8" rx="2" />
                            <path d="M 28 40 C 35 38, 65 38, 72 40 C 77 43, 76 75, 74 110 C 65 112, 35 112, 26 110 C 24 75, 23 43, 28 40 Z" />
                            <path d="M 24 42 C 20 52, 16 80, 14 108 C 12 114, 18 116, 21 110 C 23 88, 27 58, 28 48 Z" />
                            <path d="M 76 42 C 80 52, 84 80, 86 108 C 88 114, 82 116, 79 110 C 77 88, 73 58, 72 48 Z" />
                            <path d="M 28 112 C 32 112, 47 112, 47 140 L 45 185 C 44 192, 33 192, 34 185 L 31 140 C 29 125, 27 115, 28 112 Z" />
                            <path d="M 72 112 C 68 112, 53 112, 53 140 L 55 185 C 56 192, 67 192, 66 185 L 69 140 C 71 125, 73 115, 72 112 Z" />

                            {/* Linhas de Conexão Diretas (Ligando até o centro exato de cada bolinha) */}
                            {/* Braço Direito (Conecta da esquerda X=-20 até X=20, Y=70) */}
                            <line x1="-25" y1="70" x2="20" y2="70" stroke={isRightArmOk ? "#059669" : "#f59e0b"} strokeWidth="1.5" strokeDasharray="3 2" />
                            
                            {/* Perna Direita (Conecta da esquerda X=-25 até X=38, Y=150) */}
                            <line x1="-25" y1="150" x2="38" y2="150" stroke={isRightLegOk ? "#059669" : "#f59e0b"} strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Tronco (Conecta da direita X=125 até X=50, Y=75) */}
                            <line x1="125" y1="45" x2="50" y2="75" stroke={isTrunkOk ? "#059669" : "#f59e0b"} strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Braço Esquerdo (Conecta da direita X=125 até X=80, Y=70) */}
                            <line x1="125" y1="95" x2="80" y2="70" stroke={isLeftArmOk ? "#059669" : "#f59e0b"} strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Perna Esquerda (Conecta da direita X=125 até X=62, Y=150) */}
                            <line x1="125" y1="150" x2="62" y2="150" stroke={isLeftLegOk ? "#059669" : "#f59e0b"} strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Pontos de Apontamento nos membros (Com borda branca e destaque) */}
                            <circle cx="20" cy="70" r="4.5" className={`${isRightArmOk ? 'fill-emerald-600' : 'fill-amber-500'} stroke-white stroke-2`} />
                            <circle cx="80" cy="70" r="4.5" className={`${isLeftArmOk ? 'fill-emerald-600' : 'fill-amber-500'} stroke-white stroke-2`} />
                            <circle cx="50" cy="75" r="5" className={`${isTrunkOk ? 'fill-emerald-600' : 'fill-amber-500'} stroke-white stroke-2`} />
                            <circle cx="38" cy="150" r="4.5" className={`${isRightLegOk ? 'fill-emerald-600' : 'fill-amber-500'} stroke-white stroke-2`} />
                            <circle cx="62" cy="150" r="4.5" className={`${isLeftLegOk ? 'fill-emerald-600' : 'fill-amber-500'} stroke-white stroke-2`} />
                          </svg>
                        </div>
                      </div>

                      {/* COLUNA DIREITA: Tronco, Braço Esquerdo & Perna Esquerda */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* TRONCO */}
                        <div className={`bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 ${isTrunkOk ? 'border-l-emerald-600' : 'border-l-amber-500'} border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Tronco (TR)</strong>
                            <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${isTrunkOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {isTrunkOk ? 'Adequado' : 'Atenção'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900">{seg?.trunk?.leanMass ?? 18.60} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.trunk?.leanMassRatio ?? 100}% do Ideal</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900">{seg?.trunk?.fatMass ?? 3.50} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.trunk?.fatMassRatio ?? 105}% do Ideal</span>
                            </div>
                          </div>
                        </div>

                        {/* BRAÇO ESQUERDO */}
                        <div className={`bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 ${isLeftArmOk ? 'border-l-emerald-600' : 'border-l-amber-500'} border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Esquerdo (BE)</strong>
                            <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${isLeftArmOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {isLeftArmOk ? 'Adequado' : 'Atenção'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900">{seg?.leftArm?.leanMass ?? 2.10} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.leftArm?.leanMassRatio ?? 100}% do Ideal</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900">{seg?.leftArm?.fatMass ?? 1.70} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.leftArm?.fatMassRatio ?? 112}% do Ideal</span>
                            </div>
                          </div>
                        </div>

                        {/* PERNA ESQUERDA */}
                        <div className={`bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 ${isLeftLegOk ? 'border-l-emerald-600' : 'border-l-amber-500'} border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Esquerda (PE)</strong>
                            <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${isLeftLegOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {isLeftLegOk ? 'Adequado' : 'Atenção'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900">{seg?.leftLeg?.leanMass ?? 6.30} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.leftLeg?.leanMassRatio ?? 97}% do Ideal</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900">{seg?.leftLeg?.fatMass ?? 4.80} kg</strong>
                              <span className="text-[8.5px] text-emerald-600 block font-medium">{seg?.leftLeg?.fatMassRatio ?? 118}% do Ideal</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PARECER NUTRICIONAL DA DRA. ISABELA */}
              <div className="bg-slate-50 p-3 print:p-2 rounded-lg border border-slate-200 space-y-1 print:space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-700" />
                  Diagnóstico e Parecer Nutricional Integrado
                </h4>
                <p className="text-xs print:text-[9.5px] text-slate-700 leading-relaxed italic">
                  "{extractedData.aiAnalysisText}"
                </p>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 2) */}
              <div className="pt-8 print:pt-4 border-t border-slate-300 mt-8 print:mt-auto a4-print-footer">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{nutritionist.name}</p>
                    <p>{nutritionist.title} • {nutritionist.crn}</p>
                    <p>{nutritionist.address}</p>
                    <p>{nutritionist.phone} • {nutritionist.email}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-2">
                    <div className="text-center w-48 border-t border-slate-400 pt-2">
                      <p className="text-[11px] font-semibold text-slate-800">{nutritionist.name}</p>
                      <p className="text-[10px] text-slate-500">{nutritionist.crn}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Assinatura Digital / Carimbo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 2 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* PÁGINA 3: HISTÓRICO DE EVOLUÇÃO E GRÁFICO COMPARATIVO */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-5 print:space-y-2.5 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">

              {/* CABEÇALHO DA PÁGINA 3 (IGUAL ÀS DEMAIS PÁGINAS) */}
              <div className="border-b-2 border-emerald-800 pb-4 print:pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
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

              {/* SEÇÃO 1: TABELA COMPARATIVA DE HISTÓRICO DE AVALIAÇÕES */}
              <div className="space-y-3 print:space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                    Histórico Comparativo de Avaliações Físicas
                  </h3>
                  <span className="text-[10px] text-slate-500">Últimas 4 Consultas • Variação Absoluta (Δ)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] print:text-[8px]">
                        <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200">Parâmetro Avaliado</th>
                        <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">10/01/2026</th>
                        <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">15/03/2026</th>
                        <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">20/05/2026</th>
                        <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center text-emerald-950 bg-emerald-50/80">08/08/2026 (Atual)</th>
                        <th className="p-2 print:py-1 print:px-1.5 font-bold text-center">Variação (Δ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {[
                        { param: "Peso Corporal (kg)", d1: "68.5", d2: "67.0", d3: "65.8", current: "64.7", diff: "-1.1 kg", isDown: true, isGood: true },
                        { param: "Percentual de Gordura (%G)", d1: "38.5%", d2: "36.8%", d3: "35.2%", current: "33.9%", diff: "-1.3%", isDown: true, isGood: true },
                        { param: "Massa Gorda (kg)", d1: "26.4", d2: "24.6", d3: "23.1", current: "21.9", diff: "-1.2 kg", isDown: true, isGood: true },
                        { param: "Massa Magra / Livre Gordura (kg)", d1: "42.1", d2: "42.4", d3: "42.7", current: "42.8", diff: "+0.1 kg", isDown: false, isGood: true },
                        { param: "Massa Muscular SMM (kg)", d1: "23.1", d2: "23.4", d3: "23.8", current: "24.0", diff: "+0.2 kg", isDown: false, isGood: true },
                        { param: "Água Corporal Total - ACT (L)", d1: "30.1", d2: "30.5", d3: "30.9", current: "31.2", diff: "+0.3 L", isDown: false, isGood: true },
                        { param: "Água Intracelular - AIC (L)", d1: "18.8", d2: "19.0", d3: "19.3", current: "19.5", diff: "+0.2 L", isDown: false, isGood: true },
                        { param: "Água Extracelular - AEC (L)", d1: "11.3", d2: "11.5", d3: "11.6", current: "11.7", diff: "+0.1 L", isDown: false, isGood: true },
                        { param: "Nível de Gordura Visceral", d1: "7", d2: "6", d3: "6", current: "5", diff: "-1 Nível", isDown: true, isGood: true },
                        { param: "Taxa Metabólica Basal - TMB (kcal)", d1: "1280", d2: "1288", d3: "1292", current: "1295", diff: "+3 kcal", isDown: false, isGood: true },
                        { param: "Idade Metabólica (anos)", d1: "33", d2: "31", d3: "29", current: "28", diff: "-1 ano", isDown: true, isGood: true },
                        { param: "Índice de Massa Corporal (IMC)", d1: "29.2", d2: "28.6", d3: "28.1", current: "27.6", diff: "-0.5", isDown: true, isGood: true },
                        { param: "Relação Cintura/Quadril (RCQ)", d1: "0.85", d2: "0.84", d3: "0.83", current: "0.82", diff: "-0.01", isDown: true, isGood: true },
                        { param: "Densidade Corporal (g/mL)", d1: "1.012", d2: "1.015", d3: "1.018", current: "1.020", diff: "+0.002", isDown: false, isGood: true },
                        { param: "Somatório de Dobras (mm)", d1: "245.0", d2: "230.0", d3: "218.0", current: "209.5", diff: "-8.5 mm", isDown: true, isGood: true },
                        { param: "Circunferência Cintura (cm)", d1: "88.0", d2: "86.0", d3: "84.5", current: "83.5", diff: "-1.0 cm", isDown: true, isGood: true },
                        { param: "Circunferência Abdomen (cm)", d1: "92.0", d2: "90.0", d3: "88.5", current: "87.0", diff: "-1.5 cm", isDown: true, isGood: true },
                        { param: "Circunferência Quadril (cm)", d1: "106.0", d2: "104.5", d3: "103.0", current: "102.0", diff: "-1.0 cm", isDown: true, isGood: true }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 print:py-1 print:px-1.5 font-medium text-slate-800 border-r border-slate-200">
                            {row.param}
                          </td>
                          <td className="p-1.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">{row.d1}</td>
                          <td className="p-1.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">{row.d2}</td>
                          <td className="p-1.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">{row.d3}</td>
                          <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold text-slate-900 bg-emerald-50/50 border-r border-slate-200">
                            {row.current}
                          </td>
                          <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold">
                            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-extrabold ${
                              row.isDown
                                ? row.isGood
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300" // Queda de Gordura/Peso (Verde)
                                  : "bg-amber-100 text-amber-800 border border-amber-300"     // Perda de Músculo (Âmbar)
                                : row.isGood
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"       // Ganho de Músculo (Azul)
                                  : "bg-rose-100 text-rose-800 border border-rose-300"       // Ganho de Gordura (Vermelho)
                            }`}>
                              <span>{row.isDown ? "↓" : "↑"}</span>
                              <span>{row.diff}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legenda Indicativa de Cores da Variação (NO FINAL DA TABELA) */}
                <div className="flex flex-wrap items-center justify-end gap-2 text-[8.5px] print:text-[8px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-semibold uppercase text-[8px]">Legenda Δ:</span>
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold">
                    <span>↓</span><span>Redução de Gordura/Medidas</span>
                  </span>
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-extrabold">
                    <span>↑</span><span>Ganho de Músculo</span>
                  </span>
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-extrabold">
                    <span>↑</span><span>Aumento de Gordura</span>
                  </span>
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-extrabold">
                    <span>↓</span><span>Redução de Músculo</span>
                  </span>
                </div>
              </div>

              {/* SEÇÃO 2: GRÁFICO COMPARATIVO ÚNICO DE EVOLUÇÃO TEMPORAL */}
              <div className="bg-slate-50 p-4 print:p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-start md:items-center print:items-center gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                    <Activity className="w-4 h-4 mr-1.5 text-emerald-700" />
                    Evolução da Composição Corporal (Massa Total, Magra e Gorda)
                  </h3>
                  
                  {/* Legenda do Gráfico */}
                  <div className="flex items-center space-x-3 text-[10px] font-semibold">
                    <span className="flex items-center text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1 inline-block"></span> Peso Total (kg)
                    </span>
                    <span className="flex items-center text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-1 inline-block"></span> Massa Magra (kg)
                    </span>
                    <span className="flex items-center text-amber-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1 inline-block"></span> Massa Gorda (kg)
                    </span>
                  </div>
                </div>

                {/* SVG VETORIAL PROFISSIONAL PARA IMPRESSÃO EM A4 */}
                <div className="bg-white p-3 print:p-2 rounded-lg border border-slate-200 shadow-sm flex justify-center">
                  <svg className="w-full h-44 print:h-36" viewBox="0 0 600 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    
                    {/* Linhas de Grade de Fundo */}
                    <line x1="50" y1="20" x2="570" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="50" x2="570" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="110" x2="570" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="135" x2="570" y2="135" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Eixo X: Rótulos de Datas */}
                    <text x="80" y="152" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">10/01/2026</text>
                    <text x="230" y="152" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">15/03/2026</text>
                    <text x="380" y="152" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">20/05/2026</text>
                    <text x="530" y="152" fill="#047857" fontSize="10" fontWeight="800" textAnchor="middle">08/08/2026 (Atual)</text>

                    {/* Eixo Y: Rótulos de Escala (kg) */}
                    <text x="40" y="24" fill="#94a3b8" fontSize="8" textAnchor="end">70 kg</text>
                    <text x="40" y="54" fill="#94a3b8" fontSize="8" textAnchor="end">50 kg</text>
                    <text x="40" y="84" fill="#94a3b8" fontSize="8" textAnchor="end">30 kg</text>
                    <text x="40" y="114" fill="#94a3b8" fontSize="8" textAnchor="end">15 kg</text>

                    {/* ÁREAS COM DEGRADÊ SUAVE */}
                    {/* Área Massa Magra */}
                    <polygon points="80,72 230,71 380,70 530,69.5 530,135 80,135" fill="#ecfdf5" opacity="0.6" />
                    
                    {/* LINHA 1: PESO TOTAL (Preto/Slate-800) */}
                    {/* Pontos: (80, 24) [68.5kg], (230, 28) [67.0kg], (380, 31) [65.8kg], (530, 34) [64.7kg] */}
                    <path d="M 80 24 L 230 28 L 380 31 L 530 34" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="80" cy="24" r="4" fill="#1e293b" />
                    <circle cx="230" cy="28" r="4" fill="#1e293b" />
                    <circle cx="380" cy="31" r="4" fill="#1e293b" />
                    <circle cx="530" cy="34" r="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
                    <text x="80" y="17" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">68.5kg</text>
                    <text x="230" y="21" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">67.0kg</text>
                    <text x="380" y="24" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">65.8kg</text>
                    <text x="530" y="26" fill="#0f172a" fontSize="9.5" fontWeight="900" textAnchor="middle">64.7kg</text>

                    {/* LINHA 2: MASSA MAGRA (Verde Emerald) */}
                    {/* Pontos: (80, 72) [42.1kg], (230, 71) [42.4kg], (380, 70) [42.7kg], (530, 69.5) [42.8kg] */}
                    <path d="M 80 72 L 230 71 L 380 70 L 530 69.5" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="80" cy="72" r="4" fill="#059669" />
                    <circle cx="230" cy="71" r="4" fill="#059669" />
                    <circle cx="380" cy="70" r="4" fill="#059669" />
                    <circle cx="530" cy="69.5" r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <text x="80" y="65" fill="#047857" fontSize="9" fontWeight="800" textAnchor="middle">42.1kg</text>
                    <text x="230" y="64" fill="#047857" fontSize="9" fontWeight="800" textAnchor="middle">42.4kg</text>
                    <text x="380" y="63" fill="#047857" fontSize="9" fontWeight="800" textAnchor="middle">42.7kg</text>
                    <text x="530" y="62" fill="#047857" fontSize="9.5" fontWeight="900" textAnchor="middle">42.8kg</text>

                    {/* LINHA 3: MASSA GORDA (Âmbar/Laranja) */}
                    {/* Pontos: (80, 103) [26.4kg], (230, 107) [24.6kg], (380, 110) [23.1kg], (530, 113) [21.9kg] */}
                    <path d="M 80 103 L 230 107 L 380 110 L 530 113" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="80" cy="103" r="4" fill="#d97706" />
                    <circle cx="230" cy="107" r="4" fill="#d97706" />
                    <circle cx="380" cy="110" r="4" fill="#d97706" />
                    <circle cx="530" cy="113" r="5" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                    <text x="80" y="97" fill="#b45309" fontSize="9" fontWeight="800" textAnchor="middle">26.4kg</text>
                    <text x="230" y="101" fill="#b45309" fontSize="9" fontWeight="800" textAnchor="middle">24.6kg</text>
                    <text x="380" y="104" fill="#b45309" fontSize="9" fontWeight="800" textAnchor="middle">23.1kg</text>
                    <text x="530" y="107" fill="#b45309" fontSize="9.5" fontWeight="900" textAnchor="middle">21.9kg</text>
                  </svg>
                </div>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 3) */}
              <div className="pt-6 print:pt-3 border-t border-slate-300 mt-6 print:mt-auto a4-print-footer">
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-end text-center md:text-left print:text-left gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{nutritionist.name}</p>
                    <p>{nutritionist.title} • {nutritionist.crn}</p>
                    <p>{nutritionist.address}</p>
                    <p>{nutritionist.phone} • {nutritionist.email}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-2">
                    <div className="text-center w-48 border-t border-slate-400 pt-2">
                      <p className="text-[11px] font-semibold text-slate-800">{nutritionist.name}</p>
                      <p className="text-[10px] text-slate-500">{nutritionist.crn}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Assinatura Digital / Carimbo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 3 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* PÁGINA 4: GUIA EDUCATIVO E INTERPRETAÇÃO DOS VALORES IDEIAIS */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-5 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none mt-8 print:mt-0 a4-print-page">

              {/* CABEÇALHO DA PÁGINA 4 (IGUAL ÀS DEMAIS PÁGINAS) */}
              <div className="border-b-2 border-emerald-800 pb-4 print:pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start print:flex-row">
                  <div className="flex items-center space-x-3.5">
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
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
                      <span className="text-slate-700 leading-tight"><strong>Jejum:</strong> 2h a 3h de alimentos e água em excesso.</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100 flex items-center space-x-1.5">
                      <span className="text-xs">🚫</span>
                      <span className="text-slate-700 leading-tight"><strong>Sem Álcool/Café:</strong> Evitar nas 24h pré-exame.</span>
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
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-2">
                    <div className="text-center w-48 border-t border-slate-400 pt-2">
                      <p className="text-[11px] font-semibold text-slate-800">{nutritionist.name}</p>
                      <p className="text-[10px] text-slate-500">{nutritionist.crn}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Assinatura Digital / Carimbo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800">Página 4 de 4</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
      )}
    </div>
  );
}