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
        "group relative flex items-center gap-4 rounded-xl border p-4 transition-all cursor-pointer bg-card hover:border-primary/50 hover:shadow-sm",
        isSelected ? "border-primary ring-1 ring-primary shadow-sm" : "border-border",
        isDragging && "shadow-xl z-10"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] uppercase font-semibold text-muted-foreground gap-1">
            <Icon className="h-3 w-3" />{typeLabel}
          </Badge>
          {question.required && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Obrigatório</Badge>
          )}
          {index === 0 && <Badge className="text-[10px] bg-blue-500 hover:bg-blue-600">Primeira pergunta</Badge>}
        </div>
        <h3 className={cn("mt-2 font-medium text-sm truncate", isSelected ? "text-foreground" : "text-muted-foreground")}>
          {question.title || "(sem título)"}
        </h3>
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete() }} title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <div
          className="h-7 w-7 flex items-center justify-center text-muted-foreground/40 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
