# Contexto global e histórico clínico

O paciente ativo é mantido pelo `PatientContext` e pode ser escolhido no seletor global do cabeçalho. A seleção persiste no navegador até ser trocada ou removida. Avaliação, Anamnese, Dietas e Contratos exibem uma faixa compacta que confirma o vínculo; todos esses módulos também podem ser usados sem paciente selecionado.

## Registros independentes

A ficha consulta pelo `patient_id` as tabelas `physical_evaluations`, `anamnese`, `plano_alimentar` e `contracts`. Cada ocorrência mantém seu próprio `id`, data e status, permitindo várias avaliações, anamneses, dietas e contratos para o mesmo paciente.

- Avaliações têm ação explícita para salvar ou atualizar no prontuário.
- Anamneses são persistidas ao gerar o relatório e um registro reaberto é atualizado pelo próprio `id`.
- Dietas mantêm as ações de salvar rascunho e publicar e podem ser reabertas pelo histórico.
- Contratos são criados ao gerar o link de assinatura; contratos assinados são somente para consulta.

O histórico oferece filtros por tipo, visualização rápida e abertura dos registros editáveis. O encaminhamento usa `sessionStorage` somente para transportar o registro ao módulo; a identidade ativa do paciente continua sendo responsabilidade do `PatientContext`.

## Histórico dentro dos módulos

Quando há um paciente ativo, a faixa de contexto de Avaliação, Anamnese, Dietas e Contratos mostra o botão **Ver histórico**. Ele abre somente os registros do tipo correspondente à feature atual e daquele paciente. A lista permite pré-visualizar qualquer item e abrir os registros editáveis no próprio módulo; contratos permanecem somente para visualização depois de assinados.

## Segurança

As consultas e atualizações usam as tabelas clínicas existentes, protegidas pelas políticas RLS por organização da migração `link_patient_workspace`. Nenhum dado clínico é exposto ao papel `anon`; a exceção continua sendo somente a RPC restrita usada pela página pública de assinatura de contratos.
