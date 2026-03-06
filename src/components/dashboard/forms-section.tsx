"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  Search, BarChart3, Users, Zap, Link2,
  Trash2, Globe, FileText, Clock, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PRESET_THEMES } from "@/config/themes"
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES, type FormTemplate } from "@/config/templates"
import { CreateFormButton } from "./create-form-button"
import { deleteFormAction, publishFormAction, createFormFromTemplateAction } from "@/app/actions/forms"
import type { FormListItem } from "@/lib/db/queries/forms"

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
    if (!confirm("Excluir este formulário? Esta ação não pode ser desfeita.")) return
    startTransition(() => deleteFormAction(formId))
  }

  function handlePublish(formId: string) {
    startTransition(() => publishFormAction(formId))
  }

  function handleUseTemplate(templateId: string) {
    startTransition(() => createFormFromTemplateAction(templateId))
  }

  return (
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
              <EmptyFormsState hasSearch={search !== ""} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                  <FormCard key={form.id} form={form} onDelete={() => handleDelete(form.id)} onPublish={() => handlePublish(form.id)} />
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
  )
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({ form, onDelete, onPublish }: { form: FormListItem; onDelete: () => void; onPublish: () => void }) {
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
          <span className="flex h-7 items-center rounded-md bg-muted px-2.5 text-sm font-medium">{form.responseCount} respostas</span>
          <div className="flex items-center gap-1">
            {form.status === "draft" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-green-600" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPublish(); }} title="Publicar">
                <Globe className="h-4 w-4" />
              </Button>
            )}
            <Link href={`/responses/${form.id}`} onClick={(e) => e.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Ver respostas">
              <BarChart3 className="h-4 w-4" />
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`); }} title="Copiar link">
              <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} title="Excluir">
              <Trash2 className="h-4 w-4" />
            </Button>
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

function EmptyFormsState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="text-xl font-semibold">Nenhum resultado encontrado</h3>
          <p className="mt-2 text-muted-foreground">Tente buscar por outro termo.</p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold">Nenhum formulário ainda</h3>
          <p className="mt-2 text-muted-foreground max-w-sm">
            Crie seu primeiro formulário ou escolha um template para começar.
          </p>
          <div className="mt-6">
            <CreateFormButton variant="hero" />
          </div>
        </>
      )}
    </div>
  )
}
