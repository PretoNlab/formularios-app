"use client"

import { useState, useTransition } from "react"
import { ChevronRight, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES, type FormTemplate } from "@/config/templates"
import { createFormFromTemplateAction } from "@/app/actions/forms"

export function TemplatesSection() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [, startTransition] = useTransition()

  const filtered = FORM_TEMPLATES.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  )

  function handleUse(templateId: string) {
    startTransition(() => createFormFromTemplateAction(templateId))
  }

  return (
    <main className="flex-1 pb-24">
      <div className="absolute inset-0 -z-10 h-[600px] w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f0f5_100%)]" />

      {/* Hero */}
      <section className="container pt-20 pb-16 text-center">
        <h1 className="font-heading mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Comece mais rápido<br />com templates
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {FORM_TEMPLATES.length} templates prontos para os casos de uso mais comuns. Personalize em segundos.
        </p>
      </section>

      {/* Category filters */}
      <section className="container mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-4">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="rounded-full shrink-0"
            onClick={() => setCategoryFilter("all")}
          >
            Todos
          </Button>
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
            <Button
              key={key}
              variant={categoryFilter === key ? "default" : "outline"}
              className="rounded-full shrink-0"
              onClick={() => setCategoryFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-heading">
            {categoryFilter === "all" ? "Todos os templates" : TEMPLATE_CATEGORIES[categoryFilter as keyof typeof TEMPLATE_CATEGORIES]}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={() => handleUse(template.id)} />
          ))}
        </div>
      </section>
    </main>
  )
}

// ─── Template Card ─────────────────────────────────────────────────────────────

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
