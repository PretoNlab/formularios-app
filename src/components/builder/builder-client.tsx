"use client"

import { useEffect, useTransition, useState, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Type, PenTool, Settings2, Eye, Plus,
  Loader2, Share2,
  CheckCircle2, BarChart3,
  Zap,
  Upload,
  Image as ImageIcon,
  Monitor, PanelRightClose, PanelRight, RefreshCw, Smartphone,
  Globe, Copy, PartyPopper,
  X, Mail, Palette,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FormRenderer } from "@/components/renderer/form-renderer"

import { useBuilderStore } from "@/stores/builder-store"
import { useShallow } from "zustand/react/shallow"
import { saveAndPublishFormAction } from "@/app/actions/forms"
import type { Form, QuestionType } from "@/lib/types/form"
import type { WorkspaceBrandKit } from "@/lib/db/schema"
import { QUESTION_TYPES } from "@/lib/types/form"
import { cn } from "@/lib/utils"

import { TYPE_ICONS, SIDEBAR_TYPES, createQuestion } from "@/components/builder/builder-constants"
import { BuilderTour } from "@/components/builder/builder-tour"
import { QuestionCard } from "@/components/builder/question-card"
import { ThemePickerPanel } from "@/components/builder/panels/theme-picker"
import { FormConfigPanel } from "@/components/builder/panels/form-config"
import { WebhooksPanel } from "@/components/builder/panels/webhooks"
import { GoogleSheetsPanel } from "@/components/builder/panels/google-sheets"
import { PropertiesPanel } from "@/components/builder/panels/properties-panel"
import { LogicPanel } from "@/components/builder/panels/logic-panel"
import { OnboardingBanner } from "@/components/shared/onboarding-banner"
import { ONBOARDING_KEYS, readFlag, setFlag } from "@/lib/utils/onboarding"

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuilderClient({
  initialForm,
  workspaceBrandKit,
}: {
  initialForm: Form
  workspaceBrandKit?: WorkspaceBrandKit | null
}) {
  const { storeForm, setForm } = useBuilderStore(
    useShallow((s) => ({ storeForm: s.form, setForm: s.setForm }))
  )

  useEffect(() => {
    setForm(initialForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialForm.id])

  const form = storeForm?.id === initialForm.id ? storeForm : initialForm

  const markSaved = useBuilderStore((s) => s.markSaved)

  const { hasUnsavedChanges, selectedQuestionId } = useBuilderStore(
    useShallow((s) => ({ hasUnsavedChanges: s.hasUnsavedChanges, selectedQuestionId: s.selectedQuestionId }))
  )

  const {
    selectQuestion, addQuestion, deleteQuestion, duplicateQuestion,
    updateFormStatus, updateFormTitle, updateFormDescription,
    updateFormSettings, updateFormSlug, updateFormTheme,
    reorderQuestions, undo, redo,
  } = useBuilderStore(
    useShallow((s) => ({
      selectQuestion: s.selectQuestion,
      addQuestion: s.addQuestion,
      deleteQuestion: s.deleteQuestion,
      duplicateQuestion: s.duplicateQuestion,
      updateFormStatus: s.updateFormStatus,
      updateFormTitle: s.updateFormTitle,
      updateFormDescription: s.updateFormDescription,
      updateFormSettings: s.updateFormSettings,
      updateFormSlug: s.updateFormSlug,
      updateFormTheme: s.updateFormTheme,
      reorderQuestions: s.reorderQuestions,
      undo: s.undo,
      redo: s.redo,
    }))
  )

  const searchParams = useSearchParams()
  const initialTabParam = searchParams.get("tab")
  const initialTab: "fields" | "config" | "webhooks" | "theme" =
    initialTabParam === "theme" || initialTabParam === "config" || initialTabParam === "webhooks"
      ? initialTabParam
      : "fields"
  const [sidebarTab, setSidebarTab] = useState<"fields" | "config" | "webhooks" | "theme">(initialTab)
  const [builderMode, setBuilderMode] = useState<"editor" | "logic">("editor")
  const [logicHintDismissed, setLogicHintDismissed] = useState(true)
  useEffect(() => {
    setLogicHintDismissed(readFlag(ONBOARDING_KEYS.LOGIC_HINT_DISMISSED))
  }, [])
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [previewKey, setPreviewKey] = useState<number>(Date.now())
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [isPersisting, startPersistTransition] = useTransition()
  const [fieldSearch, setFieldSearch] = useState("")
  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) ?? null

  // Prevent accidental exits with unsaved changes
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [hasUnsavedChanges])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return }
      if (mod && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) handleSave(form.status === "draft")
        return
      }

      if (isTyping) return

      if (mod && e.key === "d" && selectedQuestionId) { e.preventDefault(); duplicateQuestion(selectedQuestionId); return }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedQuestionId) {
        e.preventDefault()
        deleteQuestion(selectedQuestionId)
        selectQuestion(null)
        return
      }
      if (e.key === "Escape") { selectQuestion(null); return }
      if (e.key === "ArrowUp" && selectedQuestionId) {
        e.preventDefault()
        const idx = form.questions.findIndex((q) => q.id === selectedQuestionId)
        if (idx > 0) selectQuestion(form.questions[idx - 1].id)
        return
      }
      if (e.key === "ArrowDown" && selectedQuestionId) {
        e.preventDefault()
        const idx = form.questions.findIndex((q) => q.id === selectedQuestionId)
        if (idx < form.questions.length - 1) selectQuestion(form.questions[idx + 1].id)
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedQuestionId, form.questions, form.status, hasUnsavedChanges, undo, redo, duplicateQuestion, deleteQuestion, selectQuestion, handleSave])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = form.questions.findIndex((q) => q.id === active.id)
    const toIndex = form.questions.findIndex((q) => q.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) reorderQuestions(fromIndex, toIndex)
  }

  function handleAddQuestion(type: QuestionType) {
    addQuestion(createQuestion(type, form.id, form.questions.length))
  }

  async function handleSave(publish: boolean = false) {
    startPersistTransition(async () => {
      try {
        const input = {
          title: form.title,
          description: form.description ?? null,
          slug: form.slug,
          theme: form.theme,
          settings: {
            ...form.settings,
            autoResponderEnabled: form.settings.autoResponderEnabled ?? false,
            autoResponderEmailFieldId: form.settings.autoResponderEmailFieldId ?? null,
            autoResponderSubject: form.settings.autoResponderSubject ?? null,
            autoResponderBody: form.settings.autoResponderBody ?? null,
          },
        }
        const questionsInput = form.questions.map((q) => ({
          id: q.id,
          formId: form.id,
          type: q.type,
          title: q.title,
          description: q.description ?? null,
          required: q.required,
          order: q.order,
          properties: q.properties,
          logicRules: q.logicRules,
        }))

        const result = await saveAndPublishFormAction(form.id, input, questionsInput, publish)

        if (result.success) {
          markSaved()
          setPreviewKey(Date.now())
          if (publish) {
            if (form.status === "draft") updateFormStatus("published")
            setShowShareDialog(true)
          }
        } else {
          throw new Error(result.error?.message || "Erro ao salvar")
        }
      } catch (err: any) {
        console.error("Failed to save:", err)
        alert(err.message || "Erro ao salvar formulário.")
      }
    })
  }

  function handleCopyLink() {
    const link = `${typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"}/f/${form.slug}`
    navigator.clipboard.writeText(link)
    setFlag(ONBOARDING_KEYS.SHARE_COMPLETED)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyEmbed() {
    const code = `<iframe src="${shareLink}" width="100%" height="600" frameborder="0" style="border:0;border-radius:8px"></iframe>`
    navigator.clipboard.writeText(code)
    setFlag(ONBOARDING_KEYS.SHARE_COMPLETED)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"}/f/${form.slug}`

  const showLogicHint = useMemo(
    () =>
      form.questions.length >= 3 &&
      form.questions.every((q) => !q.logicRules || q.logicRules.length === 0),
    [form.questions]
  )

  const filteredFields = useMemo(() =>
    SIDEBAR_TYPES.filter((type) =>
      !fieldSearch || QUESTION_TYPES[type].label.toLowerCase().includes(fieldSearch.toLowerCase())
    ), [fieldSearch])

  const filteredSpecialFields = useMemo(() =>
    (["welcome", "statement", "thank_you"] as QuestionType[]).filter((type) =>
      !fieldSearch || QUESTION_TYPES[type].label.toLowerCase().includes(fieldSearch.toLowerCase())
    ), [fieldSearch])

  return (
    <div className="flex h-full w-full">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-96 flex-shrink-0 border-r bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <Tabs value={sidebarTab} onValueChange={(v) => {
            const tab = v as typeof sidebarTab
            setSidebarTab(tab)
            if (tab === "theme") setPreviewOpen(true)
          }}>
            <TabsList className="grid w-full grid-cols-4 h-10">
              <TabsTrigger value="fields" className="text-xs px-1">Campos</TabsTrigger>
              <TabsTrigger value="theme" className="text-xs px-1">Tema</TabsTrigger>
              <TabsTrigger value="config" className="text-xs px-1">Config</TabsTrigger>
              <TabsTrigger value="webhooks" className="text-xs px-1">Integrar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {sidebarTab === "fields" && (
            <div className="p-4 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Buscar campo..."
                  className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Type className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                {fieldSearch && (
                  <button onClick={() => setFieldSearch("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {filteredFields.length === 0 && filteredSpecialFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum campo encontrado</p>
              ) : (
                <>
                  {filteredFields.length > 0 && (
                    <div className="space-y-3">
                      {!fieldSearch && <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionar Campo</h4>}
                      <div className="space-y-1.5">
                        {filteredFields.map((type) => {
                          const Icon = TYPE_ICONS[type] ?? Type
                          const meta = QUESTION_TYPES[type]
                          return (
                            <button
                              key={type}
                              type="button"
                              title={meta.description}
                              className="w-full flex items-start gap-3 rounded-md border border-dashed border-input bg-muted/20 px-3 py-2.5 text-left hover:bg-muted/50 hover:border-solid transition-all group"
                              onClick={() => { handleAddQuestion(type); setFieldSearch("") }}
                            >
                              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-foreground leading-tight">{meta.label}</div>
                                <div className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{meta.description}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {filteredSpecialFields.length > 0 && (
                    <>
                      {filteredFields.length > 0 && <Separator />}
                      <div className="space-y-3">
                        {!fieldSearch && <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Páginas Especiais</h4>}
                        <div className="space-y-2">
                          {filteredSpecialFields.map((type) => {
                            const Icon = TYPE_ICONS[type] ?? Type
                            return (
                              <Button
                                key={type}
                                variant="outline"
                                className="w-full justify-start text-sm h-10 border-dashed"
                                onClick={() => { handleAddQuestion(type); setFieldSearch("") }}
                              >
                                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {QUESTION_TYPES[type].label}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {!fieldSearch && (
                <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Atalhos</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span><kbd className="font-mono">↑↓</kbd> Navegar</span>
                    <span><kbd className="font-mono">Ctrl+D</kbd> Duplicar</span>
                    <span><kbd className="font-mono">Ctrl+S</kbd> Salvar</span>
                    <span><kbd className="font-mono">Del</kbd> Excluir</span>
                    <span><kbd className="font-mono">Ctrl+Z</kbd> Desfazer</span>
                    <span><kbd className="font-mono">Esc</kbd> Desselecionar</span>
                    <span><kbd className="font-mono">Ctrl+Y</kbd> Refazer</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {sidebarTab === "theme" && (
            <ThemePickerPanel
              form={form}
              onSelect={updateFormTheme}
              onUpdateLogo={(logo) => updateFormTheme({ ...form.theme, logo })}
              workspaceBrandKit={workspaceBrandKit ?? null}
            />
          )}

          {sidebarTab === "config" && (
            <FormConfigPanel
              form={form}
              onTitleChange={updateFormTitle}
              onDescriptionChange={updateFormDescription}
              onSettingsChange={updateFormSettings}
              onSlugChange={updateFormSlug}
            />
          )}

          {sidebarTab === "webhooks" && (
            <>
              <WebhooksPanel formId={form.id} />
              <GoogleSheetsPanel formId={form.id} />
            </>
          )}
        </ScrollArea>
      </aside>

      {/* ── CENTER CANVAS ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-muted/10 relative">
        {/* Floating toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur-md p-1.5 shadow-sm z-10 whitespace-nowrap">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full px-4 h-8 text-xs font-medium transition-all ${builderMode === "editor" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            onClick={() => setBuilderMode("editor")}
          >
            Editor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`relative rounded-full px-4 h-8 text-xs font-medium transition-all ${builderMode === "logic" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            onClick={() => setBuilderMode("logic")}
          >
            Lógica
            {showLogicHint && !logicHintDismissed && builderMode !== "logic" && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </Button>
          {!previewOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 h-8 text-xs font-medium text-muted-foreground"
              onClick={() => setPreviewOpen(true)}
              title="Abrir painel de preview"
            >
              <PanelRight className="mr-1.5 h-4 w-4" /> Preview
            </Button>
          )}
          <Separator orientation="vertical" className="h-4" />
          <Link
            href={`/f/${form.slug}?preview=1`}
            target="_blank"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Abrir em Nova Guia"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/responses/${form.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Ver respostas"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
          <Separator orientation="vertical" className="h-4" />
          {/* Save / Publish / Update Actions */}
          <div className="flex items-center gap-2 pl-2">
            {hasUnsavedChanges ? (
              <>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button
                  size="sm"
                  className="rounded-full px-4 h-8 text-xs font-semibold shadow-sm animate-in fade-in zoom-in duration-200"
                  onClick={() => handleSave(form.status === "draft")}
                  disabled={isPersisting}
                >
                  {isPersisting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {form.status === "draft" ? "Publicar" : "Atualizar"}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-4 mx-1" />
                {form.status === "draft" ? (
                  <Badge variant="outline" className="rounded-full px-3 h-8 text-xs font-medium border-dashed text-muted-foreground bg-muted/30">
                    <PenTool className="mr-1.5 h-3 w-3" />Rascunho
                  </Badge>
                ) : (
                  <>
                    <Badge variant="secondary" className="rounded-full px-3 h-8 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="mr-1.5 h-3 w-3" />Publicado
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 h-8 text-xs font-medium border-primary/20 hover:bg-primary/5"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share2 className="mr-1.5 h-3 w-3" />
                      Compartilhar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-8 pt-24">
            <div className="mx-auto max-w-2xl space-y-4">
              {form.status === "published" && (
                <OnboardingBanner
                  storageKey={ONBOARDING_KEYS.postPublish(form.id)}
                  icon={PartyPopper}
                  title="Formulário publicado! Próximos passos"
                  description="Maximize seu formulário com estes 3 cliques."
                  className="mb-6"
                  actions={[
                    {
                      label: copied ? "Link copiado!" : "Copiar link",
                      icon: copied ? CheckCircle2 : Copy,
                      onClick: handleCopyLink,
                    },
                    {
                      label: "Configurar notificação",
                      icon: Mail,
                      onClick: () => {
                        setSidebarTab("config")
                      },
                    },
                    {
                      label: "Personalizar tema",
                      icon: Palette,
                      onClick: () => {
                        setSidebarTab("theme")
                      },
                    },
                  ]}
                />
              )}

              {/* Logotipo do formulário */}
            {form.theme.logo?.url && (
              <div
                className={cn(
                  "mb-8 flex",
                  form.theme.logo.position === "left" ? "justify-start" :
                  form.theme.logo.position === "right" ? "justify-end" : "justify-center"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.theme.logo.url} alt="Logo do formulário" className="max-h-20 object-contain" />
              </div>
            )}

            {/* Editable form title */}
            <div className="mb-8 pb-6 border-b">
              <input
                className="w-full text-3xl font-bold bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/30 font-heading"
                value={form.title}
                onChange={(e) => updateFormTitle(e.target.value)}
                placeholder="Formulário sem título"
              />
              <input
                className="w-full mt-2 text-sm text-muted-foreground bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/30"
                value={form.description ?? ""}
                onChange={(e) => updateFormDescription(e.target.value || "")}
                placeholder="Descrição do formulário (opcional)..."
              />
            </div>

            {form.questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Plus className="h-10 w-10 mb-4 opacity-20" />
                <p className="text-sm">Adicione campos usando o painel à esquerda.</p>
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                {form.questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    isSelected={q.id === selectedQuestionId}
                    onSelect={() => selectQuestion(q.id)}
                    onDelete={() => deleteQuestion(q.id)}
                    onDuplicate={() => duplicateQuestion(q.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="w-full h-14 border-dashed text-muted-foreground hover:text-foreground mt-8"
              onClick={() => handleAddQuestion("short_text")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar campo de texto curto
            </Button>
          </div>
          </ScrollArea>
      </main>

      {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-80 lg:w-96 flex-shrink-0 border-l bg-card flex flex-col overflow-hidden">
        <div className="flex h-14 items-center border-b px-4">
          {builderMode === "logic" ? (
            <><Zap className="mr-2 h-4 w-4 text-muted-foreground" /><h3 className="font-semibold text-sm">Lógica</h3></>
          ) : (
            <><Settings2 className="mr-2 h-4 w-4 text-muted-foreground" /><h3 className="font-semibold text-sm">Propriedades</h3></>
          )}
        </div>
        <ScrollArea className="flex-1">
          {builderMode === "logic" ? (
            selectedQuestion ? (
              <LogicPanel question={selectedQuestion} allQuestions={form.questions} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Zap className="h-8 w-8 mb-4 opacity-20" />
                <p className="text-sm">Selecione uma pergunta para definir sua lógica.</p>
              </div>
            )
          ) : (
            selectedQuestion ? (
              <PropertiesPanel question={selectedQuestion} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Settings2 className="h-8 w-8 mb-4 opacity-20" />
                <p className="text-sm">Selecione uma pergunta para editar suas propriedades.</p>
              </div>
            )
          )}
        </ScrollArea>
      </aside>

      {/* ── LIVE PREVIEW PANEL ───────────────────────────────────────── */}
      {previewOpen && (
        <div className="w-[420px] shrink-0 border-l bg-muted/20 flex flex-col overflow-hidden">
          {/* Header: device toggle + refresh + close */}
          <div className="h-10 border-b flex items-center justify-between px-2 shrink-0 bg-card">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                className="h-7 w-7"
                onClick={() => setPreviewDevice("desktop")}
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                className="h-7 w-7"
                onClick={() => setPreviewDevice("mobile")}
                title="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPreviewKey(Date.now())}
                title="Reiniciar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setPreviewOpen(false)}
              title="Fechar preview"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-3">
            {form.questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Eye className="h-10 w-10 opacity-20" />
                <div>
                  <p className="text-sm font-medium">Nenhuma pergunta ainda</p>
                  <p className="text-xs mt-1">Adicione campos no painel à esquerda.</p>
                </div>
              </div>
            ) : previewDevice === "mobile" ? (
              <div className="relative w-[280px] h-[580px] max-h-full rounded-[2.5rem] border-[6px] border-zinc-900 bg-background shadow-xl overflow-hidden flex flex-col shrink-0 ring-1 ring-border/20">
                <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-50 pointer-events-none">
                  <div className="w-24 h-5 bg-zinc-900 rounded-b-2xl" />
                </div>
                <FormRenderer
                  key={`panel-mobile-${previewKey}`}
                  form={form}
                  className="!min-h-full !justify-start"
                  onSubmit={async () => {
                    alert("🎉 Preview concluído. Em modo preview as respostas não são salvas.")
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-lg border bg-background shadow-md overflow-hidden flex flex-col ring-1 ring-border/5">
                <div className="h-8 border-b flex items-center px-3 gap-1.5 bg-muted/40 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  <div className="ml-3 flex-1 max-w-xs bg-background rounded text-[9px] text-muted-foreground/60 px-2 py-0.5 select-none flex items-center justify-center border font-mono">
                    /f/{form.slug || "meu-form"}
                  </div>
                </div>
                <div className="flex-1 relative overflow-auto">
                  <FormRenderer
                    key={`panel-desktop-${previewKey}`}
                    form={form}
                    className="!min-h-full !justify-start"
                    onSubmit={async () => {
                      alert("🎉 Preview concluído. Em modo preview as respostas não são salvas.")
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BUILDER TOUR ─────────────────────────────────────────────── */}
      <BuilderTour />

      {/* ── SHARE DIALOG ────────────────────────────────────────────── */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-muted/10 border-muted">
          <div className="flex flex-col md:flex-row h-[80vh] max-h-[600px]">
            {/* Esquerda: Preview */}
            <div className="flex-1 bg-background relative hidden md:block border-r">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-md shadow-sm border text-[10px] font-medium px-2.5 py-1">
                  <Eye className="mr-1.5 h-3 w-3 text-muted-foreground" /> Pré-visualização
                </Badge>
              </div>
              <div className="absolute top-4 right-4 z-10">
                 <Link href={`${shareLink}?preview=1&v=${previewKey}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-md shadow-sm border text-muted-foreground hover:text-foreground transition-colors">
                   <Globe className="h-3.5 w-3.5" />
                 </Link>
              </div>
              <iframe
                src={`${shareLink}?preview=1&v=${previewKey}`}
                className="w-full h-full border-0 rounded-l-lg"
                title="Pré-visualização do formulário"
              />
            </div>

            {/* Direita: Opções */}
            <div className="w-full md:w-[380px] bg-card p-8 flex flex-col shrink-0">
              <DialogHeader className="mb-8 text-left space-y-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                  <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Publicado!</DialogTitle>
                <DialogDescription className="text-sm">
                  Seu formulário agora está no ar e pronto para receber respostas.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 flex-1">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link de compartilhamento</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      readOnly
                      value={shareLink}
                      className="text-sm h-10 bg-muted/50 font-medium"
                    />
                  </div>
                  <Button
                    className="w-full h-10 font-medium"
                    variant={copied ? "secondary" : "default"}
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Link copiado!</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" /> Copiar link</>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button variant="outline" className="w-full h-10" asChild>
                    <a href={`${shareLink}?v=${previewKey}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Abrir formulário em nova aba
                    </a>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incorporar no seu site</label>
                  <pre className="w-full rounded-lg bg-muted p-3 text-[11px] font-mono text-muted-foreground leading-relaxed overflow-auto whitespace-pre-wrap break-all">
{`<iframe src="${shareLink}" width="100%" height="600" frameborder="0" style="border:0;border-radius:8px"></iframe>`}
                  </pre>
                  <Button variant="outline" className="w-full h-10" onClick={handleCopyEmbed}>
                    {copiedEmbed ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Copiado!</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" />Copiar código de embed</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
