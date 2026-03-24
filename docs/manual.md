# Manual de Utilização — formularios.ia

> Versão atual · Março 2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Primeiros Passos](#2-primeiros-passos)
3. [Criando um Formulário](#3-criando-um-formulário)
4. [Tipos de Campos](#4-tipos-de-campos)
5. [Configurações do Formulário](#5-configurações-do-formulário)
6. [Temas e Personalização](#6-temas-e-personalização)
7. [Lógica Condicional](#7-lógica-condicional)
8. [Publicando e Compartilhando](#8-publicando-e-compartilhando)
9. [Respostas e Analytics](#9-respostas-e-analytics)
10. [Integrações](#10-integrações)
11. [Créditos e Planos](#11-créditos-e-planos)
12. [Templates](#12-templates)

---

## 1. Visão Geral

formularios.ia é um criador de formulários conversacionais — uma pergunta por vez, como uma conversa. É voltado para o mercado brasileiro e inclui campos nativos de CPF, CNPJ e WhatsApp, suporte a temas visuais personalizados e analytics com IA.

**Diferenciais principais:**
- Formulários no estilo conversacional (uma pergunta por vez)
- Campos brasileiros nativos (CPF, CNPJ, WhatsApp)
- Analytics com drop-off por pergunta, NPS automático e heatmap por hora
- Captura de respostas parciais (dados de quem não terminou)
- Arquivo para download na tela de conclusão (lead magnet)
- Integrações com Google Sheets, Webhooks e automações

---

## 2. Primeiros Passos

### Criar conta

1. Acesse a plataforma e clique em **Criar conta**
2. Escolha entre **Google** (acesso imediato) ou **e-mail + senha**
3. Ao confirmar o e-mail, você recebe automaticamente **50 créditos de boas-vindas**

### Painel principal (Dashboard)

Ao entrar, você verá:
- **Seus formulários** — lista de todos os forms criados
- **Checklist de primeiros passos** — guia visual de 4 etapas (criar → 3 perguntas → publicar → 1ª resposta)
- **Botão "Criar formulário"** — inicia um form em branco ou a partir de um template

### Tour do builder

Na primeira vez que você abrir o editor de um formulário, um **tour guiado de 3 passos** aparece automaticamente mostrando as três áreas principais: painel de campos, canvas central e barra de publicação.

---

## 3. Criando um Formulário

### Do zero

Clique em **"Criar formulário"** no dashboard. Um formulário em branco é criado com um slug único e abre direto no editor.

### A partir de um template

Clique em **"Ver templates"** ou acesse a aba **Templates**. Há 16 templates prontos organizados por categoria. Ao selecionar um, um formulário completo é criado com perguntas pré-configuradas.

### Editor (Builder)

O editor tem três áreas:

| Área | Função |
|------|--------|
| **Painel esquerdo** | Adicionar campos, configurar tema, ajustes gerais e integrações |
| **Canvas central** | Visualizar e editar as perguntas na ordem |
| **Painel direito** | Propriedades da pergunta selecionada (aparece ao clicar em uma pergunta) |

**Barra superior** (flutuante sobre o canvas):
- **Editor** / **Lógica** / **Preview** — alternação de modo
- Indicador de status de salvamento (auto-save a cada 2 segundos)
- Botão **Publicar** (formulários em rascunho) ou **Compartilhar** (formulários publicados)

### Auto-save

Toda alteração é salva automaticamente com 2 segundos de debounce. O status aparece na barra superior: "Salvando...", "Salvo" ou "Não salvo".

### Reordenar perguntas

Segure o ícone de arrastar (⠿) à esquerda de qualquer pergunta no canvas e arraste para a posição desejada.

---

## 4. Tipos de Campos

### Campos de texto

| Tipo | Descrição |
|------|-----------|
| **Texto curto** | Uma linha, ideal para nome, cidade, cargo |
| **Texto longo** | Área de texto expandida para respostas abertas |
| **E-mail** | Validação automática de formato de e-mail |
| **Número** | Aceita apenas valores numéricos |
| **URL** | Validação de endereço web |

### Campos brasileiros

| Tipo | Descrição |
|------|-----------|
| **Telefone** | Número com DDD |
| **WhatsApp** | Número com DDD, campo nomeado para WhatsApp |
| **CPF** | Validação e máscara automática de CPF |
| **CNPJ** | Validação e máscara automática de CNPJ |
| **Data** | Seletor de data |

### Campos de seleção

| Tipo | Descrição |
|------|-----------|
| **Múltipla escolha** | O respondente escolhe **uma** opção de uma lista |
| **Caixas de seleção** | O respondente pode marcar **várias** opções |
| **Dropdown** | Lista suspensa — ideal para muitas opções |
| **Sim / Não** | Botões grandes de Sim e Não |

### Campos de avaliação

| Tipo | Descrição |
|------|-----------|
| **Avaliação** | Estrelas, corações, polegares ou números (configurável) |
| **Escala** | Barra deslizante com rótulos nos extremos |
| **NPS** | Escala 0–10 com cálculo automático de NPS |

### Campos avançados

| Tipo | Descrição |
|------|-----------|
| **Upload de arquivo** | Permite ao respondente enviar um arquivo (PDF, imagem, vídeo, etc.). Configurável com tipos permitidos e tamanho máximo. |
| **Download** | Exibe um botão para o respondente baixar um arquivo. Configurável com URL, texto, tamanho e alinhamento do botão. |
| **Assinatura** | Área de assinatura digital a dedo ou mouse. Salva como imagem base64. |

### Campos de layout

Campos de layout não coletam dados — estruturam o fluxo do formulário.

| Tipo | Descrição |
|------|-----------|
| **Tela de boas-vindas** | Primeira tela com título, descrição e botão de início. Máximo 1 por formulário. |
| **Declaração** | Texto informativo no meio do formulário (sem input) |
| **Tela de agradecimento** | Última tela após o envio. Máximo 1 por formulário. |

### Configurando uma pergunta

Clique em qualquer pergunta no canvas para selecioná-la. O **painel direito** mostra:
- **Título** da pergunta
- **Descrição** (opcional, texto de apoio)
- **Obrigatório** — toggle para tornar a pergunta obrigatória
- **Opções** (para múltipla escolha, checkbox, dropdown) — adicionar, editar e reordenar opções
- Configurações específicas do tipo (estilo de avaliação, rótulos da escala, etc.)

---

## 5. Configurações do Formulário

Acesse pela aba **Config** no painel esquerdo.

### Identificação

| Configuração | Descrição |
|---|---|
| **Título** | Nome interno do formulário (aparece no dashboard) |
| **Descrição** | Texto de apoio opcional |
| **Slug (URL)** | Parte da URL pública: `formularios.ia/f/seu-slug`. Editável, deve ser único. |

### Aparência no formulário

| Configuração | Padrão | Descrição |
|---|---|---|
| **Barra de progresso** | Ativado | Mostra o avanço ao longo das perguntas |
| **Numeração das perguntas** | Ativado | Exibe "1 →", "2 →" antes do título |

### Respostas

| Configuração | Padrão | Descrição |
|---|---|---|
| **Capturar respostas parciais** | Ativado | Salva dados de quem não terminou o form |
| **Limite de respostas** | Sem limite | Fecha automaticamente após X respostas |

### Conclusão

| Configuração | Descrição |
|---|---|
| **Mensagem de encerramento** | Texto exibido quando o form está fechado |
| **Redirecionar para (URL)** | Redireciona o respondente para uma URL após o envio |
| **Arquivo para download** | URL de um arquivo disponibilizado na tela de conclusão (ex: e-book, PDF) |
| **Texto do botão de download** | Rótulo do botão (padrão: "Baixar material") |

**Upload de arquivo:** clique em **Upload** ao lado do campo de URL para enviar um arquivo diretamente para a plataforma (limite: 50MB, formatos: PDF, DOC, DOCX, ZIP, imagens).

### Notificações

| Configuração | Descrição |
|---|---|
| **Notificar por e-mail** | Envia um e-mail ao receber cada nova resposta |
| **E-mail de notificação** | Endereço que receberá as notificações |

---

## 6. Temas e Personalização

Acesse pela aba **Tema** no painel esquerdo.

### Temas prontos

8 temas pré-configurados com paletas de cor e fontes combinadas:

| Tema | Estilo |
|------|--------|
| **Midnight** | Escuro, elegante |
| **Ocean** | Azul oceano, clássico |
| **Sunset** | Tons quentes, vibrante |
| **Forest** | Verde natural, orgânico |
| **Cream** | Claro e minimalista |
| **Lavender** | Roxo suave, moderno |
| **Minimal** | Branco e preto puro |
| **Neon** | Dark com destaque neon |

### Personalização de cores

Vá para a aba **Personalizar** dentro da seção Aparência. Edite individualmente:
- Fundo geral
- Cartão / área do form
- Destaque (botões e elementos de ação)
- Texto principal
- Texto secundário
- Fundo dos inputs

### Fontes

Escolha fontes separadas para **títulos** e **corpo** de texto. Mais de 28 fontes disponíveis via Google Fonts.

### Borda arredondada

Controle o `border-radius` dos elementos (0px = quadrado, até 24px).

### Logo

Faça upload do logo da sua empresa (máx. 1MB, PNG/JPG). Posicione à **esquerda**, **centro** ou **direita** do formulário.

### Salvar tema personalizado

Após personalizar, clique em **"Salvar tema atual"**, dê um nome e clique em **Salvar**. O tema aparecerá em "Seus Temas Salvos" para reutilização em outros formulários.

> Temas salvos ficam armazenados no navegador atual. Para usá-los em outro dispositivo, aplique o tema e o auto-save sincronizará as cores com o formulário.

---

## 7. Lógica Condicional

Clique em **Lógica** na barra superior do editor para entrar no modo de lógica.

A lógica condicional permite **pular perguntas** com base nas respostas anteriores.

### Como configurar uma regra

1. Selecione a pergunta de **destino** (a que será exibida ou pulada)
2. No painel direito, clique em **"Adicionar regra"**
3. Defina a condição: _se a pergunta X_ [operador] _valor_
4. Defina a ação: **Ir para** [pergunta destino] ou **Pular para o fim**

### Operadores disponíveis

- **é igual a** / **não é igual a**
- **contém** / **não contém**
- **é maior que** / **é menor que**
- **está preenchido** / **está vazio**

### Boas práticas

- Use lógica para segmentar fluxos (ex: B2B vs B2C)
- Evite ciclos — uma pergunta não pode redirecionar para uma pergunta anterior
- Teste o fluxo com o modo **Preview** antes de publicar

---

## 8. Publicando e Compartilhando

### Status do formulário

| Status | Descrição |
|--------|-----------|
| **Rascunho** | Editável, não aceita respostas públicas |
| **Publicado** | Aceita respostas, link ativo |
| **Encerrado** | Link ativo mas não aceita novas respostas |

### Publicar

Clique em **Publicar** na barra superior. O formulário muda de status imediatamente. A ação é irreversível para esse link (mas você pode encerrar o form depois).

### Compartilhar

Após publicar, clique em **Compartilhar** para ver:
- **Link direto** — `formularios.ia/f/seu-slug`
- **Preview** do formulário no painel de compartilhamento

O link pode ser distribuído por WhatsApp, e-mail, redes sociais ou incorporado em sites.

### Encerrar o formulário

Nas configurações do form, você pode definir um **limite de respostas** ou usar a opção de encerramento manual no dashboard.

---

## 9. Respostas e Analytics

Acesse clicando no ícone de gráfico (📊) no builder ou indo para **Respostas** no dashboard.

### Aba Respostas

- Lista todas as respostas recebidas
- Filtros: **Completas** / **Parciais** / **Todas**
- Colunas: data, tempo de resposta, dispositivo, fonte
- Exportar como **CSV** ou **JSON**

### Resposta individual

Clique em qualquer resposta para ver todas as respostas de cada pergunta em detalhe.

### Aba Analytics

**Visão geral:**
- Total de visualizações e respostas
- Taxa de conclusão (%)
- Tempo médio de resposta

**Gráficos disponíveis:**
- Respostas por dia (últimos 30 dias)
- Heatmap por hora e dia da semana (fuso de São Paulo)
- Taxa de drop-off por pergunta — indica onde os respondentes desistem

**Por pergunta:**
- Múltipla escolha / Checkbox / Dropdown → distribuição de opções com porcentagem
- NPS → score calculado automaticamente + breakdown de promotores, neutros e detratores
- Avaliação / Escala → média, mínimo, máximo e distribuição
- Texto aberto → últimas 5 respostas de amostra

**Audiência:**
- Origem das visitas (UTM source, referrer, direto)
- Dispositivo (desktop, mobile, tablet)
- Taxa de conclusão por fonte

### Respostas parciais

Quando **"Capturar respostas parciais"** está ativado, cada pergunta respondida é salva individualmente à medida que o usuário avança. Respostas de quem não terminou o form aparecem marcadas como **Parcial** na lista e no export.

---

## 10. Integrações

Acesse pela aba **Integrar** no painel esquerdo do builder.

### Webhook

Envia um HTTP POST para a URL configurada a cada nova resposta.

**Configuração:**
1. Cole a URL de destino
2. Opcionalmente configure um **segredo** para verificação HMAC-SHA256
3. Cada resposta dispara um POST com o payload completo em JSON

**Payload de exemplo:**
```json
{
  "formId": "uuid",
  "formTitle": "Nome do form",
  "responseId": "uuid",
  "submittedAt": "2026-03-19T10:00:00Z",
  "answers": {
    "question-id": "valor"
  }
}
```

### Google Sheets

Adiciona uma linha para cada nova resposta em uma planilha do Google.

**Configuração:**
1. Clique em **Conectar com Google**
2. Autorize o acesso à sua conta Google
3. Selecione a planilha e a aba de destino
4. Cada resposta vira uma linha com timestamp e todos os campos

### Outras integrações

- **n8n** e **Zapier** — conecte via Webhook configurando a URL do gatilho gerada nessas ferramentas
- **Slack** e **WhatsApp** — via Webhook apontado para um bot ou gateway

---

## 11. Créditos e Planos

### Créditos de boas-vindas

Todo usuário recebe **50 créditos** ao criar a conta, para experimentar os recursos de IA da plataforma.

### Pacotes de créditos

| Pacote | Créditos | Valor |
|--------|----------|-------|
| Starter | 300 | R$ 19,00 |
| Pro | 1.000 | R$ 49,00 |
| Business | 2.500 | R$ 99,00 |
| Enterprise | 7.000 | R$ 199,00 |

Pagamento via **PIX** (QR code gerado automaticamente).

### Como verificar seu saldo

Acesse **Configurações → Cobrança** ou clique no seu avatar no canto superior direito.

---

## 12. Templates

Acesse pelo menu **Templates** no painel principal.

### Categorias disponíveis

| Categoria | Templates |
|-----------|-----------|
| **Pesquisa** | NPS, Pesquisa de Mercado |
| **Feedback** | CSAT, Feedback de Produto, Satisfação com Suporte |
| **Cadastro** | Formulário de Contato, Inscrição em Evento |
| **RH & Pessoas** | Candidatura de Emprego, Clima Organizacional |
| **Vendas** | Solicitação de Orçamento, Triagem de Oficina |
| **Saúde** | Triagem Dental, Triagem Médica |
| **Política 2026** | Intenção de Voto, Prioridades do Eleitor, Voluntários de Campanha, Avaliação de Candidato |

### Criar a partir de um template

1. Clique em **Ver templates** no dashboard ou acesse o menu Templates
2. Selecione o template desejado
3. Um formulário completo é criado com todas as perguntas configuradas
4. Você pode editar, remover e adicionar perguntas normalmente
