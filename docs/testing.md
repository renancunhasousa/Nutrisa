# Verificação

## Automatizada

```sh
npm test
npm run lint
npm run build
```

Testes cobrem ausência de dados demo, validação de extração, zero e valores ausentes, histórico, aliases de conversas, CSV, cortesia, status da agenda, paginação, sobreposições locais, fallback da IA e proteção da API em produção. As requisições são simuladas.

## Navegador

1. Na tela de acesso, entre com uma conta Google autorizada. O retorno deve abrir a Central de Pacientes e uma atualização da página deve preservar a sessão.
2. Em Pacientes, crie e edite um cadastro; confirme que a tela mostra somente dados cadastrais, sem atalhos, métricas ou ações de vínculo com outros módulos.
3. Abra Avaliação, carregue os dados demo e confira seleção/relatório de quatro páginas. Não deve existir a ação **Salvar no paciente**.
4. Troque para Anamnese e volte: o estado de avaliação deve permanecer e a anamnese não deve receber um paciente automaticamente.
5. Confira as configurações de perfil e IA; nenhum campo pede a chave do provedor.
6. Gere um PDF sintético inválido: uma falha deve permanecer no upload, sem apresentar dados de outro paciente.
7. Confira Atendimento e filtros com uma base de teste; o CSV deve corresponder às mensagens da tabela e não deve ser filtrado pelo cadastro.
8. Na agenda, use uma conta de teste. Ajustes locais devem permanecer ao sincronizar e não alterar o Google.
9. Confira pré-visualização de impressão. Conteúdo extenso deve continuar legível, mesmo que precise de páginas adicionais.

Testes reais com IA, Google e Supabase dependem das configurações e contas do ambiente. Os testes unitários não atestam disponibilidade dos serviços externos.
