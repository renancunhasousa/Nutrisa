import React, { useState, useEffect } from 'react';
import logoPdf from './assets/logo.png';
import logoPlatform from './assets/logo_new.png';
import signatureImg from './assets/assinatura.png';
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
  AlertTriangle,
  MessageSquare,
  Bell,
  Search,
  LogOut,
  Crown,
  CloudUpload
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
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
import DashboardWhatsApp from './DashboardWhatsApp';
import NotificationPopover from './components/NotificationPopover';
import AgendaView from './components/agenda/AgendaView';
import { fetchConversations } from './supabase';

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
  history: [
    {
      date: "10/01/2026",
      weight: 68.5,
      fatPercentage: 38.5,
      fatMass: 26.4,
      leanMass: 42.1,
      skeletalMuscle: 23.1,
      totalBodyWater: 30.1,
      icw: 18.8,
      ecw: 11.3,
      visceralFatLevel: 7,
      bmr: 1280,
      metabolicAge: 33,
      bmi: 29.2,
      waistHipRatio: 0.85,
      skinfoldSum: 245.0,
      waist: 88.0,
      abdomen: 92.0,
      hip: 106.0,
      bodyDensity: 1.012
    },
    {
      date: "15/03/2026",
      weight: 67.0,
      fatPercentage: 36.8,
      fatMass: 24.6,
      leanMass: 42.4,
      skeletalMuscle: 23.4,
      totalBodyWater: 30.5,
      icw: 19.0,
      ecw: 11.5,
      visceralFatLevel: 6,
      bmr: 1288,
      metabolicAge: 31,
      bmi: 28.6,
      waistHipRatio: 0.84,
      skinfoldSum: 230.0,
      waist: 86.0,
      abdomen: 90.0,
      hip: 104.5,
      bodyDensity: 1.015
    },
    {
      date: "20/05/2026",
      weight: 65.8,
      fatPercentage: 35.2,
      fatMass: 23.1,
      leanMass: 42.7,
      skeletalMuscle: 23.8,
      totalBodyWater: 30.9,
      icw: 19.3,
      ecw: 11.6,
      visceralFatLevel: 6,
      bmr: 1292,
      metabolicAge: 29,
      bmi: 28.1,
      waistHipRatio: 0.83,
      skinfoldSum: 218.0,
      waist: 84.5,
      abdomen: 88.5,
      hip: 103.0,
      bodyDensity: 1.018
    }
  ],
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
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
      ];
      if (saved && validModels.includes(saved)) {
        return saved;
      }
      return import.meta.env.VITE_GEMINI_MODEL || "gemini-3.8-flash";
    } catch (e) {
      return import.meta.env.VITE_GEMINI_MODEL || "gemini-3.8-flash";
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

  // Status e Teste de Conectividade em Tempo Real das APIs de IA
  const [geminiStatus, setGeminiStatus] = useState(() => {
    const key = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    return key && !key.includes('Sua_Chave') ? 'configured' : 'missing';
  }); // 'missing' | 'configured' | 'testing' | 'online' | 'error'
  const [deepseekStatus, setDeepseekStatus] = useState(() => {
    const key = (import.meta.env.VITE_DEEPSEEK_API_KEY || '').trim();
    return key ? 'configured' : 'missing';
  }); // 'missing' | 'configured' | 'testing' | 'online' | 'error'
  const [apiTestDetails, setApiTestDetails] = useState(null);

  const testApiConnection = async () => {
    const geminiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY || '').trim();

    setGeminiStatus('testing');
    setDeepseekStatus('testing');
    setApiTestDetails("Testando conectividade real com as APIs...");

    const results = { gemini: null, deepseek: null };

    // 1. Testar Gemini
    if (!geminiKey || geminiKey.includes('Sua_Chave')) {
      setGeminiStatus('missing');
      results.gemini = 'Chave VITE_GEMINI_API_KEY ausente no .env';
    } else {
      try {
        const pingUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;
        const res = await fetch(pingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
            generationConfig: { maxOutputTokens: 2 }
          })
        });
        if (res.ok) {
          setGeminiStatus('online');
          results.gemini = 'Online (200 OK)';
        } else {
          const err = await res.text();
          setGeminiStatus('error');
          results.gemini = `Falha ${res.status}: ${res.status === 429 ? 'Cota Excedida' : 'Erro na requisição'}`;
        }
      } catch (e) {
        setGeminiStatus('error');
        results.gemini = `Erro de rede: ${e.message}`;
      }
    }

    // 2. Testar DeepSeek
    if (!deepseekKey) {
      setDeepseekStatus('missing');
      results.deepseek = 'Chave VITE_DEEPSEEK_API_KEY não configurada no .env';
    } else {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-flash',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 2
          })
        });
        if (dsRes.ok) {
          setDeepseekStatus('online');
          results.deepseek = 'Online (200 OK)';
        } else {
          const err = await dsRes.text();
          setDeepseekStatus('error');
          results.deepseek = `Falha ${dsRes.status}: ${dsRes.status === 401 ? 'Chave Inválida' : dsRes.status === 429 ? 'Sem Saldo/Cota' : 'Erro'}`;
        }
      } catch (e) {
        setDeepseekStatus('error');
        results.deepseek = `Erro de rede: ${e.message}`;
      }
    }

    setApiTestDetails(`Gemini: ${results.gemini} | DeepSeek: ${results.deepseek}`);
  };

  // Sistema de Notificações Inteligentes
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [liveNotificationsEnabled, setLiveNotificationsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrisa_live_notifs');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const toggleLiveNotifications = () => {
    setLiveNotificationsEnabled(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('nutrisa_live_notifs', JSON.stringify(nextVal));
      } catch (e) {}
      return nextVal;
    });
  };

  // Efeito para checar alertas de Mensagens Pendentes e Virada de Mês
  useEffect(() => {
    async function checkSystemNotifications() {
      const items = [];
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });

      // 1. Alerta de Virada de Mês (ex: primeiros 5 dias do mês para gerar o relatório do mês anterior)
      if (currentDay <= 5) {
        items.push({
          id: 'month_close',
          category: 'month_close',
          type: 'warning',
          title: `Fechamento do Mês (${currentMonthName})`,
          description: `Novo mês iniciado! Lembre-se de emitir o Relatório Executivo de Metas & Bonificação da secretária.`,
          actionLabel: 'Abrir Dashboard e Gerar PDF',
          targetMode: 'dashboard',
          timeAgo: 'Lembrete do Mês'
        });
      }

      // 2. Alerta de Mensagens Pendentes no Supabase (se o modo Ao Vivo estiver ativado)
      if (liveNotificationsEnabled) {
        try {
          const convs = await fetchConversations({ limit: 100 });
          if (Array.isArray(convs)) {
            const pending = convs.filter(c => !c.respondida && c.categoria !== 'Cortesia / Encerramento');
            if (pending.length > 0) {
              items.push({
                id: 'pending_messages',
                category: 'whatsapp',
                type: pending.length >= 3 ? 'danger' : 'warning',
                title: `${pending.length} Mensagem(ns) Aguardando Resposta`,
                description: `Existem pacientes aguardando retorno no WhatsApp. Cheque a fila para manter a meta de SLA da clínica.`,
                actionLabel: 'Ver Conversas Pendentes',
                targetMode: 'dashboard',
                timeAgo: 'Ao Vivo'
              });
            }
          }
        } catch (err) {
          console.warn('Não foi possível verificar mensagens pendentes para notificações:', err);
        }
      }

      setNotificationsList(items);
    }

    checkSystemNotifications();
    const interval = setInterval(checkSystemNotifications, 60000); // Recheca a cada 1 minuto
    return () => clearInterval(interval);
  }, [liveNotificationsEnabled]);

  const showAppNotification = (message, type = 'info', duration = 6000) => {
    setAppNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setAppNotification(null), duration);
    }
  };

  // Cascata de Fallback — exclusivamente modelos Gemini (DeepSeek removido)
  const getModelFallbackChain = (initialModel) => {
    const geminiChain = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ];
    // Garante que o modelo inicial seja o primeiro e sem duplicatas
    return [initialModel, ...geminiChain.filter(m => m !== initialModel)];
  };

  // Helper com cascata Gemini para chamadas de IA na aplicação
  const executeGeminiWithFallback = async (payload) => {
    const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

    if (!geminiApiKey || geminiApiKey.includes("Sua_Chave")) {
      alert("Atenção: A chave API do Gemini (VITE_GEMINI_API_KEY) não está configurada!\n\nAcesse seu ambiente / Vercel -> Settings -> Environment Variables para configurar a chave de IA.");
      throw new Error("Chave de IA Gemini ausente ou inválida.");
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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
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
          continue;
        }

        const result = await response.json();
        return { result, usedModel: model };
      } catch (err) {
        lastError = err;
        console.warn(`Falha de rede ou execução no modelo ${model}:`, err);
      }
    }

    throw lastError || new Error("Todos os modelos Gemini falharam.");
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
Métricas (Valores): ${JSON.stringify(extractedData.metrics.map(m => {
  let val = 0;
  if (m.selected === 'custom') val = customValues[m.key] || 0;
  else if (m.selected === 'adipometry') val = m.adipometryValue ?? m.biaValue ?? 0;
  else val = m.biaValue ?? m.adipometryValue ?? 0;
  return m.title + ": " + val + " " + (m.unit || "");
}))}
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

  // Helper dinâmico para montar o Histórico Comparativo e os dados do Gráfico da Página 3
  const buildComparativeData = () => {
    const rawHistoryList = Array.isArray(extractedData.history) ? extractedData.history : [];
    const currentDate = (extractedData.patient?.date || new Date().toLocaleDateString('pt-BR')).trim();

    // FILTRO RIGOROSO: Garante que a avaliação atual NÃO se repita no histórico passado
    // Remove qualquer entrada cuja data seja igual à data atual ou cujo rótulo contenha 'atual'
    const normalizeDate = (d) => (d || "").replace(/\s+/g, "").toLowerCase();
    const currentNorm = normalizeDate(currentDate);

    const historyList = rawHistoryList.filter(h => {
      if (!h || !h.date) return false;
      const hNorm = normalizeDate(h.date);
      if (hNorm === currentNorm || hNorm.includes("atual")) return false;
      return true;
    });

    // Mapeamento dos valores atuais selecionados/customizados
    const currentMetricVal = (key) => {
      const found = extractedData.metrics?.find(m => m.key === key);
      return found ? getFinalValue(found) : null;
    };

    const currentCircumferenceVal = (siteName) => {
      const found = extractedData.circumferences?.find(c => 
        c.site?.toLowerCase().includes(siteName.toLowerCase())
      );
      return found ? found.value : null;
    };

    const currentSkinfoldSum = () => {
      const found = extractedData.metrics?.find(m => m.key === 'skinfoldSum');
      if (found && getFinalValue(found)) return getFinalValue(found);
      if (Array.isArray(extractedData.skinfolds) && extractedData.skinfolds.length > 0) {
        return extractedData.skinfolds.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
      }
      return null;
    };

    // Definição dos parâmetros da tabela com suas unidades e chaves
    const parameters = [
      { param: "Peso Corporal", unit: "kg", key: "weight", isGoodIfDown: true, getter: () => currentMetricVal("weight") },
      { param: "Percentual de Gordura (%G)", unit: "%", key: "fatPercentage", isGoodIfDown: true, getter: () => currentMetricVal("fatPercentage") },
      { param: "Massa Gorda", unit: "kg", key: "fatMass", isGoodIfDown: true, getter: () => currentMetricVal("fatMass") },
      { param: "Massa Magra / Livre Gordura", unit: "kg", key: "leanMass", isGoodIfDown: false, getter: () => currentMetricVal("leanMass") },
      { param: "Massa Muscular SMM", unit: "kg", key: "skeletalMuscle", isGoodIfDown: false, getter: () => currentMetricVal("skeletalMuscle") },
      { param: "Água Corporal Total - ACT", unit: "L", key: "totalBodyWater", isGoodIfDown: false, getter: () => currentMetricVal("totalBodyWater") },
      { param: "Água Intracelular - AIC", unit: "L", key: "icw", isGoodIfDown: false, getter: () => currentMetricVal("icw") },
      { param: "Água Extracelular - AEC", unit: "L", key: "ecw", isGoodIfDown: false, getter: () => currentMetricVal("ecw") },
      { param: "Nível de Gordura Visceral", unit: "Nível", key: "visceralFatLevel", isGoodIfDown: true, getter: () => currentMetricVal("visceralFatLevel") },
      { param: "Taxa Metabólica Basal - TMB", unit: "kcal", key: "bmr", isGoodIfDown: false, getter: () => currentMetricVal("bmr") },
      { param: "Idade Metabólica", unit: "anos", key: "metabolicAge", isGoodIfDown: true, getter: () => currentMetricVal("metabolicAge") },
      { param: "Índice de Massa Corporal (IMC)", unit: "kg/m²", key: "bmi", isGoodIfDown: true, getter: () => currentMetricVal("bmi") },
      { param: "Relação Cintura/Quadril (RCQ)", unit: "", key: "waistHipRatio", isGoodIfDown: true, getter: () => currentMetricVal("waistHipRatio") },
      { param: "Densidade Corporal", unit: "g/mL", key: "bodyDensity", isGoodIfDown: false, getter: () => currentMetricVal("bodyDensity") },
      { param: "Somatório de Dobras", unit: "mm", key: "skinfoldSum", isGoodIfDown: true, getter: () => currentSkinfoldSum() },
      { param: "Circunferência Cintura", unit: "cm", key: "waist", isGoodIfDown: true, getter: () => currentCircumferenceVal("cintura") },
      { param: "Circunferência Abdomen", unit: "cm", key: "abdomen", isGoodIfDown: true, getter: () => currentCircumferenceVal("abdomen") },
      { param: "Circunferência Quadril", unit: "cm", key: "hip", isGoodIfDown: true, getter: () => currentCircumferenceVal("quadril") }
    ];

    // Helper para buscar valor histórico respeitando a fonte selecionada
    const getPastMetricVal = (h, key) => {
      let val = h[key];
      if (typeof val === 'object' && val !== null) {
        const currentMetric = extractedData.metrics?.find(m => m.key === key);
        const source = currentMetric ? currentMetric.selected : 'adipometry';
        if (source === 'adipometry') {
          val = val.adipometryValue ?? val.biaValue ?? val.value;
        } else if (source === 'bia') {
          val = val.biaValue ?? val.adipometryValue ?? val.value;
        } else {
          val = val.adipometryValue ?? val.biaValue ?? val.value;
        }
      }
      return val !== null && val !== undefined && !isNaN(Number(val)) ? Number(val) : null;
    };

    // Colunas de datas: todas as anteriores (limitadas a até 5 para caber na folha A4 com perfeição) + atual
    const maxPastCols = 4;
    const pastDates = historyList.slice(-maxPastCols).map(h => h.date || "-");
    const allDates = [...pastDates, `${currentDate} (Atual)`];

    // Monta as linhas da tabela
    const rows = parameters.map(p => {
      const currentRaw = p.getter();
      const currentNum = currentRaw !== null && currentRaw !== undefined && !isNaN(Number(currentRaw)) ? Number(currentRaw) : null;
      
      // Valores históricos passados mapeados dinamicamente, respeitando a fonte selecionada atualmente
      const pastValues = historyList.slice(-maxPastCols).map(h => getPastMetricVal(h, p.key));

      // Último valor anterior válido para cálculo do Delta (Δ)
      const lastPastValid = [...pastValues].reverse().find(v => v !== null);

      let diffText = "-";
      let isDown = false;
      let isGood = true;

      if (currentNum !== null && lastPastValid !== null && lastPastValid !== undefined) {
        const delta = currentNum - lastPastValid;
        const absDelta = Math.abs(delta);
        isDown = delta < 0;
        isGood = p.isGoodIfDown ? isDown : !isDown;

        let formattedDelta = absDelta >= 10 ? absDelta.toFixed(0) : absDelta >= 1 ? absDelta.toFixed(1) : absDelta.toFixed(2);
        if (p.unit === "%") {
          diffText = `${delta >= 0 ? "+" : "-"}${formattedDelta}%`;
        } else if (p.unit) {
          diffText = `${delta >= 0 ? "+" : "-"}${formattedDelta} ${p.unit}`;
        } else {
          diffText = `${delta >= 0 ? "+" : "-"}${formattedDelta}`;
        }
      } else if (currentNum !== null) {
        diffText = "registro único";
        isGood = true;
      }

      const formatVal = (v) => {
        if (v === null || v === undefined) return "-";
        return p.unit === "%" ? `${v}%` : String(v);
      };

      return {
        param: `${p.param} ${p.unit ? `(${p.unit})` : ""}`,
        pastFormatted: pastValues.map(v => formatVal(v)),
        current: formatVal(currentNum),
        diff: diffText,
        isDown,
        isGood,
        hasHistory: lastPastValid !== null && lastPastValid !== undefined
      };
    });

    // Pontos para o Gráfico Evolutivo de Composição Corporal (Peso, Massa Magra, Massa Gorda)
    const currentWeight = currentMetricVal("weight");
    const currentLean = currentMetricVal("leanMass");
    const currentFat = currentMetricVal("fatMass");

    const chartPoints = [
      ...historyList.slice(-maxPastCols).map(h => ({
        date: h.date || "-",
        weight: getPastMetricVal(h, 'weight') || 0,
        leanMass: getPastMetricVal(h, 'leanMass') || 0,
        fatMass: getPastMetricVal(h, 'fatMass') || 0
      })),
      {
        date: `${currentDate} (Atual)`,
        weight: Number(currentWeight) || 0,
        leanMass: Number(currentLean) || 0,
        fatMass: Number(currentFat) || 0
      }
    ];

    return { pastDates, allDates, rows, chartPoints };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fbf9] via-[#ffffff] to-[#faf8f2] text-slate-800 flex flex-col font-sans relative overflow-x-hidden print:bg-white print:p-0">
      
      {/* Background Luxury Ambient Glows (Tiffany, Dourado Suave & Branco) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
        {/* Orbe Tiffany Superior Esquerdo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl"></div>
        {/* Orbe Dourado Suave Superior Direito */}
        <div className="absolute top-10 -right-20 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl"></div>
        {/* Orbe Tiffany/Esmeralda Médio Central */}
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl"></div>
        {/* Orbe Dourado/Champagne Inferior Direito */}
        <div className="absolute -bottom-20 right-10 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl"></div>
      </div>
      
      {/* Top Navbar - Clean SaaS / CRM Style - Hidden on Print */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-teal-900/5 sticky top-0 z-40 print:hidden transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">
          
          {/* 1. Left Section: Bigger Brand Logo + Navigation Tabs */}
          <div className="flex items-center space-x-6">
            
            {/* Brand Logo */}
            <div className="flex items-center shrink-0 py-1">
              <img 
                src={logoPlatform} 
                alt="NutrIsa" 
                className="h-14 md:h-16 w-auto object-contain transition-all hover:scale-105 drop-shadow-2xs" 
              />
            </div>

            {/* Navigation Tabs aligned to the left */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <button
                onClick={() => setAppMode('laudo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  appMode === 'laudo' 
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Avaliação</span>
              </button>
              <button
                onClick={() => setAppMode('anamnese')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  appMode === 'anamnese' 
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Anamnese</span>
              </button>
              <button
                onClick={() => setAppMode('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  appMode === 'dashboard' 
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Atendimento</span>
              </button>
              <button
                onClick={() => setAppMode('agenda')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  appMode === 'agenda' 
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

          </div>

          {/* 2. Right Section: Quick Action Buttons & Simple User Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Botão de Notificações com Popover Inteligente */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                title="Notificações e Alertas do Consultório"
                className={`p-2 rounded-xl transition-all relative border cursor-pointer ${
                  isNotificationOpen 
                    ? 'bg-slate-100 text-slate-900 border-slate-300' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Bell className="w-4 h-4" />
                {notificationsList.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {/* Modal Dropdown de Notificações */}
              <NotificationPopover
                isOpen={isNotificationOpen}
                notifications={notificationsList}
                liveEnabled={liveNotificationsEnabled}
                onToggleLive={toggleLiveNotifications}
                onClose={() => setIsNotificationOpen(false)}
                onAction={(notif) => {
                  if (notif.targetMode) {
                    setAppMode(notif.targetMode);
                  }
                }}
              />
            </div>

            {/* Configuração de IA */}
            <button 
              onClick={() => setActiveModal(activeModal === 'ai' ? null : 'ai')}
              title="Configurações de Inteligência Artificial"
              className={`p-2 rounded-xl transition-all border ${
                activeModal === 'ai'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-300/40'
                  : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50/80 border-transparent hover:border-amber-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Configuração do Perfil */}
            <button 
              onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
              title="Configurações da Clínica e Perfil"
              className={`p-2 rounded-xl transition-all border ${
                activeModal === 'profile'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-300/40'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Divisor Vertical */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Simple User Profile: Apenas Nome e Foto */}
            <div 
              onClick={() => setActiveModal(activeModal === 'profile' ? null : 'profile')}
              className="flex items-center space-x-2.5 pl-1 py-1 pr-2 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/80"
              title="Perfil: Dra. Isabela Muñoz"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white shrink-0">
                IM
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {nutritionist.name.split(' ')[0] + ' ' + (nutritionist.name.split(' ')[1] || '')}
              </span>
            </div>

          </div>

        </div>
      </header>


      {/* PANEL 1: PROFILE & PRINTING DENTISTRY MODAL */}
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

      {/* PANEL 2: AI ENGINE & MODEL CONFIGURATION MODAL */}
      {activeModal === 'ai' && (
        <div className="bg-slate-900 text-slate-100 p-4 border-b border-amber-500/30 print:hidden transition-all shadow-inner">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm flex items-center text-amber-300">
                <Zap className="w-4 h-4 mr-1.5 text-amber-400" /> Configuração do Motor de IA
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
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Padrão Google - Mais Inteligente e Recente)</option>
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash (Alta Capacidade - Cota Separada)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Leve e Baixa Latência)</option>
                </select>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  🛡️ <strong>Cascata Inteligente Ativa:</strong> Se o modelo principal exceder a cota diária ou falhar, a aplicação alternará automaticamente na sequência (<em>3.8 Flash → 3.6 Flash → 3.5 Flash-Lite</em>) para garantir atendimento ininterrupto.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Diagnóstico de Provedores</span>
                  <button
                    onClick={testApiConnection}
                    disabled={geminiStatus === 'testing'}
                    className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${geminiStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Testar Conexão</span>
                  </button>
                </div>

                {/* Gemini Status */}
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-300 font-medium">Google Gemini:</span>
                  <div className="flex items-center gap-1.5">
                    {geminiStatus === 'online' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
                      </span>
                    )}
                    {geminiStatus === 'configured' && (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chave Ativa
                      </span>
                    )}
                    {geminiStatus === 'testing' && (
                      <span className="text-amber-400 animate-pulse">Testando...</span>
                    )}
                    {geminiStatus === 'error' && (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Erro / Cota
                      </span>
                    )}
                    {geminiStatus === 'missing' && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span> Sem Chave
                      </span>
                    )}
                  </div>
                </div>


                {apiTestDetails && (
                  <p className="text-[9.5px] text-amber-200/80 bg-slate-900 p-1 rounded border border-slate-800 font-mono">
                    {apiTestDetails}
                  </p>
                )}

                <p className="text-[10px] text-slate-400 pt-0.5">
                  Modelo Ativo: <strong className="text-amber-300">{selectedModel}</strong>
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
      {appMode === 'dashboard' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">
          <DashboardWhatsApp />
        </main>
      ) : appMode === 'agenda' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">
          <AgendaView />
        </main>
      ) : appMode === 'anamnese' ? (
        <main className="flex-1 w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">
          <Anamnese activeModel={selectedModel} />
        </main>
      ) : (
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10 print:p-0">

        {/* STEPPER PROGRESS BAR - REPLICANDO O MOCKUP */}
        <div className="flex items-center justify-center max-w-2xl mx-auto my-6 print:hidden">
          {/* Step 1 */}
          <div 
            onClick={() => setCurrentStep(1)} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 1 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : currentStep > 1 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              1
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 1 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              1. Upload PDFs
            </span>
          </div>

          {/* Line 1-2 */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

          {/* Step 2 */}
          <div 
            onClick={() => currentStep >= 2 && setCurrentStep(2)} 
            className={`flex items-center space-x-2.5 ${currentStep >= 2 ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 2 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : currentStep > 2 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-400 border border-slate-200'
            }`}>
              2
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 2 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              2. Seleção de Dados
            </span>
          </div>

          {/* Line 2-3 */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

          {/* Step 3 */}
          <div 
            onClick={() => currentStep >= 2 && setCurrentStep(3)} 
            className={`flex items-center space-x-2.5 ${currentStep >= 2 ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 3 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-4 ring-emerald-50' 
                : 'bg-white text-slate-400 border border-slate-200'
            }`}>
              3
            </div>
            <span className={`text-xs uppercase tracking-wider font-extrabold transition-colors ${
              currentStep === 3 ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              3. Laudo Unificado
            </span>
          </div>
        </div>

        {/* STEP 1: UPLOAD SCREEN - EXACT MOCKUP STYLE */}
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

        {/* STEP 2: COMPARATIVE TABLE & SELECTION KEYS */}
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
                    const seg = extractedData.segmental?.[limb.key] || DEMO_EXTRACTED_DATA.segmental[limb.key];
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

        {/* STEP 3: CUSTOM UNIFIED REPORT (PRINT READY) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            
            {/* Top Toolbar (Hidden on Print) - CLEAN LUXURY SAAS STYLE */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4 print:hidden max-w-4xl mx-auto">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Editar Seleções
                </button>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Laudo estruturado e pronto para envio ao paciente ou impressão em PDF.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center space-x-2 active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
              </div>
            </div>

            {/* LAUDO FINAL DE NUTRIÇÃO - ESTILO A4 IMPRESSÃO (PÁGINA 1) */}
            <div className="bg-white border border-slate-300 rounded-none md:rounded-xl shadow-lg p-6 md:p-10 text-slate-800 max-w-4xl mx-auto space-y-6 print:space-y-3 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none a4-print-page">
              
              {/* CABEÇALHO DO LAUDO */}
              <div className="border-b-2 border-emerald-800 pb-5 print:pb-3">
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

              {/* VISUAL BODY COMPOSITION SUMMARY (GRAPH & METRICS) - IPHONE GLASS TILES */}
              <div className="space-y-3 print:space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-600 pl-2">
                    Resumo da Composição Corporal Selecionada
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 print:hidden">
                    💎 Indicadores Chave
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-2">
                  {/* 1. % Gordura Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'fatPercentage');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-emerald-800 block tracking-wider truncate">
                          % Gordura (%G)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-emerald-900 block my-1">{val}%</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-slate-500 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}% - {m?.idealMax}%
                        </span>
                      </div>
                    );
                  })()}

                  {/* 2. Massa Livre de Gordura (Massa Magra) Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'leanMass');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-slate-700 block tracking-wider truncate">
                          Massa Magra / Livre
                        </span>
                        <span className="text-2xl print:text-lg font-black text-slate-900 block my-1">{val} kg</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-slate-500 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}kg - {m?.idealMax}kg
                        </span>
                      </div>
                    );
                  })()}

                  {/* 3. TMB Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'bmr');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-amber-800 block tracking-wider truncate">
                          Taxa Metabólica (TMB)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-amber-900 block my-1">{val} kcal</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-amber-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin || 1200} - {m?.idealMax || 1500}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 4. Idade Metabólica Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'metabolicAge');
                    const val = m ? getFinalValue(m) : (extractedData.patient?.age ? parseInt(extractedData.patient.age) : 31);
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-indigo-800 block tracking-wider truncate">
                          Idade Metabólica
                        </span>
                        <span className="text-2xl print:text-lg font-black text-indigo-900 block my-1">{val} anos</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-indigo-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Cronológica: {extractedData.patient?.age || '31 anos'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 5. Gordura Visceral Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'visceralFatLevel');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-rose-800 block tracking-wider truncate">
                          Gordura Visceral
                        </span>
                        <span className="text-2xl print:text-lg font-black text-rose-900 block my-1">Nível {val}</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-rose-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Faixa Ideal: {m?.idealMin || 1} a {m?.idealMax || 9}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 6. Água Corporal Total Card */}
                  {(() => {
                    const m = extractedData.metrics.find(x => x.key === 'totalBodyWater');
                    const val = m ? getFinalValue(m) : 0;
                    return (
                      <div className="bg-white p-3 print:p-2 rounded-2xl border border-slate-200 shadow-xs text-center transition-all hover:shadow-md">
                        <span className="text-[10px] print:text-[8.5px] uppercase font-extrabold text-cyan-800 block tracking-wider truncate">
                          Água Corporal (ACT)
                        </span>
                        <span className="text-2xl print:text-lg font-black text-cyan-900 block my-1">{val} L</span>
                        <span className="text-[10px] print:text-[8px] font-medium text-cyan-800/80 bg-slate-50 py-0.5 px-2 rounded-full inline-block border border-slate-200/60">
                          Ideal: {m?.idealMin}L - {m?.idealMax}L
                        </span>
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

              {/* NOTA EXPLICATIVA SOBRE A ORIGEM DOS VALORES E METODOLOGIA INTEGRADA */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-2 print:p-1.5 text-[9px] print:text-[7.5px] text-slate-600 leading-snug space-y-0.5">
                <p>
                  🔬 <strong>Metodologia e Cálculo do Laudo:</strong> Os resultados deste laudo integram medições diretas da <strong>Bioimpedância Octapolar AvaBio 380</strong> (que analisa a resistência e reatância celular para quantificar água, massa livre e taxa metabólica) combinadas à <strong>Adipometria Clínica</strong> pelo protocolo de <em>Jackson & Pollock (7 Dobras)</em>, que afere com precisão milimétrica a gordura subcutânea.
                </p>
                <p>
                  📚 <strong>Referências e Faixas Ideais:</strong> As faixas de normalidade são personalizadas para o gênero, idade e biotipo do paciente, baseadas nos consensos da <strong>OMS/WHO</strong> (classificação de IMC e risco cardiometabólico), <strong>ACSM</strong> (diretrizes de percentual de gordura) e equações científicas validadas contra o padrão-ouro DXA (Densitometria de Dupla Energia).
                </p>
              </div>

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 1) */}
              <div className="pt-8 print:pt-4 border-t border-slate-300 mt-8 print:mt-auto a4-print-footer">
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
                        <p className="text-[10px] print:text-[8.5px] text-slate-500">Distribuição quantitativa de tecido magro e adiposo por membro corporal</p>
                      </div>
                    </div>

                    <div className="relative flex flex-col md:flex-row print:flex-row items-center justify-between gap-3 print:gap-2 py-1 print:py-0">
                      
                      {/* COLUNA ESQUERDA: Braço Direito & Perna Direita */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* BRAÇO DIREITO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Direito (BD)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightArm?.leanMass ?? 2.15} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightArm?.fatMass ?? 1.80} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* PERNA DIREITA */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Direita (PD)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightLeg?.leanMass ?? 6.40} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.rightLeg?.fatMass ?? 4.90} kg</strong>
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

                            {/* Linhas de Conexão Diretas (Ligando até o centro de cada membro) */}
                            <line x1="-25" y1="70" x2="20" y2="70" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="-25" y1="150" x2="38" y2="150" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="45" x2="50" y2="75" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="95" x2="80" y2="70" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                            <line x1="125" y1="150" x2="62" y2="150" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Pontos de Apontamento nos membros */}
                            <circle cx="20" cy="70" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="80" cy="70" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="50" cy="75" r="5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="38" cy="150" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                            <circle cx="62" cy="150" r="4.5" className="fill-emerald-600 stroke-white stroke-2" />
                          </svg>
                        </div>
                      </div>

                      {/* COLUNA DIREITA: Tronco, Braço Esquerdo & Perna Esquerda */}
                      <div className="w-full md:w-5/12 print:w-5/12 space-y-3 print:space-y-1.5 z-10">
                        
                        {/* TRONCO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Tronco (TR)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.trunk?.leanMass ?? 18.60} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.trunk?.fatMass ?? 3.50} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* BRAÇO ESQUERDO */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Braço Esquerdo (BE)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftArm?.leanMass ?? 2.10} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftArm?.fatMass ?? 1.70} kg</strong>
                            </div>
                          </div>
                        </div>

                        {/* PERNA ESQUERDA */}
                        <div className="bg-white p-2.5 print:p-1.5 rounded-lg border-l-4 border-l-emerald-700 border border-slate-200 shadow-sm text-xs space-y-1 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                            <strong className="text-emerald-950 font-bold uppercase text-[10px]">Perna Esquerda (PE)</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] print:text-[9px]">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Massa Magra</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftLeg?.leanMass ?? 6.30} kg</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8.5px] uppercase font-bold text-emerald-800 block">Gordura</span>
                              <strong className="text-slate-900 text-sm print:text-xs">{seg?.leftLeg?.fatMass ?? 4.80} kg</strong>
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
                  <div className="flex flex-col items-center md:items-end print:items-end space-y-1">
                    <div className="flex flex-col items-center md:items-end print:items-end">
                      <img 
                        src={signatureImg} 
                        alt="Assinatura da Nutricionista" 
                        className="h-18 md:h-20 w-auto object-contain drop-shadow-xs" 
                      />
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

              {/* SEÇÃO 1: TABELA COMPARATIVA DE HISTÓRICO DE AVALIAÇÕES */}
              {(() => {
                const comparative = buildComparativeData();
                const pastCols = comparative.pastDates;
                const hasPastHistory = pastCols.length > 0;

                // Preparação dos dados do gráfico SVG dinâmico
                const pts = comparative.chartPoints;
                // Calculamos max e min para escala vertical inteligente
                const allValues = pts.flatMap(p => [p.weight, p.leanMass, p.fatMass]).filter(v => v > 0);
                const maxVal = allValues.length > 0 ? Math.max(...allValues) : 70;
                const minVal = allValues.length > 0 ? Math.min(...allValues) : 15;
                const topScale = Math.ceil(maxVal / 5) * 5 + 5;
                const bottomScale = Math.max(0, Math.floor(minVal / 5) * 5 - 5);
                const scaleRange = topScale - bottomScale || 1;

                // Dimensões SVG: largura 600, altura 160. Área útil y: 20 (topo) a 130 (base).
                const getY = (val) => {
                  if (!val || isNaN(val)) return 130;
                  const ratio = (val - bottomScale) / scaleRange;
                  const clampedRatio = Math.max(0, Math.min(1, ratio));
                  return 130 - clampedRatio * 105; // 25 a 130
                };

                // Posições horizontais X distribuídas
                const getX = (idx, total) => {
                  if (total === 1) return 300;
                  const startX = 90;
                  const endX = 540;
                  return startX + (idx / (total - 1)) * (endX - startX);
                };

                const weightPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.weight), val: p.weight, date: p.date }));
                const leanPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.leanMass), val: p.leanMass, date: p.date }));
                const fatPoints = pts.map((p, idx) => ({ x: getX(idx, pts.length), y: getY(p.fatMass), val: p.fatMass, date: p.date }));

                const makePath = (points) => {
                  if (points.length === 0) return "";
                  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
                  return points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.y}`, "");
                };

                return (
                  <>
                    <div className="space-y-3 print:space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l-2 border-emerald-700 pl-2">
                          Histórico Comparativo de Avaliações Físicas
                        </h3>
                        <span className="text-[10px] text-slate-500">
                          {hasPastHistory 
                            ? `Últimas ${pastCols.length + 1} Consultas • Variação Absoluta (Δ)` 
                            : "Consulta Atual • Variação Absoluta (Δ)"}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] print:text-[8px]">
                              <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200">Parâmetro Avaliado</th>
                              {pastCols.map((d, i) => (
                                <th key={i} className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center">
                                  {d}
                                </th>
                              ))}
                              <th className="p-2 print:py-1 print:px-1.5 font-bold border-r border-slate-200 text-center text-emerald-950 bg-emerald-50/80">
                                {extractedData.patient?.date || "Atual"} (Atual)
                              </th>
                              <th className="p-2 print:py-1 print:px-1.5 font-bold text-center">Variação (Δ)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {comparative.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1.5 print:py-1 print:px-1.5 font-medium text-slate-800 border-r border-slate-200">
                                  {row.param}
                                </td>
                                {row.pastFormatted.map((val, pIdx) => (
                                  <td key={pIdx} className="p-1.5 print:py-1 print:px-1.5 text-center text-slate-500 border-r border-slate-200">
                                    {val}
                                  </td>
                                ))}
                                <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold text-slate-900 bg-emerald-50/50 border-r border-slate-200">
                                  {row.current}
                                </td>
                                <td className="p-1.5 print:py-1 print:px-1.5 text-center font-bold">
                                  {row.hasHistory ? (
                                    <span className={`font-bold text-xs ${
                                      row.isDown
                                        ? row.isGood
                                          ? "text-emerald-700"
                                          : "text-amber-700"
                                        : row.isGood
                                          ? "text-blue-700"
                                          : "text-rose-700"
                                    }`}>
                                      {row.isDown ? "↓ " : "↑ "}{row.diff}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-medium italic">
                                      {row.diff}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Legenda Indicativa de Cores da Variação */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] print:text-[8px] pt-1 border-t border-slate-200/60 text-slate-500">
                        <span className="font-semibold uppercase text-[8px] mr-1">Legenda Δ:</span>
                        <span className="text-emerald-700 font-semibold">↓ Gordura/Medidas</span>
                        <span className="text-blue-700 font-semibold">↑ Massa Magra</span>
                        <span className="text-rose-700 font-semibold">↑ Gordura/Medidas</span>
                        <span className="text-amber-700 font-semibold">↓ Massa Magra</span>
                      </div>
                    </div>

                    {/* SEÇÃO 2: GRÁFICO COMPARATIVO ÚNICO DE EVOLUÇÃO TEMPORAL */}
                    <div className="bg-slate-50/70 p-4 print:p-2 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex flex-col md:flex-row print:flex-row justify-between items-start md:items-center print:items-center gap-2 border-b border-slate-200/60 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                          <Activity className="w-4 h-4 mr-1.5 text-teal-600" />
                          Evolução da Composição Corporal
                        </h3>
                        
                        {/* Legenda com círculos coloridos */}
                        <div className="flex items-center space-x-4 text-[11px] font-bold">
                          <span className="flex items-center text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1.5 inline-block"></span> Peso Total
                          </span>
                          <span className="flex items-center text-teal-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] mr-1.5 inline-block"></span> Massa Magra
                          </span>
                          <span className="flex items-center text-purple-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] mr-1.5 inline-block"></span> Massa Gorda
                          </span>
                        </div>
                      </div>

                      {/* GRÁFICO RECHARTS — visível apenas na tela, oculto na impressão */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs print:hidden">
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                              data={pts} 
                              margin={{ top: 20, right: 25, left: 10, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#334155" stopOpacity={0.22}/>
                                  <stop offset="95%" stopColor="#334155" stopOpacity={0.01}/>
                                </linearGradient>
                                <linearGradient id="leanGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.01}/>
                                </linearGradient>
                                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="date" 
                                padding={{ left: 35, right: 25 }}
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                              />
                              <YAxis 
                                domain={[bottomScale, topScale]}
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                unit=" kg"
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="weight" 
                                name="Peso Total" 
                                stroke="#1e293b" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#weightGrad)" 
                                dot={{ r: 4, fill: "#1e293b", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y - 8} fill="#0f172a" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="leanMass" 
                                name="Massa Magra" 
                                stroke="#14B8A6" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#leanGrad)" 
                                dot={{ r: 4, fill: "#14B8A6", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y - 8} fill="#0f766e" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                              <Area 
                                isAnimationActive={false}
                                type="monotone" 
                                dataKey="fatMass" 
                                name="Massa Gorda" 
                                stroke="#8B5CF6" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#fatGrad)" 
                                dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 1.5, stroke: "#ffffff" }}
                                activeDot={false}
                                label={({ x, y, value }) => (
                                  <text x={x} y={y + 16} fill="#7c3aed" fontSize={9.5} fontWeight={800} textAnchor="middle">
                                    {value ? `${value}kg` : ""}
                                  </text>
                                )}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* GRÁFICO SVG PURO — visível apenas na impressão/PDF, oculto na tela */}
                      <div className="hidden print:block bg-white p-2 rounded-xl border border-slate-200/70">
                        <svg
                          viewBox="0 0 600 160"
                          width="100%"
                          height="160"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ display: 'block', overflow: 'visible' }}
                        >
                          <defs>
                            <linearGradient id="svgWeightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#334155" stopOpacity="0.20"/>
                              <stop offset="95%" stopColor="#334155" stopOpacity="0.01"/>
                            </linearGradient>
                            <linearGradient id="svgLeanGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14B8A6" stopOpacity="0.30"/>
                              <stop offset="95%" stopColor="#14B8A6" stopOpacity="0.01"/>
                            </linearGradient>
                            <linearGradient id="svgFatGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity="0.30"/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity="0.01"/>
                            </linearGradient>
                          </defs>

                          {/* Eixo Y — linhas de grade horizontais */}
                          {[0, 25, 50, 75, 100].map(pct => {
                            const yPos = 20 + (pct / 100) * 110;
                            const val = Math.round(topScale - (pct / 100) * scaleRange);
                            return (
                              <g key={pct}>
                                <line x1="60" y1={yPos} x2="580" y2={yPos} stroke="#e2e8f0" strokeWidth="0.8"/>
                                <text x="55" y={yPos + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="sans-serif">{val} kg</text>
                              </g>
                            );
                          })}

                          {/* Eixo X — datas */}
                          {pts.map((p, idx) => (
                            <text
                              key={idx}
                              x={getX(idx, pts.length)}
                              y="148"
                              fill="#64748b"
                              fontSize="9"
                              fontWeight="600"
                              textAnchor="middle"
                              fontFamily="sans-serif"
                            >{p.date}</text>
                          ))}

                          {/* Área preenchida — Peso Total */}
                          {weightPoints.length > 1 && (
                            <polygon
                              points={[
                                ...weightPoints.map(p => `${p.x},${p.y}`),
                                `${weightPoints[weightPoints.length-1].x},130`,
                                `${weightPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgWeightGrad)"
                            />
                          )}
                          {/* Área preenchida — Massa Magra */}
                          {leanPoints.length > 1 && (
                            <polygon
                              points={[
                                ...leanPoints.map(p => `${p.x},${p.y}`),
                                `${leanPoints[leanPoints.length-1].x},130`,
                                `${leanPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgLeanGrad)"
                            />
                          )}
                          {/* Área preenchida — Massa Gorda */}
                          {fatPoints.length > 1 && (
                            <polygon
                              points={[
                                ...fatPoints.map(p => `${p.x},${p.y}`),
                                `${fatPoints[fatPoints.length-1].x},130`,
                                `${fatPoints[0].x},130`
                              ].join(' ')}
                              fill="url(#svgFatGrad)"
                            />
                          )}

                          {/* Linha — Peso Total */}
                          <polyline
                            points={weightPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {/* Linha — Massa Magra */}
                          <polyline
                            points={leanPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#14B8A6"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {/* Linha — Massa Gorda */}
                          <polyline
                            points={fatPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />

                          {/* Pontos e valores — Peso Total */}
                          {weightPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#1e293b" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y - 8} fill="#0f172a" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                          {/* Pontos e valores — Massa Magra */}
                          {leanPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#14B8A6" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y - 8} fill="#0f766e" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                          {/* Pontos e valores — Massa Gorda */}
                          {fatPoints.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="1.5"/>
                              <text x={p.x} y={p.y + 16} fill="#7c3aed" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                                {p.val ? `${p.val}kg` : ""}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* RODAPÉ UNIFICADO DO LAUDO DA NUTRICIONISTA (PÁGINA 3) */}
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
          </div>
        )}

      </main>
      )}
    </div>
  );
}