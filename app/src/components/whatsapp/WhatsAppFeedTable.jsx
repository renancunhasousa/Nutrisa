import React from 'react';
import { 
  MessageSquare, 
  RefreshCw, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { formatWaitTime } from '../../utils/formatters';

export default function WhatsAppFeedTable({
  filteredData,
  conversations,
  loading,
  getAttendantType,
  getAttendantLabel,
  getWaitStatusBadge
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
            Feed de Conversas & Detalhes do Atendimento
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mostrando {filteredData.length} de {conversations.length} conversas sincronizadas
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-900 font-bold border border-teal-200">
            👩‍⚕️ Dra. Isabela
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-900 font-bold border border-purple-200">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-4 px-6">Atendente Responsável</th>
                <th className="py-4 px-6">Paciente / Telefone</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Última Mensagem</th>
                <th className="py-4 px-6">Data & Hora</th>
                <th className="py-4 px-6 text-center">Tempo de Espera</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.map((conv, idx) => {
                const attendantType = getAttendantType(conv);
                const isIsabela = attendantType === 'isabela';

                const pacienteNome = conv.nome_paciente || conv.nome_contato || conv.contato || 'Paciente Sem Nome';
                const pacienteTelefone = conv.telefone_paciente || conv.contato_jid || conv.telefone || '';
                const mensagemTexto = conv.conteudo_mensagem || conv.mensagem_texto || conv.mensagem || '--';
                const dataEnvio = conv.data_envio || conv.created_at || conv.data;
                const categoria = conv.categoria || conv.categoria_paciente || 'Geral';
                const tempoEspera = conv.tempo_espera_minutos ?? conv.tempo_espera ?? null;
                const isRespondida = conv.respondida === true || conv.respondida === 'true' || conv.status === 'respondida';

                return (
                  <tr key={conv.id || conv.id_mensagem || idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Badge do Atendente com visual refinado */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {isIsabela ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                          👩‍⚕️ Dra. Isabela
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                          💼 Secretária
                        </span>
                      )}
                    </td>

                    {/* Paciente */}
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{pacienteNome}</div>
                      {pacienteTelefone && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{pacienteTelefone}</div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/80">
                        {categoria}
                      </span>
                    </td>

                    {/* Conteúdo da Mensagem */}
                    <td className="py-4 px-6 max-w-xs truncate text-slate-600 font-normal">
                      {mensagemTexto}
                    </td>

                    {/* Data */}
                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-medium">
                      {dataEnvio ? new Date(dataEnvio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--'}
                    </td>

                    {/* Tempo de Espera */}
                    <td className="py-4 px-6 whitespace-nowrap text-center">
                      <div className="font-black text-slate-800 text-[13px]">
                        {formatWaitTime(tempoEspera)}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {getWaitStatusBadge(tempoEspera, isRespondida)}
                      </div>
                    </td>

                    {/* Status de Resposta */}
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      {isRespondida ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Respondida
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span> Aguardando
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
