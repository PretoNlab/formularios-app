# FAQ — Perguntas Frequentes

> formularios.ia · Atualizado em março de 2026

---

## Geral

**O que é o formularios.ia?**
É uma plataforma de criação de formulários conversacionais — exibe uma pergunta por vez, como uma conversa. Diferente de planilhas de campos, o formato aumenta a taxa de conclusão e a qualidade das respostas.

**Preciso instalar alguma coisa?**
Não. A plataforma roda inteiramente no navegador. Não há extensão, plugin ou app para instalar.

**Quais navegadores são suportados?**
Chrome, Firefox, Safari e Edge em suas versões recentes. O formulário público também funciona em dispositivos móveis.

**Os formulários funcionam offline?**
Sim, o formulário público tem suporte offline via Service Worker. Se o respondente perder a conexão durante o preenchimento, a resposta é salva localmente e enviada automaticamente assim que a conexão for restabelecida.

---

## Criando Formulários

**Qual é o limite de perguntas por formulário?**
Atualmente não há limite imposto. Recomendamos manter os formulários focados — formulários com mais de 15 perguntas tendem a ter taxas de conclusão menores.

**Posso duplicar um formulário existente?**
Sim. No dashboard, passe o mouse sobre o card do formulário e use o menu de opções (⋯) para duplicar.

**O auto-save é confiável?**
Sim. Toda alteração é salva automaticamente após 2 segundos. O indicador na barra superior mostra o status em tempo real ("Salvando...", "Salvo", "Não salvo"). Você nunca precisa clicar em um botão de salvar manualmente.

**Posso editar um formulário já publicado?**
Sim. As alterações são salvas e aplicadas imediatamente ao formulário público. Cuidado ao modificar perguntas que já têm respostas — isso pode afetar a consistência dos dados no analytics.

**Como altero a URL (slug) do meu formulário?**
No builder, acesse a aba **Config** e edite o campo **Slug**. A URL nova entra em vigor imediatamente. A URL antiga deixa de funcionar — se você já distribuiu o link, atualize-o.

---

## Campos e Tipos de Perguntas

**Qual a diferença entre Múltipla Escolha e Caixas de Seleção?**
- **Múltipla Escolha** — o respondente escolhe *uma* opção e avança automaticamente
- **Caixas de Seleção** — o respondente pode marcar *várias* opções e depois confirmar

**Posso adicionar uma opção "Outro" com campo de texto?**
Essa funcionalidade está no roadmap. Por ora, a alternativa é criar uma pergunta de texto curto com lógica condicional após a pergunta de múltipla escolha.

**O campo CPF valida o dígito verificador?**
Sim. A máscara e a validação do dígito verificador são aplicadas automaticamente.

**Os campos de Telefone e WhatsApp são diferentes?**
Visualmente são idênticos ao respondente. A diferença está no rótulo e na sua intenção de uso — o campo WhatsApp facilita a identificação dos contatos que são WhatsApp para fins de automação e integração.

**Posso ter mais de uma Tela de Boas-vindas ou de Agradecimento?**
Não. Cada formulário suporta no máximo uma tela de boas-vindas e uma tela de agradecimento.

**O campo de Upload de Arquivo está disponível?**
Ainda não. Está previsto para a próxima versão da plataforma.

---

## Publicação e Compartilhamento

**O que acontece quando publico um formulário?**
O formulário fica acessível publicamente pela URL `formularios.ia/f/seu-slug`. Respostas começam a ser aceitas imediatamente.

**Posso despublicar um formulário?**
Não há um botão de "despublicar". Para parar de aceitar respostas, use o **Limite de respostas** (nas configurações) ou encerre o formulário manualmente pelo dashboard.

**Como incorporo o formulário no meu site?**
No momento, o compartilhamento é via link direto. Incorporação via iframe está no roadmap.

**Posso usar um domínio personalizado para o link do formulário?**
Não ainda. Os links usam o domínio `formularios.ia/f/slug`.

---

## Respostas e Dados

**O que são respostas parciais?**
São respostas de usuários que começaram a preencher o formulário mas não chegaram até o fim. Quando a opção **"Capturar respostas parciais"** está ativada (padrão: ativada), cada pergunta respondida é salva no banco à medida que o usuário avança — mesmo que ele feche o navegador.

**As respostas parciais aparecem no analytics?**
Elas aparecem na lista de respostas marcadas como "Parcial" e são incluídas no cálculo da **taxa de conclusão** (responses completadas ÷ total de sessões iniciadas). No drop-off por pergunta, elas indicam exatamente em qual pergunta os usuários desistiram.

**Como exporto as respostas?**
Na página de Respostas do formulário, clique em **Exportar** e escolha **CSV** (abre em Excel/Sheets) ou **JSON** (para desenvolvedores e integrações).

**Os dados têm backup?**
Sim. Os dados são armazenados no Supabase (PostgreSQL), com backups automáticos gerenciados pela infraestrutura.

**Por quanto tempo as respostas ficam disponíveis?**
Indefinidamente, enquanto sua conta estiver ativa.

**O IP dos respondentes é armazenado?**
Não diretamente. O IP é coletado, anonimizado via hash SHA-256 e armazenado apenas para fins de rate limiting (prevenir spam). Não é possível reverter o hash para o IP original.

---

## Temas e Personalização

**Minhas cores personalizadas ficam salvas?**
Sim. As cores personalizadas de um formulário específico são salvas automaticamente no banco via auto-save. Se você usar **"Salvar tema atual"** com um nome, ele fica salvo no navegador para reutilização em outros formulários — não está vinculado à conta, apenas ao dispositivo/navegador atual.

**Posso aplicar o mesmo tema em vários formulários?**
Sim. Use **"Salvar tema atual"** para guardar uma combinação de cores. Depois, em outro formulário, o tema aparece em "Seus Temas Salvos" (no mesmo navegador).

**As fontes são carregadas mesmo sem internet?**
As fontes são carregadas do Google Fonts na primeira visita. Após isso, ficam em cache pelo navegador.

**Posso adicionar CSS personalizado?**
Sim. O campo **CSS personalizado** (aba Tema → Personalizar) permite injetar CSS diretamente no formulário público para ajustes avançados.

---

## Arquivo para Download (Lead Magnet)

**Como ofereço um PDF ao respondente após o envio?**
No builder → aba Config → seção Conclusão → preencha o campo **"Arquivo para download"** com a URL do arquivo (Google Drive, Dropbox, link direto). Um botão de download aparece automaticamente na tela de conclusão.

**Posso fazer upload do arquivo diretamente na plataforma?**
Sim. Clique em **Upload** ao lado do campo de URL. O arquivo é hospedado na plataforma (limite: 10MB, formatos: PDF, DOC, DOCX, ZIP, imagens).

**O arquivo de download é exibido para todos os respondentes?**
Sim — para todos que chegam à tela de conclusão (formulário completo). Não é possível no momento condicionar o download a respostas específicas.

---

## Integrações

**O Webhook dispara para respostas parciais também?**
Não. O Webhook dispara apenas quando o formulário é enviado com sucesso (resposta completa).

**Como verifico se meu Webhook está recebendo os dados?**
Use ferramentas como [webhook.site](https://webhook.site) ou [requestbin.com](https://requestbin.com) para testar antes de apontar para seu sistema real.

**O Google Sheets integration funciona em tempo real?**
Sim. Cada nova resposta completa dispara imediatamente a adição de uma linha na planilha configurada.

**Quantas integrações posso ter por formulário?**
Não há limite definido. Você pode ter múltiplos webhooks e uma integração com Google Sheets simultaneamente.

---

## Créditos

**Para que servem os créditos?**
Os créditos são usados para recursos de IA da plataforma (análise de respostas com IA, insights automáticos). A criação de formulários e coleta de respostas não consume créditos.

**Os créditos de boas-vindas expiram?**
Não. Os 50 créditos de boas-vindas não têm prazo de validade.

**Como compro mais créditos?**
Acesse **Configurações → Cobrança**. O pagamento é via PIX com QR code gerado automaticamente.

**Meus créditos são reembolsáveis?**
Créditos comprados não são reembolsáveis após o uso. Créditos não utilizados ficam disponíveis na conta indefinidamente.

---

## Privacidade e Segurança

**Os formulários ficam acessíveis publicamente por padrão?**
Somente após você clicar em **Publicar**. Formulários em rascunho não são acessíveis publicamente.

**Posso proteger um formulário com senha?**
Ainda não. Proteção por senha está no roadmap.

**Os dados dos respondentes são vendidos ou compartilhados?**
Não. Seus dados e os dados dos seus respondentes pertencem exclusivamente a você. Consulte nossa Política de Privacidade para detalhes.

**O formulario.ia é compatível com a LGPD?**
A plataforma foi desenvolvida com boas práticas de privacidade: IPs anonimizados, dados armazenados em servidores no Brasil (Supabase) e controle total do criador sobre seus dados.

---

## Problemas Comuns

**O preview do formulário no builder aparece em branco.**
Verifique se o formulário tem pelo menos uma pergunta. Se o problema persistir, recarregue a página.

**O tema personalizado não está aparecendo no formulário público.**
O auto-save pode ter levado alguns segundos. Aguarde o indicador "Salvo" na barra superior e recarregue o formulário público.

**Não estou recebendo o e-mail de notificação.**
1. Verifique se **"Notificar por e-mail"** está ativado nas configurações do formulário
2. Confira o campo de e-mail de notificação
3. Verifique a caixa de spam
4. O e-mail é enviado apenas para respostas **completas**

**O link do formulário retorna erro 404.**
O formulário pode estar em rascunho (não publicado) ou o slug foi alterado. Verifique o status e o slug nas configurações.

**A integração com Google Sheets parou de funcionar.**
O token de acesso pode ter expirado. Acesse **Integrar → Google Sheets** e reconecte sua conta Google.
