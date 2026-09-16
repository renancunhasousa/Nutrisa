import React, { useState } from 'react';
import { 
  MessageSquare, 
  RefreshCw, 
  Clock, 
  Eye, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { formatWaitTime, cleanPhoneNumber } from '../../../shared/utils/formatters.js';

const CATEGORY_STYLES = {
  'Agendamento e Horários': 'bg-blue-50 text-blue-700 border-blue-200',
  'Dúvida Plano Alimentar': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Dificuldades e Sintomas': 'bg-amber-50 text-amber-700 border-amber-200',
  'Exames e Documentos': 'bg-purple-50 text-purple-700 border-purple-200',
  'Suplementação e Receitas': 'bg-teal-50 text-teal-700 border-teal-200',
  'Pagamentos e Financeiro': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Planos e Pacotes': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Feedback e Motivação': 'bg-pink-50 text-pink-700 border-pink-200',
  'Outro': 'bg-slate-50 text-slate-700 border-slate-200'
};

export default function WhatsAppFeedTable({
  filteredData,
  conversations,
  loading,
  getAttendantType
}) {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* CABEÇALHO DO FEED */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
              Feed de Conversas & Detalhes do Atendimento
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Mostrando {filteredData.length} de {conversations.length} conversas sincronizadas
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs">
              👩‍⚕️ Dra. Isabela
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs">
              💼 Secretária
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Carregando conversas do Supabase...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Nenhuma conversa encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="w-full max-h-[620px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50/95 backdrop-blur-xs border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-3 px-3 w-[18%]">PACIENTE</th>
                  <th className="py-3 px-2 w-[10%]">DATA</th>
                  <th className="py-3 px-2 w-[12%]">ATENDENTE</th>
                  <th className="py-3 px-2 w-[14%]">CATEGORIA</th>
                  <th className="py-3 px-3 w-[26%]">MENSAGEM</th>
                  <th className="py-3 px-2 w-[9%] text-center">TEMPO</th>
                  <th className="py-3 px-2 w-[8%] text-center">STATUS</th>
                  <th className="py-3 px-3 w-[5%] text-right">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredData.map((conv, idx) => {
                  const attendantType = getAttendantType(conv);
                  const isIsabela = attendantType === 'isabela';

                  const pacienteNome = conv.nome_paciente || conv.nome_contato || conv.contato || 'Paciente Sem Nome';
                  const rawPhone = conv.telefone_paciente || conv.contato_jid || conv.telefone || '';
                  const pacienteTelefone = cleanPhoneNumber(rawPhone);
                  const mensagemTexto = conv.conteudo_mensagem || conv.mensagem_texto || conv.mensagem || '--';
                  const dataEnvio = conv.data_envio || conv.created_at || conv.data;
                  const categoria = conv.categoria || conv.categoria_paciente || 'Geral';
                  const tempoEspera = conv.tempo_espera_minutos ?? conv.tempo_espera ?? null;
                  const isRespondida = conv.respondida === true || conv.respondida === 'true' || conv.status === 'respondida';

                  const pacienteFoto = conv.foto_perfil || null;

                  const initial = pacienteNome.charAt(0).toUpperCase() || 'P';

                  let dataFormatada = '--';
                  if (dataEnvio) {
                    const d = new Date(dataEnvio);
                    if (!isNaN(d.getTime())) {
                      const dia = d.getDate().toString().padStart(2, '0');
                      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
                      const hora = d.getHours().toString().padStart(2, '0');
                      const min = d.getMinutes().toString().padStart(2, '0');
                      dataFormatada = `${dia}/${mes}, ${hora}:${min}`;
                    }
                  }

                  const catClass = CATEGORY_STYLES[categoria] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <tr key={conv.id || conv.id_mensagem || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. PACIENTE */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {pacienteFoto ? (
                            <img 
                              src={pacienteFoto} 
                              alt={pacienteNome}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-emerald-200/80 flex-shrink-0 shadow-2xs"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 font-black text-[11px] flex items-center justify-center flex-shrink-0 ${pacienteFoto ? 'hidden' : ''}`}>
                            {initial}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-extrabold text-slate-900 leading-tight truncate text-[11.5px]" title={pacienteNome}>
                              {pacienteNome}
                            </div>
                            {pacienteTelefone && (
                              <div className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5 truncate">{pacienteTelefone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. DATA */}
                      <td className="py-3 px-2 text-slate-500 font-medium text-[11px] truncate">
                        {dataFormatada}
                      </td>

                      {/* 3. ATENDENTE */}
                      <td className="py-3 px-2">
                        {isIsabela ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-50/80 text-teal-800 border border-teal-300 shadow-2xs truncate">
                            👩‍⚕️ Dra. Isabela
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs truncate">
                            💼 Secretária
                          </span>
                        )}
                      </td>

                      {/* 4. CATEGORIA */}
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-2xs truncate max-w-full ${catClass}`} title={categoria}>
                          {categoria}
                        </span>
                      </td>

                      {/* 5. MENSAGEM */}
                      <td className="py-3 px-3 text-slate-600 font-normal text-[11.5px] truncate" title={mensagemTexto}>
                        {mensagemTexto}
                      </td>

                      {/* 6. TEMPO DE ESPERA */}
                      <td className="py-3 px-2 text-center">
                        {tempoEspera === null || tempoEspera === undefined || isNaN(Number(tempoEspera)) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            --
                          </span>
                        ) : (() => {
                          const m = Number(tempoEspera);
                          if (m < 30) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-emerald-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          } else if (m <= 60) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-amber-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                <Clock className="w-3 h-3 mr-0.5 text-rose-600" />
                                {formatWaitTime(m)}
                              </span>
                            );
                          }
                        })()}
                      </td>

                      {/* 7. STATUS */}
                      <td className="py-3 px-2 text-center">
                        {isRespondida ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Respondida
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            Aguardando
                          </span>
                        )}
                      </td>

                      {/* 8. AÇÃO */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedChat(conv)}
                          className="inline-flex items-center text-[11.5px] font-bold text-slate-800 hover:text-black transition-colors active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-800" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedChat && (() => {
        const attendantType = getAttendantType(selectedChat);
        const isIsabela = attendantType === 'isabela';
        const pacienteNome = selectedChat.nome_paciente || selectedChat.nome_contato || selectedChat.contato || 'Paciente Sem Nome';
        const rawModalPhone = selectedChat.telefone_paciente || selectedChat.contato_jid || selectedChat.telefone || '';
        const pacienteTelefone = cleanPhoneNumber(rawModalPhone);
        const dataEnvio = selectedChat.data_envio || selectedChat.created_at || selectedChat.data;
        const categoria = selectedChat.categoria || selectedChat.categoria_paciente || 'Geral';
        const tempoEspera = selectedChat.tempo_espera_minutos ?? selectedChat.tempo_espera ?? null;
        const mensagemTexto = selectedChat.conteudo_mensagem || selectedChat.mensagem_texto || selectedChat.mensagem || '--';
        const respostaSecretaria = selectedChat.resposta_secretaria || selectedChat.resposta || selectedChat.observacao || null;
        const categoriaSecretaria = selectedChat.categoria_secretaria || categoria;
        const initial = pacienteNome.charAt(0).toUpperCase() || 'P';

        let dataCompleta = '--';
        if (dataEnvio) {
          const d = new Date(dataEnvio);
          if (!isNaN(d.getTime())) {
            dataCompleta = `${d.toLocaleDateString('pt-BR')} • ${d.toLocaleTimeString('pt-BR')}`;
          }
        }

        const modalFoto = selectedChat.foto_perfil || null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
              <div className="bg-[#005B48] p-5 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {modalFoto ? (
                    <img 
                      src={modalFoto} 
                      alt={pacienteNome}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/30 flex-shrink-0 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${modalFoto ? 'hidden' : ''}`}>
                    {initial}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight leading-tight text-white">{pacienteNome}</h3>
                    <p className="text-[11px] text-emerald-100/90 font-mono mt-0.5">
                      {pacienteTelefone} • {dataCompleta}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CORPO DO MODAL */}
              <div className="p-6 space-y-5 bg-white">
                
                {/* BADGES SUPERIORES */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1 bg-[#EEF4FF] text-[#3568D4] font-bold text-[11px] rounded-full border border-[#D0E0FC]">
                    Assunto: {categoria}
                  </span>

                  <span className="px-3.5 py-1 bg-[#E6F8F3] text-[#007A5A] font-bold text-[11px] rounded-full border border-[#B3EBDC] flex items-center shadow-2xs">
                    {respostaSecretaria 
                      ? `👩‍⚕️ Respondido por ${isIsabela ? 'Dra. Isabela' : 'Secretária'}` 
                      : `⏳ Atribuído para ${isIsabela ? 'Dra. Isabela' : 'Secretária'}`}
                  </span>

                  {tempoEspera !== null && tempoEspera !== undefined && (
                    <span className="px-3.5 py-1 bg-[#EEF4FF] text-[#3568D4] font-bold text-[11px] rounded-full border border-[#D0E0FC] flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#3568D4]" />
                      Espera: {formatWaitTime(tempoEspera)}
                    </span>
                  )}
                </div>

                {/* 1. MENSAGEM DO PACIENTE (BALÃO COM PONTA PUXADA NO CANTO SUPERIOR ESQUERDO) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pl-1">
                    MENSAGEM DO PACIENTE
                  </label>
                  <div className="relative p-4 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs shadow-2xs">
                    <p className="text-slate-800 text-[13px] leading-relaxed font-normal">
                      {mensagemTexto}
                    </p>
                  </div>
                </div>

                {/* 2. RESPOSTA REGISTRADA (BALÃO COM PONTA PUXADA NO CANTO SUPERIOR ESQUERDO E FUNDO VERDE PASTEL) */}
                {respostaSecretaria ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#006C4E] flex items-center pl-1">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#008964]" />
                      RESPOSTA REGISTRADA
                    </label>
                    <div className="relative p-4 bg-[#F0FAF6] border border-[#BDE8D9] rounded-2xl rounded-tl-xs space-y-1.5 shadow-2xs">
                      {categoriaSecretaria && (
                        <div className="text-[11px] font-bold text-[#007050]">
                          Classificação: {categoriaSecretaria}
                        </div>
                      )}
                      <p className="text-slate-800 text-[12.5px] leading-relaxed font-normal">
                        {respostaSecretaria}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl rounded-tl-xs text-xs text-amber-900 flex items-center justify-between">
                    <span>⏳ Esta mensagem ainda está aguardando retorno da equipe.</span>
                  </div>
                )}

              </div>

              {/* RODAPÉ DO MODAL */}
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="px-6 py-2 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
