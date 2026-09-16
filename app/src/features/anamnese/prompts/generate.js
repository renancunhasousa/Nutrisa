/**
 * Prompts de geração de anamnese usados nas chamadas à IA.
 * Centralizar aqui facilita revisão e ajuste sem tocar na UI.
 */

/**
 * Gera o prompt para preencher um template de anamnese com dados do paciente e do médico.
 * @param {string} patientData
 * @param {string} doctorData
 * @param {string[]} variableNames — lista de nomes de variáveis detectadas no template
 * @returns {string}
 */
export function buildGenerationPrompt(patientData, doctorData, variableNames) {
  return `Você é um assistente nutricional/médico altamente qualificado especializado em síntese de dados de prontuário e anamnese.
Analise criteriosamente os dois conjuntos de dados abaixo:

[DADOS PREENCHIDOS PELO PACIENTE (QUESTIONÁRIO)]
${patientData || 'Nenhum dado informado pelo paciente.'}

[NOTAS E AVALIAÇÃO DA CONSULTA (NUTRICIONISTA/MÉDICO)]
${doctorData || 'Nenhuma nota médica informada.'}

TAREFA:
Extraia e interprete as seguintes variáveis requeridas no modelo:
${variableNames.map(v => `- "${v}"`).join('\n')}

DIRETRIZES ESTRITAS:
1. Retorne ESTRITAMENTE um objeto JSON válido cujas chaves sejam EXATAMENTE o nome das variáveis listadas acima.
2. Interpole e sintetize as informações das duas fontes. Se as notas da consulta complementarem o questionário do paciente, una-as de forma coesa.
3. Se a variável solicitar síntese ou parecer, faça um resumo clínico profissional focado em nutrição e saúde com boa estruturação.
4. Caso uma variável esteja totalmente ausente em ambas as fontes, preencha o valor como "Não informado".
5. Retorne os valores em texto simples e limpo. JAMAIS inclua asteriscos de negrito (** **) nos valores do JSON.
6. Preserve quebras de linha com \\n sempre que listar múltiplos itens, condutas ou recomendações no texto.
7. Responda APENAS em formato JSON sem texto adicional.`;
}

/**
 * Prompt para traduzir o relatório gerado em linguagem simples para o paciente.
 * @param {string} reportText
 * @returns {string}
 */
export function buildPatientTranslationPrompt(reportText) {
  return `Explique este relatório médico de anamnese de forma simples, leiga e acolhedora para o paciente ler e entender: ${reportText}`;
}

/**
 * Prompt para gerar insights clínicos para a consulta de retorno.
 * @param {string} patientData
 * @param {string} doctorData
 * @param {string} reportText
 * @returns {string}
 */
export function buildClinicInsightsPrompt(patientData, doctorData, reportText) {
  return `Atue como um mentor clínico. Indique quais lacunas existem e quais perguntas importantes o nutricionista deve fazer no seguimento clínico baseado nestes dados: ${patientData} ${doctorData} ${reportText}`;
}
