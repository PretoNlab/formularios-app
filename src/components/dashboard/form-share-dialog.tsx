"use client"

import { useState, useMemo } from "react"
import {
  Copy,
  CheckCircle2,
  Globe,
  Code2,
  Mail,
  Eye,
  PartyPopper,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Form, Question } from "@/lib/types/form"
import type { FormListItem } from "@/lib/db/queries/forms"
import { generateBrevoEmailHtml } from "@/lib/utils/brevo-email-html"

interface FormShareDialogProps {
  form: Form | (FormListItem & { questions?: Question[] })
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FormShareDialog({ form, open, onOpenChange }: FormShareDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedBrevo, setCopiedBrevo] = useState(false)

  // Options for Brevo Embed
  const [brevoMode, setBrevoMode] = useState<"card" | "question">("card")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("")
  const [includeEmailTag, setIncludeEmailTag] = useState(true)
  const [buttonText, setButtonText] = useState("Responder Formulário")
  const [iframeHeight, setIframeHeight] = useState("600")

  const shareLink = useMemo(() => {
    return typeof window !== "undefined"
      ? `${window.location.origin}/f/${form.slug}`
      : `https://formularios.ia/f/${form.slug}`
  }, [form.slug])

  // Questions suitable for interactive email survey
  const eligibleQuestions = useMemo(() => {
    const questions = form.questions || []
    const typesWithChoices = [
      "nps",
      "rating",
      "scale",
      "opinion_scale",
      "yes_no",
      "multiple_choice",
      "dropdown",
    ]
    return questions.filter((q) => typesWithChoices.includes(q.type))
  }, [form.questions])

  // Select first eligible question by default if available
  const currentQuestionId = selectedQuestionId || eligibleQuestions[0]?.id || ""

  // Generate Brevo HTML
  const brevoHtml = useMemo(() => {
    return generateBrevoEmailHtml(form, {
      shareUrl: shareLink,
      mode: brevoMode,
      questionId: currentQuestionId,
      includeEmailTag,
      buttonText,
      primaryColor: form.theme?.colors?.accent || "#3b82f6",
    })
  }, [form, shareLink, brevoMode, currentQuestionId, includeEmailTag, buttonText])

  const embedCode = `<iframe src="${shareLink}" width="100%" height="${iframeHeight}" frameborder="0" style="border:0;border-radius:8px"></iframe>`

  function handleCopyLink() {
    navigator.clipboard.writeText(shareLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function handleCopyEmbed() {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  function handleCopyBrevo() {
    navigator.clipboard.writeText(brevoHtml)
    setCopiedBrevo(true)
    setTimeout(() => setCopiedBrevo(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-muted">
        <div className="flex flex-col md:flex-row min-h-[580px] max-h-[90vh]">
          {/* Lado Esquerdo: Preview Interativo */}
          <div className="flex-1 bg-muted/20 relative hidden md:flex flex-col border-r">
            <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm">
              <Badge variant="secondary" className="gap-1.5 font-medium">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Pré-visualização ao vivo
              </Badge>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <a href={shareLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  Abrir link
                </a>
              </Button>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
              <div className="w-full max-w-lg bg-background rounded-xl border shadow-sm p-4 overflow-hidden">
                <iframe
                  src={`${shareLink}?preview=1`}
                  className="w-full h-[400px] border-0 rounded-lg"
                  title="Pré-visualização do formulário"
                />
              </div>
            </div>
          </div>

          {/* Lado Direito: Opções de Compartilhamento e Abas */}
          <div className="w-full md:w-[420px] bg-card p-6 flex flex-col shrink-0 overflow-y-auto">
            <DialogHeader className="mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">Compartilhar Formulário</DialogTitle>
                  <DialogDescription className="text-xs">
                    Escolha a melhor forma de enviar ou incorporar seu formulário.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="link" className="w-full flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="link" className="text-xs gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="embed" className="text-xs gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  Site
                </TabsTrigger>
                <TabsTrigger value="brevo" className="text-xs gap-1.5 relative">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  Brevo
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-blue-500" />
                </TabsTrigger>
              </TabsList>

              {/* ── ABA 1: LINK PÚBLICO ──────────────────────────────────── */}
              <TabsContent value="link" className="space-y-5 mt-0 flex-1">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Link Direto de Compartilhamento
                  </Label>
                  <Input readOnly value={shareLink} className="text-sm bg-muted/40 font-mono" />
                  <Button
                    className="w-full h-10 font-medium gap-2"
                    variant={copiedLink ? "secondary" : "default"}
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Link copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copiar link público
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-10 text-sm gap-2" asChild>
                    <a href={shareLink} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Abrir formulário em nova aba
                    </a>
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">💡 Dica de divulgação</p>
                  <p>Compartilhe este link no WhatsApp, redes sociais, bio do Instagram ou QR Code.</p>
                </div>
              </TabsContent>

              {/* ── ABA 2: EMBED IFRAME ──────────────────────────────────── */}
              <TabsContent value="embed" className="space-y-5 mt-0 flex-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Incorporar no seu site (iFrame)
                    </Label>
                  </div>
                  <pre className="w-full max-h-24 rounded-lg bg-muted p-3 text-[11px] font-mono text-muted-foreground leading-relaxed overflow-auto whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Altura do formulário (px)</Label>
                  <Input
                    type="number"
                    value={iframeHeight}
                    onChange={(e) => setIframeHeight(e.target.value || "600")}
                    className="h-8 text-xs w-32 font-mono"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full h-10 font-medium gap-2"
                  onClick={handleCopyEmbed}
                >
                  {copiedEmbed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copiar código HTML iFrame
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* ── ABA 3: EMAIL / BREVO ─────────────────────────────────── */}
              <TabsContent value="brevo" className="space-y-5 mt-0 flex-1">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-100 dark:border-blue-900/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      HTML Otimizado para E-mails do Brevo
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Insira uma chamada ou pesquisa interativa direto nas suas campanhas de e-mail marketing.
                  </p>
                </div>

                {/* Formato do HTML */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Formato do Bloco de E-mail</Label>
                  <Select
                    value={brevoMode}
                    onValueChange={(v: "card" | "question") => setBrevoMode(v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Cartão CTA (Título + Descrição + Botão)</SelectItem>
                      <SelectItem value="question" disabled={eligibleQuestions.length === 0}>
                        Pergunta Interativa (NPS / Avaliação / Opções)
                        {eligibleQuestions.length === 0 ? " (Sem perguntas elegíveis)" : ""}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seletor de Pergunta Interativa */}
                {brevoMode === "question" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Pergunta a incorporar no e-mail</Label>
                    <Select
                      value={currentQuestionId}
                      onValueChange={(val) => setSelectedQuestionId(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecione a pergunta" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.title || `Pergunta (${q.type})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Texto do Botão no modo Card */}
                {brevoMode === "card" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Texto do Botão de Ação</Label>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Responder Formulário"
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                )}

                {/* Switch Tag Brevo Email */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium cursor-pointer" htmlFor="tag-brevo">
                      Identificar e-mail do destinatário
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Anexa <code className="text-primary font-mono">{`?email={{ contact.EMAIL }}`}</code> ao link
                    </p>
                  </div>
                  <Switch
                    id="tag-brevo"
                    checked={includeEmailTag}
                    onCheckedChange={setIncludeEmailTag}
                  />
                </div>

                {/* Botão Copiar HTML Brevo */}
                <Button
                  className="w-full h-10 font-medium gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCopyBrevo}
                >
                  {copiedBrevo ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Código HTML para Brevo copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copiar Código HTML para o Brevo
                    </>
                  )}
                </Button>

                {/* Instruções de uso no Brevo */}
                <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    Como colar no Brevo:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>No editor do Brevo, adicione um bloco de <strong>Código HTML</strong>.</li>
                    <li>Cole o código HTML copiado acima.</li>
                    <li>Salve e envie sua campanha com o formulário embutido!</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
