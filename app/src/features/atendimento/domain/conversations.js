export function normalizeConversation(item) {
  const responded = item.respondida;
  return { ...item,
    id: item.id || item.id_mensagem,
    nome_paciente: String(item.nome_paciente || item.nome_contato || item.contato || 'Paciente sem nome'),
    telefone_paciente: String(item.telefone_paciente || item.contato_jid || item.telefone || '').replace(/@.*$/, ''),
    mensagem_texto: String(item.conteudo_mensagem || item.mensagem_texto || item.mensagem || ''),
    conteudo_mensagem: String(item.conteudo_mensagem || item.mensagem_texto || item.mensagem || ''),
    data_envio: item.data_envio || item.created_at || item.data || null,
    categoria: item.categoria || item.categoria_paciente || 'Geral',
    respondida: responded === true || responded === 'true' || (responded == null && item.status === 'respondida'),
    tempo_espera_minutos: item.tempo_espera_minutos ?? item.tempo_espera ?? null,
  };
}
export function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet formulas from being interpreted when the export is opened.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function conversationsCsv(items, getAttendantType) {
  const rows = [['ID','Data','Contato','Telefone','Origem Atendente','Categoria','Mensagem','Respondida','Tempo Espera (min)'],
    ...items.map(normalizeConversation).map(c => [c.id,c.data_envio,c.nome_paciente,c.telefone_paciente,getAttendantType(c),c.categoria,c.mensagem_texto,c.respondida ? 'Sim' : 'Não',c.tempo_espera_minutos])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
