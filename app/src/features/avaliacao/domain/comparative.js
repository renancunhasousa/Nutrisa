  // Helper dinâmico para montar o Histórico Comparativo e os dados do Gráfico da Página 3
  export const buildComparativeData = (extractedData, getFinalValue) => {
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
