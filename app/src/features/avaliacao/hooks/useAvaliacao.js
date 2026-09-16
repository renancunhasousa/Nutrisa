import { emptyAssessment, validateAssessment, selectedValue } from '../domain/assessment.js';
import { EXTRACTION_PROMPT } from '../prompts/extract.js';
import { executeGemini } from '../../../shared/services/aiClient.js';
import { buildComparativeData as compare } from '../domain/comparative.js';
import { useState } from 'react';
import { DEMO_EXTRACTED_DATA } from '../domain/demo.js';
export function useAvaliacao({ selectedModel, showAppNotification }) {
const [currentStep, setCurrentStep] = useState(1);
  // File upload state
  const [adipometryFile, setAdipometryFile] = useState(null);
  const [bioimpedanceFile, setBioimpedanceFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  const executeGeminiWithFallback = payload => executeGemini(payload, selectedModel);
  // Extracted and calculated data state
  const [extractedData, setExtractedData] = useState(emptyAssessment);
  const [biaEquipment, setBiaEquipment] = useState('');
  const [anthropometricMethod, setAnthropometricMethod] = useState('');
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

    const files = [adipometryFile, bioimpedanceFile].filter(Boolean);
    if (files.some(file => !file.name.toLowerCase().endsWith('.pdf')) || files.reduce((sum, file) => sum + file.size, 0) > 2_800_000) {
      showAppNotification('Envie PDFs com tamanho combinado de até 2,8 MB.', 'error');
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

      const prompt = EXTRACTION_PROMPT;

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
          aggressiveSanitized = aggressiveSanitized.replace(/,\s*([}\]])/g, "$1");

          try {
            return JSON.parse(aggressiveSanitized);
          } catch {
            // Do not log patient content on parser errors.
            throw new Error("Não foi possível parsear a resposta da IA. Formato JSON inválido.");
          }
        };

        const parsed = validateAssessment(repairAndParseJson(rawText));
        setExtractedData(parsed);
        setCustomValues({});
        setBiaEquipment(parsed.biaEquipment);
        setAnthropometricMethod(parsed.anthropometricMethod);
        setCurrentStep(2);
      } else {
        throw new Error("Não foi possível extrair dados legíveis dos PDFs.");
      }
    } catch (err) {
      console.error("Erro na leitura de PDFs:", err);
      showAppNotification(err.message || 'Não foi possível ler os exames. Tente novamente.', 'error');
      setCurrentStep(1);
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
    setExtractedData(structuredClone(DEMO_EXTRACTED_DATA));
    setCustomValues({});
    setBiaEquipment(DEMO_EXTRACTED_DATA.biaEquipment);
    setAnthropometricMethod(DEMO_EXTRACTED_DATA.anthropometricMethod);
    setCurrentStep(2);
  };

  // Helper to get final selected value for a metric
  const getFinalValue = m => selectedValue(m, customValues);

return { currentStep, setCurrentStep, adipometryFile, setAdipometryFile, bioimpedanceFile, setBioimpedanceFile, isAnalyzing, isGeneratingAI, analysisProgress, extractedData, setExtractedData, biaEquipment, setBiaEquipment, anthropometricMethod, setAnthropometricMethod, customValues, processFilesWithGemini, generateAIAnalysis, handleSourceChange, handleCustomValueChange, loadDemoData, getFinalValue, buildComparativeData: () => compare(extractedData, getFinalValue) };
}
