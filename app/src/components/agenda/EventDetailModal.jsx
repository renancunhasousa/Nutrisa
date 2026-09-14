import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Video, 
  Copy, 
  Check, 
  ExternalLink, 
  Edit3, 
  Save, 
  CheckCircle, 
  MessageCircle, 
  AlertCircle,
  RotateCcw,
  Palette
} from 'lucide-react';
import { colorMapper } from '../../utils/googleCalendarMapper';

export default function EventDetailModal({ 
  event, 
  onClose, 
  onUpdateEvent, 
  meetLink = 'https://meet.google.com/bela-consultas',
  onSaveMeetLink
}) {
  if (!event) return null;

  // Categoria inicial detectada
  const initialCategory = colorMapper.getCategoryByEvent(event);
  
  // Descobrir a chave correspondente da categoria inicial
  const getInitialCategoryKey = () => {
    if (event.categoryKey && colorMapper.categories[event.categoryKey]) {
      return event.categoryKey;
    }
    const foundEntry = Object.entries(colorMapper.categories).find(([k, v]) => v.label === initialCategory.label);
    return foundEntry ? foundEntry[0] : 'online';
  };

  // Estado da categoria / cor de fundo
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(getInitialCategoryKey);

  // Categoria ativa (para renderizar cor do header em tempo real)
  const activeCategory = colorMapper.categories[selectedCategoryKey] || initialCategory;
  const currentStatus = colorMapper.getStatusByTitleOrDescription(event);

  // Estados de edição
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(event.summary || '');
  const [description, setDescription] = useState(event.description || '');
  
  // Datas e Horários
  const startObj = new Date(event.start?.dateTime || event.start?.date);
  const endObj = new Date(event.end?.dateTime || event.end?.date);

  const [dateStr, setDateStr] = useState(() => {
    const y = startObj.getFullYear();
    const m = String(startObj.getMonth() + 1).padStart(2, '0');
    const d = String(startObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [startTimeStr, setStartTimeStr] = useState(() => {
    return startObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
  });

  const [endTimeStr, setEndTimeStr] = useState(() => {
    return endObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
  });

  // Status selecionado: 'a_confirmar', 'confirmado', 'desmarcado'
  const [statusKey, setStatusKey] = useState(() => {
    if (event.statusKey) return event.statusKey;
    const title = (event.summary || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    if (title.includes('[desmarcado]') || title.includes('[cancelado]') || desc.includes('desmarcado') || title.includes('❌')) {
      return 'desmarcado';
    }
    if (title.includes('[confirmado]') || desc.includes('confirmado') || title.includes('✅')) {
      return 'confirmado';
    }
    return 'a_confirmar';
  });

  // Link do Google Meet
  const [customMeetLink, setCustomMeetLink] = useState(meetLink);
  const [isEditingMeet, setIsEditingMeet] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomMeetLink(meetLink);
  }, [meetLink]);

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(customMeetLink);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  const handleSaveMeet = () => {
    if (onSaveMeetLink) {
      onSaveMeetLink(customMeetLink);
    }
    setIsEditingMeet(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Montar novas datas
      const [year, month, day] = dateStr.split('-').map(Number);
      const [startH, startM] = startTimeStr.split(':').map(Number);
      const [endH, endM] = endTimeStr.split(':').map(Number);

      const newStart = new Date(year, month - 1, day, startH, startM, 0);
      const newEnd = new Date(year, month - 1, day, endH, endM, 0);

      // Tratar status no título e descrição
      let cleanSummary = summary.replace(/\[(confirmado|desmarcado|cancelado|a_confirmar|a confirmar)\]/gi, '').replace(/[✅❌]/g, '').trim();
      let statusTag = '';
      if (statusKey === 'desmarcado') statusTag = '[DESMARCADO] ';
      else if (statusKey === 'confirmado') statusTag = '[CONFIRMADO] ';

      const finalSummary = `${statusTag}${cleanSummary}`;

      // Inverter googleColorIds para obter colorId correspondente
      const invertedColorIds = {
        'online': '7',
        'primeira_vez': '2',
        'permuta': '3',
        'presencial': '4',
        'encaixe': '5',
        'em_grupo': '6',
        'pacote': '8',
        'pessoal': '9',
        'antropometria': '10',
        'retorno': '11',
        'amigo': '11',
        'teste': '8'
      };

      const updatedPayload = {
        ...event,
        statusKey: statusKey,
        categoryKey: selectedCategoryKey,
        colorId: invertedColorIds[selectedCategoryKey] || event.colorId,
        summary: finalSummary,
        description: description,
        start: { dateTime: newStart.toISOString() },
        end: { dateTime: newEnd.toISOString() }
      };

      if (onUpdateEvent) {
        await onUpdateEvent(updatedPayload, statusKey);
      }
      setIsEditing(false);
    } catch (err) {
      alert('Erro ao salvar agendamento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const eventDateFormatted = startObj.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
        
        {/* Header com a categoria do WebDiet */}
        <div 
          className="p-6 text-white flex justify-between items-start relative overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: activeCategory.hexBg }}
        >
          <div className="relative z-10 space-y-1 max-w-[85%]">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/25 uppercase tracking-wider">
                {activeCategory.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                statusKey === 'desmarcado' 
                  ? 'bg-rose-500 text-white border-rose-300' 
                  : statusKey === 'confirmado' 
                  ? 'bg-emerald-500 text-white border-emerald-300' 
                  : 'bg-white/30 text-white border-white/40'
              }`}>
                {statusKey === 'desmarcado' ? 'Desmarcado' : statusKey === 'confirmado' ? 'Confirmado' : 'À Confirmar'}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Nome do Paciente / Consulta"
                className="w-full text-lg font-bold bg-white/20 text-white placeholder-white/60 px-3 py-1.5 rounded-xl border border-white/30 focus:outline-none focus:bg-white/30 mt-2"
              />
            ) : (
              <h3 className="text-xl md:text-2xl font-black leading-tight drop-shadow-xs pt-1">
                {summary || 'Sem Nome'}
              </h3>
            )}

            <p className="text-xs text-white/90 capitalize">
              {eventDateFormatted}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 text-slate-700 text-xs max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Seletor de Cor de Fundo / Tipo de Atendimento WebDiet */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cor de Fundo / Tipo de Consulta</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Padrão WebDiet
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'presencial', label: 'Presencial', hexBg: '#dc66aa' },
                { id: 'online', label: 'Online', hexBg: '#1bb3c8' },
                { id: 'primeira_vez', label: 'Primeira vez', hexBg: '#2ecc71' },
                { id: 'retorno', label: 'Retorno', hexBg: '#f25c38' },
                { id: 'pacote', label: 'Pacote', hexBg: '#767676' },
                { id: 'permuta', label: 'Permuta', hexBg: '#8e24aa' },
                { id: 'pessoal', label: 'Pessoal', hexBg: '#1e75bb' },
                { id: 'antropometria', label: 'Antropometria', hexBg: '#2e7d32' }
              ].map(cat => {
                const isSelected = selectedCategoryKey === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryKey(cat.id);
                      setIsEditing(true);
                    }}
                    className={`p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-white flex items-center justify-center"
                      style={{ backgroundColor: cat.hexBg }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className={`text-[11px] truncate ${isSelected ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 1: Status da Consulta */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status de Atendimento</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'confirmado', label: 'Confirmado', border: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                { id: 'a_confirmar', label: 'À Confirmar', border: 'border-slate-300 text-slate-700 bg-slate-100' },
                { id: 'desmarcado', label: 'Desmarcado', border: 'border-rose-500 text-rose-700 bg-rose-50' }
              ].map(s => {
                const isSelected = statusKey === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStatusKey(s.id);
                      setIsEditing(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      isSelected 
                        ? `${s.border} ring-2 ring-emerald-500/20 shadow-xs font-black` 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Data e Horário */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data & Horário</span>
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-emerald-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Data</span>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={e => setDateStr(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Início</span>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={e => setStartTimeStr(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Fim</span>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={e => setEndTimeStr(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{startObj.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{startTimeStr} às {endTimeStr}</span>
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Link Universal do Google Meet */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link da Reunião (Google Meet)</span>
              </label>

              <div className="flex items-center space-x-2">
                {isEditingMeet ? (
                  <button
                    onClick={handleSaveMeet}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Salvar link</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingMeet(true)}
                    className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Alterar link</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingMeet ? (
              <input
                type="text"
                value={customMeetLink}
                onChange={e => setCustomMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200/80 gap-2">
                <a
                  href={customMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 hover:underline truncate flex items-center space-x-1.5"
                >
                  <span className="truncate">{customMeetLink}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyMeet}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer ${
                    copiedMeet
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Copiar Link para envio"
                >
                  {copiedMeet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMeet ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              * Este mesmo link é reutilizado em todas as consultas online da Dra. Isabela.
            </p>
          </div>

          {/* Seção 4: Observações / Descrição */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Observações do Agendamento
            </span>
            {isEditing ? (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Observações ou anotações clínicas..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-500 resize-none"
              />
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">
                {description || 'Nenhuma observação registrada.'}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col gap-2">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const greeting = `Olá, tudo bem? Confirmando seu atendimento com a Dra. Isabela dia ${startObj.toLocaleDateString('pt-BR')} às ${startTimeStr}.`;
                  const meetText = category.label.toLowerCase().includes('online') ? `\nLink da Reunião (Google Meet): ${customMeetLink}` : '';
                  const query = encodeURIComponent(`${greeting}${meetText}`);
                  window.open(`https://wa.me/?text=${query}`, '_blank');
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Confirmação e Meet no WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
