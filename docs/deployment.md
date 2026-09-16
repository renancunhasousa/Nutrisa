# Configuração e publicação

## Desenvolvimento

O Vite atende a interface e a API local no mesmo endereço, limitado a `127.0.0.1` por padrão. Use `npm run dev` na raiz. `npm --prefix app run preview` visualiza somente o build estático; não substitui o servidor de desenvolvimento/API.

Crie `app/.env` a partir de `app/.env.example` e `.env` na raiz a partir de `.env.example`. Os exemplos não contêm credenciais reais.

## Variáveis públicas — frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — chave pública; permissões de leitura dependem das políticas do banco.
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CALENDAR_ID` — se ausente, usa `primary`.

## Variáveis privadas — servidor

- `GEMINI_API_KEY`: chave do provedor.
- `GEMINI_MODELS`: lista separada por vírgulas dos modelos permitidos, na ordem de fallback.
- `AI_ACCESS_TOKEN`: código privado de acesso da clínica. **Obrigatório em produção.**

O servidor mantém compatibilidade temporária com `VITE_GEMINI_API_KEY` já existente, mas a configuração Vite exclui chaves de IA da injeção no navegador. Migre a variável para `GEMINI_API_KEY` na hospedagem. Se versões anteriores já publicaram essa chave no frontend, substitua-a no provedor e na hospedagem.

`VITE_GEMINI_MODEL` e DeepSeek não são mais usados pelo frontend. Todas as telas obtêm a lista de modelos do servidor.

## Vercel

Mantenha a raiz deste repositório como Root Directory. `vercel.json` compila `app/`, publica `app/dist` e mantém a função `api/ai.js`. Configure as variáveis acima no ambiente desejado e publique somente depois das verificações locais.

Sem `AI_ACCESS_TOKEN`, a API retorna 503 em produção. Com o token configurado, informe o mesmo código no painel de configurações de IA e clique em **Testar Conexão**. O navegador guarda esse código apenas em `sessionStorage`. O teste consulta a configuração; ele não faz uma chamada paga ao Gemini.

O código de acesso protege apenas a API de IA: não substitui autenticação de usuários da plataforma. O limite de requisições no processo é uma proteção básica; para controle global em múltiplas instâncias, configure um limite compartilhado na infraestrutura. As políticas do Supabase e as permissões do Google continuam independentes.

## Limites

- Extração dos exames: até 2,8 MB no total dos PDFs, considerando a expansão base64 e o limite do corpo HTTP.
- Importação local de anamnese: até 15 MB.
- Timeout de IA no servidor: 90 segundos para toda a cadeia de tentativas. Ajuste também a duração máxima permitida pela hospedagem.
- Configurações Google devem incluir a origem local/produção autorizada no projeto OAuth.
