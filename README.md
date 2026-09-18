# NutrIsa

Plataforma React para avaliação corporal, anamnese, indicadores de atendimento e leitura da agenda.

## Executar

Requisito: Node.js 22.12+ ou 24 LTS e npm.

```sh
npm --prefix app ci
npm run dev
```

Abra o endereço exibido pelo Vite. O mesmo processo atende a interface e `/api/ai`.
Os arquivos `app/.env` existentes continuam sendo lidos. Veja os exemplos de ambiente antes de configurar uma instalação nova.

```sh
npm test
npm run lint
npm run build
```

Os testes usam dados sintéticos e serviços simulados; não enviam documentos nem chamam provedores pagos.

## Onde editar

| Alteração | Diretório |
|---|---|
| Menu e estrutura das telas | `app/src/layout` |
| Upload, seleção e validação dos exames | `app/src/features/avaliacao` |
| Páginas do laudo | `app/src/features/avaliacao/report` |
| Editor e geração de anamnese | `app/src/features/anamnese` |
| Conversas, filtros, gráficos e CSV | `app/src/features/atendimento` |
| Calendário e ajustes locais | `app/src/features/agenda` |
| Perfil e configuração da IA | `app/src/features/configuracoes` |
| Alertas do consultório | `app/src/features/notificacoes` |
| Contratos e termos de adesão | `app/src/features/contratos` |
| Comunicação com a IA no servidor | `server/ai` e `api/ai.js` |
| Estilos globais e impressão | `app/src/styles` |

## Documentação

- [Arquitetura](docs/architecture.md)
- [Configuração e publicação](docs/deployment.md)
- [Contratos de dados e persistência](docs/data-contracts.md)
- [Roteiro de verificação](docs/testing.md)
- [Roadmap Estratégico](docs/roadmap.md) e [Checklist de Tarefas](docs/tasks.md): visão de produto, matriz de impacto e tarefas de implementação.

Os PDFs em `model/` são referências existentes e não são importados pela aplicação. O protótipo antigo foi preservado em `docs/reference/anamnese-prototype.jsx.txt` e não é executável nesta plataforma.

As ferramentas de n8n são independentes da aplicação web e não são necessárias para os comandos acima.
