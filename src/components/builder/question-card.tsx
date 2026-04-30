"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, GripVertical, Trash2, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Question, QuestionType } from "@/lib/types/form"
import { QUESTION_TYPES } from "@/lib/types/form"
import { TYPE_ICONS } from "@/components/builder/builder-constants"
import { cn } from "@/lib/utils"

export interface QuestionCardProps {
  question: Question
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function QuestionCard({ question, index, isSelected, onSelect, onDelete, onDuplicate }: QuestionCardProps) {
  const Icon = TYPE_ICONS[question.type] ?? Type
  const typeLabel = QUESTION_TYPES[question.type as QuestionType]?.label ?? question.type

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={onSelect}
      className={cn(
        "group relative flex items-center gap-4 rounded-xl p-4 transition-all cursor-pointer bg-card border border-transparent hover:bg-accent/30",
        isSelected ? "ring-2 ring-primary/20 border-primary bg-background shadow-sm" : "",
        isDragging && "shadow-xl z-10 ring-1 ring-border"
      )}
    >
      {/* Notion-style Left Drag Handle */}
      <div
        className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing p-1 bg-background rounded-md shadow-sm border border-border"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50 text-xs font-bold text-muted-foreground shrink-0 border border-border/50">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="secondary" className="text-[10px] uppercase font-semibold text-muted-foreground gap-1 bg-muted/50 hover:bg-muted">
            <Icon className="h-3 w-3" />{typeLabel}
          </Badge>
          {question.required && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20 bg-destructive/5">Obrigatório</Badge>
          )}
          {index === 0 && <Badge className="text-[10px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">Primeira pergunta</Badge>}
        </div>
        <h3 className={cn("font-medium text-sm truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
          {question.title || <span className="text-muted-foreground/50 italic">Sem título</span>}
        </h3>
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicar">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete() }} title="Excluir">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
