"use client"

import { useState, useTransition } from "react"
import { Loader2, Clock, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES, type FormTemplate } from "@/config/templates"
import { createFormFromTemplateAction } from "@/app/actions/forms"

// ─── Template Card ─────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onUse,
  loading,
}: {
  template: FormTemplate
  onUse: (id: string) => void
  loading: boolean
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Gradient header */}
      <div className={`h-24 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
        <FileText className="h-8 w-8 text-white/80" />
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{template.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs capitalize">
            {TEMPLATE_CATEGORIES[template.category]}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{template.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{template.estimatedTime}</span>
            <span className="mx-1">·</span>
            <span>{template.questions.filter((q) => !["welcome", "thank_you", "statement"].includes(q.type)).length} perguntas</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            onClick={() => onUse(template.id)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Usar template"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TemplatesSection() {
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [category, setCategory] = useState<FormTemplate["category"] | "todos">("todos")
  const [search, setSearch] = useState("")

  function handleUse(templateId: string) {
    setLoadingId(templateId)
    startTransition(async () => {
      try {
        await createFormFromTemplateAction(templateId)
      } catch {
        // redirect() throws internally — expected
      }
    })
  }

  const filtered = FORM_TEMPLATES.filter((t) => {
    if (category !== "todos" && t.category !== category) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const categories: Array<FormTemplate["category"] | "todos"> = [
    "todos",
    ...(Object.keys(TEMPLATE_CATEGORIES) as FormTemplate["category"][]),
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-1">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Comece rápido com um template pronto. Personalize como quiser depois.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full flex flex-col gap-6">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar templates..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30",
                ].join(" ")}
              >
                {cat === "todos" ? "Todos" : TEMPLATE_CATEGORIES[cat as FormTemplate["category"]]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum template encontrado para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUse}
                loading={isPending && loadingId === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
