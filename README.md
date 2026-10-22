# majuu-next

Projeto Next.js com App Router e JavaScript.

## Desenvolvimento

Use Node.js 24 e execute `npm ci`. Copie `.env.example` para `.env.local` e preencha
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave
publicável do seu projeto Supabase. Nunca use uma chave secreta ou `service_role`.
Execute `npm run dev`. Para produção: `npm run build` e `npm start`.
As variáveis `NEXT_PUBLIC_*` precisam estar disponíveis durante o build; reinicie o
servidor e refaça o build após alterá-las.

## Autenticação

No Supabase, habilite o provedor de e-mail/senha em Authentication. Configure a
Site URL com o endereço da aplicação e adicione a URL completa de retorno
`<endereço-da-aplicação>/auth/callback` em Redirect URLs (também para o ambiente local).
Se a confirmação de e-mail estiver habilitada, a usuária deve abrir o link recebido
no mesmo navegador em que iniciou o cadastro para concluir o fluxo PKCE.

`/login` permite entrar e criar conta. `/` verifica a identidade no servidor com
`getUser()` e redireciona visitantes sem sessão. O middleware renova os cookies;
o topo mostra o e-mail e permite sair. Sem as variáveis configuradas, o login fica
desabilitado e a página principal permanece protegida.

## Testes de autenticação

Execute `npm run test:auth`. Os testes usam Playwright e um serviço Supabase Auth
simulado localmente, sem contas reais ou credenciais. Instale o navegador com
`npx playwright install chromium` quando Chromium não estiver disponível no sistema.
Pare o servidor de desenvolvimento antes de executar os testes ou o build, pois
esses comandos compartilham a pasta `.next`.

Os testes cobrem proteção da página, validação em português, credenciais inválidas,
cadastro pendente de confirmação, persistência após recarregar, uso do analisador,
logout, confirmação de e-mail e rejeição de cookies forjados. O envio real de e-mails e a integração
com um projeto Supabase devem ser validados após configurar as variáveis.

## Treino de entrevista e IA

O arquivo `desafio.js` define o título, subtítulo, campos, botão, aviso, prompt,
modelo e modo de teste. A tela usa essas definições. A rota `POST /api/ia` exige
uma sessão autenticada e recebe um objeto JSON com os textos por id (`vaga`,
`resposta1`, `resposta2`, `resposta3`). A resposta é texto simples, sem cache.

Com `modoTeste: true`, a API retorna uma demonstração sem acessar a OpenRouter.
Para usar IA real, configure `OPENROUTER_API_KEY` somente no servidor, altere
`modoTeste` para `false` e faça um novo build. Em ambientes com rede restrita,
permita o domínio `openrouter.ai`. O modelo é lido do arquivo e `max_tokens` é 900.

As respostas não são persistidas no Supabase nesta implementação. O aviso foi
mantido conforme solicitado, mas sua afirmação sobre armazenamento na conta
depende de uma futura implementação de persistência com acesso por usuária.

Execute `npm run test:ia` para testar a montagem do prompt e o cliente OpenRouter
com chamadas simuladas. `npm run test:auth` também testa o formulário, a API em modo
de teste e as mensagens de erro no navegador, além dos fluxos de autenticação.
