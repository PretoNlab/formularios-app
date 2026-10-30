# Perguntas Frequentes (FAQ)

> formularios.ia.br · Atualizado em março de 2026

---

## Geral

**O que é o formularios.ia.br?**  
É uma plataforma de criação de formulários no estilo conversacional, exibindo uma pergunta por vez. Em vez de assustar o visitante com dezenas de campos em uma tela só, o formato conduz a pessoa passo a passo, o que aumenta a taxa de conclusão e a qualidade das respostas.

**Preciso instalar alguma coisa?**  
Não. O serviço roda inteiramente no navegador. Não há necessidade de instalar plugins, extensões ou aplicativos.

**Quais navegadores são suportados?**  
Chrome, Firefox, Safari e Edge em versões modernas. Os formulários são totalmente responsivos e funcionam com fluidez em celulares e tablets.

**Os formulários funcionam offline?**  
Sim. O formulário público possui suporte offline com Service Worker. Se o respondente perder a conexão durante o preenchimento, a resposta fica salva no dispositivo e é enviada automaticamente assim que a internet voltar.

---

## Criando Formulários

**Qual é o limite de perguntas por formulário?**  
Não há limite no plano. No entanto, por boas práticas de conversão (CRO), recomendamos formulários objetivos: fluxos com mais de 12 a 15 perguntas costumam ter maior taxa de abandono.

**Posso duplicar um formulário existente?**  
Sim. No painel, passe o mouse sobre o card do formulário e selecione a opção de duplicar no menu (⋯).

**O auto-save é confiável?**  
Sim. Toda alteração no editor é gravada automaticamente após 2 segundos de pausa. O indicador no topo mostra o status em tempo real ("Salvando...", "Salvo", "Não salvo"). Não é necessário salvar manualmente.

**Posso editar um formulário já publicado?**  
Sim. As alterações são sincronizadas imediatamente com o link público. Se o formulário já tiver respostas coletadas, recomendamos cautela ao excluir perguntas para manter a consistência dos relatórios.

**Como altero a URL (slug) do meu formulário?**  
No editor, acesse a aba **Config** e edite o campo **Slug**. A nova URL entra em vigor na hora. A URL anterior deixa de funcionar, portanto atualize os locais onde o link foi divulgado.

---

## Campos e Tipos de Perguntas

**Qual a diferença entre Múltipla Escolha e Caixas de Seleção?**  
- **Múltipla Escolha:** o respondente seleciona apenas uma opção e o formulário avança automaticamente.  
- **Caixas de Seleção:** o respondente pode marcar múltiplas opções e clicar para continuar.

**Posso adicionar uma opção "Outro" com campo de texto?**  
Essa opção direta está no roadmap. Hoje, você pode criar uma pergunta de texto curto logo após a múltipla escolha e exibi-la usando lógica condicional caso a opção "Outro" seja marcada.

**O campo CPF valida o dígito verificador?**  
Sim. A máscara de digitação e a validação do algoritmo dos dígitos verificadores acontecem automaticamente no navegador.

**Os campos de Telefone e WhatsApp são diferentes?**  
Visualmente ambos aplicam máscara de telefone brasileiro. A diferença é semântica: o campo WhatsApp identifica o contato prioritário para automações, integrações e mensagens diretas.

**O campo de Upload de Arquivo está disponível?**  
Sim. Você pode adicionar campos de upload para receber documentos, imagens ou PDFs dos respondentes, além de disponibilizar arquivos para download (lead magnets) na tela de encerramento.

**Posso ter mais de uma Tela de Boas-vindas ou de Agradecimento?**  
Cada formulário suporta uma tela inicial de boas-vindas e uma tela final de encerramento.

---

## Publicação e Compartilhamento

**O que acontece quando publico um formulário?**  
O formulário ganha um link público acessível em `https://formularios.ia.br/f/seu-slug` e passa a registrar respostas na hora.

**Posso despublicar ou pausar um formulário?**  
Sim. Você pode encerrar o formulário a qualquer momento pelo menu de opções do dashboard ou definir um limite máximo de respostas na aba de configurações.

**Como incorporo o formulário no meu site?**  
No editor ou no painel, clique em **Compartilhar** e selecione a aba de **Embed (iFrame)**. Copie o código HTML gerado e cole na sua página, blog ou landing page.

**Posso usar um domínio personalizado para o formulário?**  
Essa funcionalidade está em desenvolvimento. Atualmente os links utilizam o domínio oficial `formularios.ia.br/f/slug`.

---

## Respostas e Dados

**O que são respostas parciais?**  
São dados de visitantes que começaram a responder o formulário, mas desistiram antes do final. Com a opção ativada (padrão do sistema), cada etapa respondida é armazenada à medida que a pessoa avança.

**As respostas parciais aparecem no analytics?**  
Sim. Elas são listadas com a etiqueta "Parcial" e entram no cálculo da taxa de conclusão. No gráfico de abandono por pergunta, você consegue ver exatamente em qual ponto as pessoas deixaram o formulário.

**Como exporto as respostas?**  
Na página de Respostas do formulário, clique no botão **Exportar** e escolha o formato desejado: **CSV** (compatível com Excel e Google Sheets) ou **JSON** (para desenvolvedores e automações).

**Os dados contam com backup?**  
Sim. As respostas ficam salvas no Supabase (PostgreSQL), com rotinas automatizadas de backup e redundância.

**Por quanto tempo as respostas ficam disponíveis?**  
Indefinidamente, enquanto sua conta permanecer ativa.

**O endereço IP dos respondentes é armazenado?**  
Não em texto puro. Por conformidade com a LGPD, o endereço IP passa por uma função hash criptográfica (SHA-256 com salt seguro) e serve exclusivamente para proteção contra spam (rate limiting). O IP original não pode ser recuperado.

---

## Temas e Personalização

**Minhas cores personalizadas ficam salvas?**  
Sim. As cores do formulário são armazenadas no banco junto com as configurações dele. Se você clicar em "Salvar tema atual", a combinação também fica disponível no seu navegador para uso em outros formulários.

**Posso aplicar CSS personalizado?**  
Sim. Na aba Tema → Personalizar, você pode inserir regras CSS customizadas para ajustar fontes, espaçamentos e detalhes finos do visual público.

---

## Arquivo para Download (Lead Magnet)

**Como entrego um material (PDF/E-book) após o envio?**  
No editor, acesse Configurações → Conclusão. Preencha o campo **Arquivo para download** com o link direto ou faça o upload do arquivo pela própria plataforma. Um botão de download aparecerá na tela final assim que o participante concluir o formulário.

---

## Integrações

**O Webhook envia dados de respostas parciais?**  
Não. O Webhook dispara apenas quando a resposta é enviada por completo.

**Como testo meu Webhook antes de colocar em produção?**  
Recomendamos usar serviços de teste como [webhook.site](https://webhook.site) para inspecionar a carga útil dos dados antes de apontar para a sua URL definitiva.

**A integração com Google Sheets funciona em tempo real?**  
Sim. Cada formulário preenchido adiciona uma nova linha automaticamente na planilha vinculada.

---

## Créditos e Inteligência Artificial

**Para que servem os créditos?**  
Os créditos são usados para recursos de IA: geração de formulários inteligentes pelo estúdio, refinamento de perguntas e resumos semânticos de respostas abertas. Criar formulários manualmente e coletar respostas ilimitadas não consome créditos.

**Os créditos expiram?**  
Não. Tanto os créditos garantidos de cadastro quanto os créditos adicionais conquistados em missões permanecem na sua conta sem data de expiração.

**Como recarregar créditos?**  
Acesse o menu de créditos no topo ou vá em Configurações. O pagamento é processado instantaneamente via PIX.

---

## Privacidade e Segurança (LGPD)

**Os formulários são públicos por padrão?**  
Não. Enquanto estiverem com o status de rascunho, apenas você consegue visualizá-los. Eles só ficam acessíveis a terceiros após você clicar em **Publicar**.

**Os dados dos respondentes são vendidos?**  
Não. Seus dados e as respostas dos seus clientes pertencem unicamente a você. Não comercializamos dados de usuários em hipótese alguma.
