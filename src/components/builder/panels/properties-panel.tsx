"use client"

import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useBuilderStore } from "@/stores/builder-store"
import type { Question, QuestionType } from "@/lib/types/form"
import { QUESTION_TYPES } from "@/lib/types/form"
import { cn } from "@/lib/utils"
import { OptionsEditor } from "@/components/builder/editors/options-editor"
import { DownloadUrlEditor } from "@/components/builder/editors/download-url-editor"
import { MediaUrlEditor } from "@/components/builder/editors/media-url-editor"

export function PropertiesPanel({ question }: { question: Question }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const deleteQuestion = useBuilderStore((s) => s.deleteQuestion)
  const selectQuestion = useBuilderStore((s) => s.selectQuestion)

  const hasOptions = ["multiple_choice", "checkbox", "dropdown"].includes(question.type)

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Tipo</p>
        <Badge variant="secondary" className="capitalize text-xs">
          {QUESTION_TYPES[question.type as QuestionType]?.label ?? question.type}
        </Badge>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Título <span className="text-destructive">*</span></label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[72px] resize-none"
          value={question.title}
          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
          placeholder="Título da pergunta..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[56px] resize-none"
          value={question.description ?? ""}
          onChange={(e) => updateQuestion(question.id, { description: e.target.value || undefined })}
          placeholder="Instruções adicionais..."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Obrigatório</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Usuário não pode pular</p>
        </div>
        <Switch
          checked={question.required}
          onCheckedChange={(v) => updateQuestion(question.id, { required: v })}
        />
      </div>

      {hasOptions && (
        <>
          <Separator />
          <OptionsEditor question={question} />
        </>
      )}

      {["welcome", "statement", "thank_you", "download"].includes(question.type) && (
        <>
          <Separator />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Texto do Botão</label>
            <Input
              value={question.properties.buttonText ?? ""}
              onChange={(e) =>
                updateQuestion(question.id, { properties: { ...question.properties, buttonText: e.target.value || undefined } })
              }
              placeholder="Adicionar texto..."
              className="text-sm h-9"
            />
          </div>
        </>
      )}

      {["welcome", "statement", "thank_you"].includes(question.type) && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Alinhamento do Conteúdo</label>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((align) => {
                  const current = question.properties.contentAlign ?? "left"
                  return (
                    <Button
                      key={align}
                      variant={current === align ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs capitalize"
                      onClick={() => updateQuestion(question.id, { properties: { ...question.properties, contentAlign: align } })}
                    >
                      {align === "left" ? <AlignLeft className="h-3 w-3 mr-1" /> : align === "center" ? <AlignCenter className="h-3 w-3 mr-1" /> : <AlignRight className="h-3 w-3 mr-1" />}
                      {align === "left" ? "Esquerda" : align === "center" ? "Centro" : "Direita"}
                    </Button>
                  )
                })}
              </div>
            </div>
            <MediaUrlEditor question={question} />
          </div>
        </>
      )}

      {question.type === "download" && (
        <>
          <Separator />
          <div className="space-y-4">
            <DownloadUrlEditor question={question} />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tamanho do Botão</label>
              <select
                value={question.properties.downloadButtonSize ?? "default"}
                onChange={(e) =>
                  updateQuestion(question.id, { properties: { ...question.properties, downloadButtonSize: e.target.value as any } })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="sm">Pequeno</option>
                <option value="default">Normal</option>
                <option value="lg">Grande</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Alinhamento</label>
              <select
                value={question.properties.downloadButtonAlign ?? "center"}
                onChange={(e) =>
                  updateQuestion(question.id, { properties: { ...question.properties, downloadButtonAlign: e.target.value as any } })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
                <option value="full">Largura Total (Expandido)</option>
              </select>
            </div>
          </div>
        </>
      )}

      {["short_text", "long_text", "email", "number", "phone", "whatsapp", "cpf", "cnpj", "url"].includes(question.type) && (
        <>
          <Separator />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Placeholder</label>
            <Input
              value={question.properties.placeholder ?? ""}
              onChange={(e) =>
                updateQuestion(question.id, { properties: { ...question.properties, placeholder: e.target.value || undefined } })
              }
              placeholder="ex: Digite aqui..."
              className="text-sm h-9"
            />
          </div>
        </>
      )}

      {question.type === "number" && (
        <>
          <Separator />
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Limites do número</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Mínimo</label>
                <Input
                  type="number"
                  value={question.properties.min ?? ""}
                  onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, min: e.target.value ? Number(e.target.value) : undefined } })}
                  placeholder="—"
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Máximo</label>
                <Input
                  type="number"
                  value={question.properties.max ?? ""}
                  onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, max: e.target.value ? Number(e.target.value) : undefined } })}
                  placeholder="—"
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Passo</label>
                <Input
                  type="number"
                  value={question.properties.step ?? ""}
                  onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, step: e.target.value ? Number(e.target.value) : undefined } })}
                  placeholder="1"
                  className="text-sm h-8"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {question.type === "rating" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Estilo</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["stars", "hearts", "thumbs", "numbers"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateQuestion(question.id, { properties: { ...question.properties, ratingStyle: style } })}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                      (question.properties.ratingStyle ?? "stars") === style
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <span className="text-base">{style === "stars" ? "★" : style === "hearts" ? "♥" : style === "thumbs" ? "👍" : "1"}</span>
                    <span className="truncate w-full text-center">{style === "stars" ? "Estrelas" : style === "hearts" ? "Corações" : style === "thumbs" ? "Polegar" : "Números"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Máximo de estrelas</label>
              <select
                value={question.properties.ratingMax ?? 5}
                onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, ratingMax: Number(e.target.value) } })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {question.type === "scale" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Faixa da escala</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">De</label>
                  <select
                    value={question.properties.scaleMin ?? 1}
                    onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, scaleMin: Number(e.target.value) } })}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {[0, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Até</label>
                  <select
                    value={question.properties.scaleMax ?? 10}
                    onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, scaleMax: Number(e.target.value) } })}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Label início</label>
                <Input
                  value={question.properties.scaleMinLabel ?? ""}
                  onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, scaleMinLabel: e.target.value || undefined } })}
                  placeholder="ex: Ruim"
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Label fim</label>
                <Input
                  value={question.properties.scaleMaxLabel ?? ""}
                  onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, scaleMaxLabel: e.target.value || undefined } })}
                  placeholder="ex: Ótimo"
                  className="text-sm h-8"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {question.type === "file_upload" && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tipos permitidos</label>
              <div className="space-y-2">
                {([
                  { value: "image/*", label: "Imagens (JPG, PNG, GIF...)" },
                  { value: "application/pdf", label: "PDF" },
                  { value: "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (.doc, .docx)" },
                  { value: "video/*", label: "Vídeos" },
                  { value: "audio/*", label: "Áudio" },
                ] as const).map(({ value, label }) => {
                  const current = question.properties.allowedFileTypes ?? []
                  const checked = current.includes(value)
                  return (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? current.filter((t) => t !== value) : [...current, value]
                          updateQuestion(question.id, { properties: { ...question.properties, allowedFileTypes: next.length ? next : undefined } })
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tamanho máximo</label>
              <select
                value={question.properties.maxFileSize ?? 10}
                onChange={(e) => updateQuestion(question.id, { properties: { ...question.properties, maxFileSize: Number(e.target.value) } })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value={1}>1 MB</option>
                <option value={5}>5 MB</option>
                <option value={10}>10 MB</option>
                <option value={25}>25 MB</option>
                <option value={50}>50 MB</option>
              </select>
            </div>
          </div>
        </>
      )}

      <Separator />

      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => { deleteQuestion(question.id); selectQuestion(null) }}
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />Excluir pergunta
      </Button>
    </div>
  )
}
