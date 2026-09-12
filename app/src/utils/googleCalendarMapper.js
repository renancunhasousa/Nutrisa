export const colorMapper = {
  // Cores de Fundo exatas do WebDiet
  categories: {
    'presencial': { label: 'Presencial', hexBg: '#dc66aa', bgColor: 'bg-[#dc66aa]', textColor: 'text-white' },
    'online': { label: 'Online', hexBg: '#1bb3c8', bgColor: 'bg-[#1bb3c8]', textColor: 'text-white' },
    'primeira_vez': { label: 'Primeira vez', hexBg: '#2ecc71', bgColor: 'bg-[#2ecc71]', textColor: 'text-white' },
    'retorno': { label: 'Retorno', hexBg: '#f25c38', bgColor: 'bg-[#f25c38]', textColor: 'text-white' },
    'em_grupo': { label: 'Em grupo', hexBg: '#f6821f', bgColor: 'bg-[#f6821f]', textColor: 'text-white' },
    'pacote': { label: 'Pacote', hexBg: '#767676', bgColor: 'bg-[#767676]', textColor: 'text-white' },
    'permuta': { label: 'Permuta', hexBg: '#8e24aa', bgColor: 'bg-[#8e24aa]', textColor: 'text-white' },
    'pessoal': { label: 'Pessoal', hexBg: '#1e75bb', bgColor: 'bg-[#1e75bb]', textColor: 'text-white' },
    'antropometria': { label: 'Antropometria', hexBg: '#2e7d32', bgColor: 'bg-[#2e7d32]', textColor: 'text-white' },
    'amigo': { label: 'Amigo', hexBg: '#c62828', bgColor: 'bg-[#c62828]', textColor: 'text-white' },
    'encaixe': { label: 'Encaixe', hexBg: '#c86422', bgColor: 'bg-[#c86422]', textColor: 'text-white' },
    'teste': { label: 'Teste', hexBg: '#795548', bgColor: 'bg-[#795548]', textColor: 'text-white' },
    'default': { label: 'Consulta', hexBg: '#1bb3c8', bgColor: 'bg-[#1bb3c8]', textColor: 'text-white' }
  },

  // Mapeamento dos colorId (1 a 11) do Google Calendar para o WebDiet
  googleColorIds: {
    '1': 'online',          // Lavender -> Online
    '2': 'primeira_vez',    // Sage -> Primeira vez
    '3': 'permuta',         // Grape -> Permuta
    '4': 'presencial',      // Flamingo -> Presencial (Rosa)
    '5': 'encaixe',         // Banana -> Encaixe
    '6': 'em_grupo',        // Tangerine -> Em grupo
    '7': 'online',          // Peacock -> Online (Ciano)
    '8': 'pacote',          // Graphite -> Pacote (Cinza)
    '9': 'pessoal',         // Blueberry -> Pessoal (Azul)
    '10': 'antropometria',  // Basil -> Antropometria (Verde escuro)
    '11': 'retorno'         // Tomato -> Retorno (Laranja/Vermelho)
  },

  // Cores de Borda por status de confirmação
  statuses: {
    'a_confirmar': { label: 'À confirmar', hexBorder: '#9ca3af', borderClass: 'border-slate-400' },
    'confirmado': { label: 'Confirmado', hexBorder: '#00d2a0', borderClass: 'border-[#00d2a0]' },
    'desmarcado': { label: 'Desmarcado', hexBorder: '#ef4444', borderClass: 'border-red-500' }
  },

  getStatusByTitleOrDescription: (event) => {
    // 0. Se tiver statusKey explícito salvo no evento
    if (event.statusKey && colorMapper.statuses[event.statusKey]) {
      return colorMapper.statuses[event.statusKey];
    }

    const title = (event.summary || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    
    if (title.includes('[confirmado]') || desc.includes('confirmado') || title.includes('✅')) {
      return colorMapper.statuses['confirmado'];
    }
    if (title.includes('[desmarcado]') || title.includes('[cancelado]') || desc.includes('desmarcado') || title.includes('❌')) {
      return colorMapper.statuses['desmarcado'];
    }
    if (title.includes('[a_confirmar]') || title.includes('[a confirmar]') || desc.includes('a confirmar')) {
      return colorMapper.statuses['a_confirmar'];
    }
    
    // Padrão solicitado: por padrão todos ficam como 'À Confirmar'
    return colorMapper.statuses['a_confirmar'];
  },

  getCategoryByEvent: (event) => {
    // 0. Se já tiver uma categoryKey explícita definida na edição do evento
    if (event.categoryKey && colorMapper.categories[event.categoryKey]) {
      return colorMapper.categories[event.categoryKey];
    }

    // 1. Se tiver cor explícita setada no Google Agenda, respeita a cor
    const colorId = event.colorId;
    if (colorId && colorMapper.googleColorIds[colorId]) {
      const key = colorMapper.googleColorIds[colorId];
      return colorMapper.categories[key] || colorMapper.categories['default'];
    }

    const title = (event.summary || '').trim();
    const desc = (event.description || '').toLowerCase();
    const titleLower = title.toLowerCase();

    // 2. Palavras-chave explícitas no título ou descrição
    if (titleLower.includes('online') || desc.includes('online')) return colorMapper.categories['online'];
    if (titleLower.includes('presencial') || desc.includes('presencial')) return colorMapper.categories['presencial'];
    if (titleLower.includes('primeira') || desc.includes('primeira')) return colorMapper.categories['primeira_vez'];
    if (titleLower.includes('retorno') || desc.includes('retorno')) return colorMapper.categories['retorno'];

    // 3. Compromisso pessoal:
    // Título vazio, ou termos comuns de tarefas pessoais (ex: almoço, médico, academia, unha, reunião, dentista)
    const personalKeywords = ['pessoal', 'unha', 'médico', 'medico', 'dra', 'almoço', 'almoco', 'academia', 'treino', 'dentista', 'reunião', 'reuniao', 'estudo', 'folga', 'compromisso', 'banco'];
    const isPersonalKeyword = personalKeywords.some(keyword => titleLower.includes(keyword));

    if (!title || isPersonalKeyword) {
      return colorMapper.categories['pessoal'];
    }

    // 4. Calcular duração em minutos
    let durationMinutes = 60; // padrão
    if (event.start?.dateTime && event.end?.dateTime) {
      const startMs = new Date(event.start.dateTime).getTime();
      const endMs = new Date(event.end.dateTime).getTime();
      durationMinutes = Math.round((endMs - startMs) / (1000 * 60));
    }

    // 5. Regra de duração:
    // Duração <= 60 minutos: Online (Azul/Ciano WebDiet)
    // Duração > 60 minutos (ex: 1h15, 1h30, 2h): Presencial (Rosa WebDiet)
    if (durationMinutes <= 60) {
      return colorMapper.categories['online'];
    } else {
      return colorMapper.categories['presencial'];
    }
  }
};
