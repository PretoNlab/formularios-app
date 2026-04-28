"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  Search, BarChart3, Users, Zap, Link2,
  Trash2, Globe, FileText, Clock, ChevronRight,
  PlusCircle, Sparkles, MessageCircle, Check, X, Rocket,
  Copy, Eye, PauseCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { PRESET_THEMES } from "@/config/themes"
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES, type FormTemplate } from "@/config/templates"
import { CreateFormButton } from "./create-form-button"
import { ImportFormDialog } from "./import-form-dialog"
import { deleteFormAction, publishFormAction, createFormFromTemplateAction, duplicateFormAction, closeFormAction } from "@/app/actions/forms"
import type { FormListItem } from "@/lib/db/queries/forms"

// ─── Welcome Modal ────────────────────────────────────────────────────────────

function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Show if there is a 'welcome' param (reliable across accounts in same browser)
    // OR if it's the very first time on this browser
    if (searchParams.get("welcome") === "true" || !localStorage.getItem("formularios_onboarded_v2")) {
      setOpen(true)
    }
  }, [searchParams])

  function dismiss() {
    localStorage.setItem("formularios_onboarded_v2", "1")
    setOpen(false)
    
    // Clean up the URL if the parameter is present
    if (searchParams.get("welcome") === "true") {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("welcome")
      const search = newSearchParams.toString()
      const url = search ? `${pathname}?${search}` : pathname
      router.replace(url, { scroll: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            🎉
          </div>
          <DialogTitle className="text-center text-2xl font-bold font-heading">
            Bem-vindo ao formularios!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Crie formulários inteligentes e colete dados com muito mais qualidade.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {[
            { icon: MessageCircle, label: "Formulários conversacionais", desc: "Experiência fluida como um chat, sem cansar o respondente" },
            { icon: Sparkles, label: "Analytics com IA", desc: "Insights automáticos sobre suas respostas abertas" },
            { icon: BarChart3, label: "Métricas em tempo real", desc: "Acompanhe taxa de conclusão, NPS e abandono por pergunta" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div onClick={dismiss}>
            <CreateFormButton variant="hero" />
          </div>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={dismiss}>
            Explorar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Onboarding Checklist ────────────────────────────────────────────────────

const CHECKLIST_KEY = "formularios_checklist_v1"

function OnboardingChecklist({ forms }: { forms: FormListItem[] }) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    setDismissed(!!localStorage.getItem(CHECKLIST_KEY))
  }, [])

  const firstForm = forms[0]
  const publishedForm = forms.find((f) => f.status === "published")

  const steps: { id: string; label: string; description: string; done: boolean; href: string | null }[] = [
    {
      id: "create",
      label: "Criar formulário",
      description: "Crie seu primeiro formulário do zero ou use um template",
      done: forms.length > 0,
      href: firstForm ? `/builder/${firstForm.id}` : null,
    },
    {
      id: "questions",
      label: "Adicionar 3+ perguntas",
      description: "Seu formulário precisa de pelo menos 3 perguntas",
      done: forms.some((f) => f.questionCount >= 3),
      href: firstForm ? `/builder/${firstForm.id}` : null,
    },
    {
      id: "publish",
      label: "Publicar o formulário",
      description: "Deixe seu formulário disponível para receber respostas",
      done: !!publishedForm,
      href: firstForm ? `/builder/${firstForm.id}` : null,
    },
    {
      id: "response",
      label: "Receber 1ª resposta",
      description: "Compartilhe o link e veja os dados chegando",
      done: forms.some((f) => f.responseCount > 0),
      href: publishedForm
        ? `/responses/${publishedForm.id}`
        : firstForm
        ? `/builder/${firstForm.id}`
        : null,
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length

  // When all done: show celebration for 3s then auto-dismiss
  useEffect(() => {
    if (allDone && dismissed === false) {
      setCelebrating(true)
      const t = setTimeout(() => {
        localStorage.setItem(CHECKLIST_KEY, "1")
        setDismissed(true)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [allDone, dismissed])

  function dismiss() {
    localStorage.setItem(CHECKLIST_KEY, "1")
    setDismissed(true)
  }

  // Wait for localStorage check before rendering
  if (dismissed === null || dismissed) return null

  if (celebrating) {
    return (
      <section className="container mb-6">
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold text-green-700 dark:text-green-400 text-lg">Configuração completa!</p>
          <p className="text-sm text-green-600/80 dark:text-green-500 mt-1">
            Você está pronto para coletar dados com o formularios.ia.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="container mb-6">
      <div className="rounded-2xl border bg-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">Primeiros passos</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {completedCount} de {steps.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            aria-label="Fechar guia de início"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-5 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, i) => {
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 h-full transition-colors ${
                  step.done
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : step.href
                    ? "hover:bg-muted/50 border-border cursor-pointer"
                    : "border-border opacity-50"
                }`}
              >
                <div
                  className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    step.done
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${step.done ? "text-green-700 dark:text-green-400" : ""}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            )

            if (!step.done && step.href) {
              return (
                <Link key={step.id} href={step.href} className="block">
                  {inner}
                </Link>
              )
            }
            return <div key={step.id}>{inner}</div>
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface FormsSectionProps {
  forms: FormListItem[]
}

export function FormsSection({ forms }: FormsSectionProps) {
  const [activeTab, setActiveTab] = useState<"forms" | "templates">("forms")
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [, startTransition] = useTransition()

  const filteredForms = forms.filter((f) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "published" && f.status === "published") ||
      (filter === "draft" && f.status === "draft")
    const matchesSearch =
      search === "" ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description ?? "").toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredTemplates = FORM_TEMPLATES.filter((t) =>
    categoryFilter === "all" || t.category === categoryFilter
  )

  function handleDelete(formId: string) {
    startTransition(() => deleteFormAction(formId))
  }

  function handlePublish(formId: string) {
    startTransition(() => publishFormAction(formId))
  }

  function handleDuplicate(formId: string) {
    startTransition(() => duplicateFormAction(formId))
  }

  function handleClose(formId: string) {
    startTransition(() => closeFormAction(formId))
  }

  function handleUseTemplate(templateId: string) {
    startTransition(() => createFormFromTemplateAction(templateId))
  }

  return (
    <TooltipProvider delayDuration={400}>
    <WelcomeModal />
    <main className="flex-1 pb-24">
      <div className="absolute inset-0 -z-10 h-[600px] w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f0f5_100%)]" />

      {/* Hero */}
      <section className="container pt-20 pb-16 text-center">
        <div className="mx-auto mb-10 inline-flex items-center rounded-full border bg-background/50 p-1 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab("forms")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              activeTab === "forms"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Meus Forms
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              activeTab === "templates"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Templates
          </button>
        </div>

        {activeTab === "forms" ? (
          <>
            <h1 className="font-heading mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
              Um novo jeito<br />de coletar dados
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Crie formulários inteligentes, descubra insights automáticos e conecte com suas ferramentas favoritas.
            </p>
            <div className="mx-auto mt-12 flex max-w-2xl items-center rounded-full border bg-background p-2 shadow-lg transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className="flex flex-1 items-center px-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="Pesquisar em seus formulários..."
                  className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-10 w-full ml-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <CreateFormButton variant="hero" />
              <ImportFormDialog />
            </div>
          </>
        ) : (
          <>
            <h1 className="font-heading mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
              Comece mais rápido<br />com templates
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              10 templates prontos para os casos de uso mais comuns. Personalize em segundos.
            </p>
          </>
        )}
      </section>

      {activeTab === "forms" ? (
        <>
          {/* Onboarding checklist */}
          <OnboardingChecklist forms={forms} />

          {/* Filters */}
          <section className="container mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4">
              {(["all", "published", "draft"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"} className="rounded-full shrink-0" onClick={() => setFilter(f)}>
                  {f === "all" ? "Todos" : f === "published" ? "Publicados" : "Rascunhos"}
                </Button>
              ))}
              <div className="w-px h-6 bg-border mx-2 shrink-0" />
              <Button variant="ghost" className="rounded-full shrink-0 text-muted-foreground hover:bg-muted/50">
                <BarChart3 className="mr-2 h-4 w-4" /> Alta conversão
              </Button>
              <Button variant="ghost" className="rounded-full shrink-0 text-muted-foreground hover:bg-muted/50">
                <Users className="mr-2 h-4 w-4" /> Pesquisas
              </Button>
              <Button variant="ghost" className="rounded-full shrink-0 text-muted-foreground hover:bg-muted/50">
                <Zap className="mr-2 h-4 w-4" /> Integrações ativas
              </Button>
            </div>
          </section>

          {/* Forms grid */}
          <section className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-heading">Seus formulários</h2>
              <span className="text-sm text-muted-foreground">{filteredForms.length} formulário{filteredForms.length !== 1 ? "s" : ""}</span>
            </div>
            {filteredForms.length === 0 ? (
              <EmptyFormsState hasSearch={search !== ""} onSwitchToTemplates={() => setActiveTab("templates")} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                  <FormCard key={form.id} form={form} onDelete={() => handleDelete(form.id)} onPublish={() => handlePublish(form.id)} onDuplicate={() => handleDuplicate(form.id)} onClose={() => handleClose(form.id)} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Category filters */}
          <section className="container mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4">
              <Button variant={categoryFilter === "all" ? "default" : "outline"} className="rounded-full shrink-0" onClick={() => setCategoryFilter("all")}>
                Todos
              </Button>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                <Button key={key} variant={categoryFilter === key ? "default" : "outline"} className="rounded-full shrink-0" onClick={() => setCategoryFilter(key)}>
                  {label}
                </Button>
              ))}
            </div>
          </section>

          {/* Templates grid */}
          <section className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} onUse={() => handleUseTemplate(template.id)} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
    </TooltipProvider>
  )
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({ form, onDelete, onPublish, onDuplicate, onClose }: { form: FormListItem; onDelete: () => void; onPublish: () => void; onDuplicate: () => void; onClose: () => void }) {
  const themeId = (form.theme as { id?: string } | null)?.id ?? "midnight"
  const themeConfig = PRESET_THEMES.find((t) => t.id === themeId) ?? PRESET_THEMES[0]

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
      <div className="h-40 w-full relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: themeConfig.colors.bg }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Ccircle cx=\"2\" cy=\"2\" r=\"1\" fill=\"%23ffffff\"%3E%3C/circle%3E%3C/svg%3E')" }} />
        <div className="w-3/4 max-w-[200px] space-y-3 rounded-lg p-4 shadow-sm transform group-hover:scale-105 transition-transform duration-500" style={{ backgroundColor: themeConfig.colors.card }}>
          <div className="h-2 w-1/3 rounded-full" style={{ backgroundColor: themeConfig.colors.accent }} />
          <div className="h-4 w-3/4 rounded-full" style={{ backgroundColor: themeConfig.colors.text }} />
          <div className="h-8 w-full rounded-md mt-4 opacity-50" style={{ backgroundColor: themeConfig.colors.muted }} />
        </div>
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white border-0 shadow-sm font-medium capitalize">{themeId}</Badge>
        </div>
        {form.status === "published" && (
          <div className="absolute top-4 right-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm ring-2 ring-white/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 bg-card">
        <h3 className="font-heading text-xl font-bold line-clamp-1">{form.title}</h3>
        {form.description && <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">{form.description}</p>}
        <div className="mt-6 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center rounded-md bg-muted px-2.5 text-sm font-medium">{form.responseCount} respostas</span>
            {form.viewCount > 0 && (
              <span className="flex h-7 items-center gap-1 rounded-md bg-muted/60 px-2.5 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />{form.viewCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {form.status === "draft" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-green-600" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPublish(); }}>
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Publicar formulário</TooltipContent>
              </Tooltip>
            )}
            {form.status === "published" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-orange-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}>
                    <PauseCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encerrar coleta de respostas</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/responses/${form.id}`} onClick={(e) => e.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <BarChart3 className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Ver respostas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`); }}>
                  <Link2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar link público</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar formulário</TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
              <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Excluir formulário</TooltipContent>
              </Tooltip>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o formulário
                    <strong className="text-foreground ml-1">{form.title}</strong> e todos os dados de respostas coletados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir Formulário
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <Link href={`/builder/${form.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Editar {form.title}</span>
      </Link>
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template, onUse }: { template: FormTemplate; onUse: () => void }) {
  const questionCount = template.questions.filter(
    (q) => q.type !== "welcome" && q.type !== "thank_you"
  ).length

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
      <div className={`h-40 w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${template.color}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Ccircle cx=\"2\" cy=\"2\" r=\"1.5\" fill=\"%23ffffff\"%3E%3C/circle%3E%3C/svg%3E')" }} />
        <div className="w-3/4 max-w-[200px] space-y-2.5 rounded-xl bg-white/15 backdrop-blur-sm p-4 transform group-hover:scale-105 transition-transform duration-500">
          <div className="h-2.5 w-2/3 rounded-full bg-white/80" />
          <div className="h-2 w-full rounded-full bg-white/40" />
          <div className="h-2 w-4/5 rounded-full bg-white/40" />
          <div className="mt-3 h-7 w-full rounded-lg bg-white/25 border border-white/30" />
        </div>
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
            {TEMPLATE_CATEGORIES[template.category]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-bold line-clamp-1 mb-1">{template.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{template.description}</p>
        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {questionCount} perguntas
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {template.estimatedTime}
          </span>
        </div>
        <Button className="mt-4 w-full rounded-full gap-2" onClick={onUse}>
          Usar template <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFormsState({ hasSearch, onSwitchToTemplates }: { hasSearch: boolean; onSwitchToTemplates: () => void }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Nenhum resultado encontrado</h3>
        <p className="mt-2 text-muted-foreground">Tente buscar por outro termo.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-muted/40 p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
          📋
        </div>
        <h3 className="font-heading text-2xl font-bold">Crie seu primeiro formulário</h3>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          Em três passos simples você já está coletando respostas de qualidade.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { step: "1", icon: PlusCircle, label: "Crie", desc: "Adicione perguntas em minutos com nosso editor visual" },
            { step: "2", icon: Globe, label: "Publique", desc: "Um clique e seu formulário já está no ar com link único" },
            { step: "3", icon: BarChart3, label: "Colete", desc: "Veja as respostas e insights em tempo real no analytics" },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="flex flex-col items-center text-center rounded-xl bg-background/80 border p-4 gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {step}
              </div>
              <Icon className="h-5 w-5 text-primary" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <CreateFormButton variant="hero" />
          <ImportFormDialog />
          <Button variant="outline" className="rounded-full gap-1" onClick={onSwitchToTemplates}>
            Ver templates <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
