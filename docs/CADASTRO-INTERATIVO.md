# Cadastro antes da conta

A rota /signup tem quatro etapas: objetivo, contexto, estilo e conta.
O visitante vê e percorre uma prévia baseada em templates locais; não há chamadas de IA.

- Contexto, pergunta adicional, título e estilo são usados pelo mesmo gerador no navegador e no servidor.
- Começar em branco leva diretamente à conta.
- Apenas configuração do formulário é guardada no localStorage, com validade de sete dias; nome, e-mail e senha não são armazenados ali.
- Antes da autenticação, um cookie HttpOnly/SameSite=Lax guarda o rascunho validado com Zod.
- No cadastro por e-mail, a configuração também é enviada nos metadados do Supabase Auth. Isso permite confirmar a conta em outro navegador.
- Após autenticação, /onboarding/complete chama uma Server Action para salvar formulário e perguntas em uma única transação.
- O UUID é derivado do usuário autenticado e do rascunho. Repetições não criam outro formulário nem sobrescrevem edições.
- Nada é publicado automaticamente. O usuário segue para /builder/[id].
- Erros de persistência oferecem nova tentativa e acesso ao painel.

## Google

O Google estava desativado na versão local anterior. Para mostrar o botão, configure NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true e habilite o provider e callbacks no Supabase/Google.
O rascunho do Google depende do cookie no navegador em que o fluxo começou.
A autenticação por e-mail mantém o comportamento existente do projeto (incluindo acesso imediato quando configurado).

## Verificação

Testes novos cobrem a montagem dos templates, limites e validade do rascunho, as etapas antes do cadastro e a recuperação por metadados/cookie com serviços simulados.
A criação de uma conta real e envio de e-mail não fazem parte desses testes.
A política CSP permite unsafe-eval somente em development para o runtime de hot reload do Next.js; produção mantém a regra anterior.

## Recuperação e créditos

A página de conclusão verifica apenas a sessão Auth. A action provisiona usuário/workspace e persiste o formulário dentro do fluxo de nova tentativa. Falhas no banco mantêm o rascunho recuperável; sessão expirada oferece login com retorno à conclusão. O cadastro não tenta provisionar o mesmo usuário antecipadamente.

Os 50 primeiros usuários recebem 50 créditos garantidos e podem ganhar mais 20 no onboarding, totalizando 70. O onboarding representa quatro recompensas de 5 créditos: objetivo, contexto, estilo e criação da conta. A interface mostra o bônus 0 → 5 → 10 → 15 e anima os últimos +5 após a conta ser provisionada. No banco, a oferta de 50 usuários é serializada com um advisory lock; o benefício garantido e o bônus de onboarding são registrados como transações separadas. Depois da oferta, novos usuários recebem 20 créditos padrão + 20 do onboarding.

Para o teste integrado com dados reais, configure o Session pooler quando a rede não suporta IPv6. O sucesso dos testes com serviços simulados não confirma a disponibilidade do banco.

O lint usa ESLint diretamente (Next 16 não oferece `next lint`). Diagnósticos de adoção do React Compiler são avisos nesta base; regras de correção permanecem ativas. O build pode ser validado com `npm run build`.
