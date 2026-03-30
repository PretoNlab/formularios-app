"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useBuilderStore } from "@/stores/builder-store"
import type { Question } from "@/lib/types/form"

export function OptionsEditor({ question }: { question: Question }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const options = question.properties.options ?? []

  function updateOption(id: string, label: string) {
    updateQuestion(question.id, {
      properties: { ...question.properties, options: options.map((o) => (o.id === id ? { ...o, label } : o)) },
    })
  }

  function addOption() {
    updateQuestion(question.id, {
      properties: { ...question.properties, options: [...options, { id: crypto.randomUUID(), label: `Opção ${options.length + 1}` }] },
    })
  }

  function removeOption(id: string) {
    updateQuestion(question.id, {
      properties: { ...question.properties, options: options.filter((o) => o.id !== id) },
    })
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground">Opções de Resposta</label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
              {String.fromCharCode(65 + i)}
            </div>
            <Input value={opt.label} onChange={(e) => updateOption(opt.id, e.target.value)} className="flex-1 h-8 text-sm" />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeOption(opt.id)} disabled={options.length <= 1}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addOption} disabled={options.length >= 20}>
        <Plus className="mr-1.5 h-3 w-3" /> Adicionar opção
      </Button>

      {["multiple_choice", "checkbox"].includes(question.type) && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <label className="text-sm cursor-pointer" htmlFor={`allowOther-${question.id}`}>Opção "Outro"</label>
          <Switch
            id={`allowOther-${question.id}`}
            checked={question.properties.allowOther ?? false}
            onCheckedChange={(v) => updateQuestion(question.id, { properties: { ...question.properties, allowOther: v || undefined } })}
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <label className="text-sm cursor-pointer" htmlFor={`randomize-${question.id}`}>Embaralhar opções</label>
        <Switch
          id={`randomize-${question.id}`}
          checked={question.properties.randomizeOptions ?? false}
          onCheckedChange={(v) => updateQuestion(question.id, { properties: { ...question.properties, randomizeOptions: v || undefined } })}
        />
      </div>
    </div>
  )
}
