# Planos e Valores de Contrato da Clínica

A emissão de contratos (`ContratosPage`) permite cadastrar e gerenciar dinamicamente os planos de atendimento, seus valores sugeridos e formas de pagamento padrão no escopo de cada clínica/organização (`organization_id`).

## Estrutura da Tabela (`public.contract_plans`)

Os planos são persistidos na tabela `public.contract_plans` no Supabase:

- `id`: identificador único do plano (UUID gerado automaticamente);
- `organization_id`: chave da clínica para isolamento multi-tenant seguro;
- `name`: nome comercial do plano (ex: "Essence", "Premium", "Legacy", "Consultoria Online");
- `icon`: ícone ou emoji representativo do plano (ex: "🌿", "⭐", "👑", "💻");
- `default_price`: valor monetário padrão sugerido (ex: `"1.500,00"`);
- `default_payment_method`: forma de pagamento padrão (ex: `"Pix"`, `"Cartão de Crédito"`, `"Boleto"`);
- `payment_methods`: array JSON (`jsonb`) com múltiplas formas cadastradas para o plano, contendo `{ id, name, feePercentage, price }`;
- `description`: descrição opcional do plano ou inclusões;
- `consultas_count`: quantidade estimada de consultas inclusas no plano;
- `is_active`: booleano indicando se o plano está visível para seleção;
- `display_order`: ordem numérica para ordenação visual na lista suspensa;
- `created_by`: UUID do usuário que cadastrou o plano;
- `created_at` e `updated_at`: timestamps de auditoria com trigger automática.

## Segurança e RLS

- Row Level Security (RLS) habilitado.
- Políticas de acesso autenticado:
  - Usuários autenticados pertencentes à mesma `organization_id` podem visualizar (`SELECT`), criar (`INSERT`), editar (`UPDATE`) e excluir (`DELETE`) planos de sua própria clínica.
  - O papel `anon` não possui permissões na tabela.

## Comportamento na Interface

1. **Acesso ao Gerenciador**:
   - Botão **Gerenciar Planos** diretamente ao lado do label "Plano Escolhido" na Etapa 1 (Dados Base) de Contratos, padronizado com fonte verde (`text-emerald-600 font-bold`) e fundo transparente, em harmonia com o botão **Adicionar Consulta**.
   - Opção no rodapé da lista suspensa de planos ("Configurar planos e valores...").
2. **Modal de Configuração (`ContractPlansModal.jsx`)**:
   - Renderizado via `createPortal(..., document.body)` com classes canônicas `.app-modal-overlay` (`z-index: 9999`) e `.app-modal-panel`, garantindo que o backdrop cubra toda a viewport.
   - Botão de fechar sem contorno/borda por padrão (`text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl`).
   - Seção dinâmica de **Formas de Pagamento & Taxas** com cálculo automático de taxa e valor.
   - Listagem dos planos cadastrados com condições em visual limpo: sem fundo cinza, fonte normal e valor destacado em verde esmeralda (`text-emerald-600 font-semibold`).
3. **Seleção de Planos e Formas de Pagamento na Etapa 1 (Dados Base)**:
   - A lista suspensa de planos exibe o ícone e o nome do plano selecionado.
   - Ao selecionar o plano, suas condições cadastradas (ex: Pix à vista, Cartão 3x, Cartão 6x, etc.) ficam disponíveis diretamente na lista suspensa integrada ao campo "Forma de Pagamento", sem sobrecarregar a interface com botões soltos.
   - Ao selecionar uma condição na lista suspensa, o campo "Forma de Pagamento" é preenchido e o "Valor Total (R$)" puxa automaticamente o valor cadastrado para aquela modalidade.
   - O campo "Valor Total (R$)" permanece livremente editável no momento da emissão, permitindo descontos ou acréscimos pontuais no contrato sem alterar o cadastro salvo no plano.

## Variáveis Dinâmicas da Contratada & Multi-Clínicas

Os contratos suportam substituição automática de variáveis tanto do paciente/plano quanto da clínica/profissional:

| Variável | Descrição | Exemplo |
|---|---|---|
| `{{ nutricionista }}` / `{{ nutritionist }}` | Nome da nutricionista responsável | `Dra. Isabela Muñoz Mendonça` ou `Dra. Camila Santos` |
| `{{ crn }}` | Registro profissional no CRN | `CRN-3 / 58.492` |
| `{{ clinica }}` / `{{ clinic }}` | Nome do consultório | `Clínica Integrada de Saúde` |
| `{{ endereco }}` / `{{ address }}` | Endereço do consultório | `Rua Barão de Jaguara, 655` |
| `{{ telefone }}` / `{{ phone }}` | Telefone comercial | `(19) 99876-5432` |

- **Isolamento de Marca**: Se for a organização da Dra. Isabela, os dados da Dra. Isabela são aplicados. Se for outro consultório, o contrato utiliza exclusivamente os dados cadastrados no perfil daquela clínica (`clinic_profiles`). Caso os dados da nova clínica ainda não estejam preenchidos, são exibidos traços neutros (`___________________________`), nunca vazando informações de terceiros.
- **Logotipo e Assinatura Digital**: O topo do contrato impresso/PDF renderiza o logotipo da clínica ativa (`currentNutritionist.logoUrl`). O rodapé renderiza a assinatura digital enviada pela nutricionista (`signatureUrl`) ou a linha para assinatura manual.

## Código Relacionado

- Migration: `supabase/migrations/20261017130000_create_contract_plans.sql` e `supabase/migrations/20261017133000_add_payment_methods_to_plans_and_packages.sql`
- Variáveis & Badges: `app/src/features/contratos/domain/contractVariables.js`
- Serviço: `app/src/features/contratos/services/contractPlansService.js`
- Modal: `app/src/features/contratos/components/ContractPlansModal.jsx`
- Hook: `app/src/features/contratos/hooks/useContratos.js`
- Página: `app/src/features/contratos/ContratosPage.jsx`
- Impressão: `app/src/features/contratos/components/ContratoPrintLayout.jsx`
