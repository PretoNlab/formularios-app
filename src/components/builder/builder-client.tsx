"use client"

import { useEffect, useTransition, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Type, AlignLeft, Hash, Phone, TextCursorInput, Calendar, Link2 as LinkIcon,
  ListTodo, CheckSquare, ChevronDown, ToggleLeft,
  Star, TrendingUp, Presentation, MessageSquare,
  PartyPopper, Paperclip, PenTool, GripVertical, Settings2, Eye, Plus,
  Loader2, Globe, Trash2, Copy, CheckCircle2, AlertCircle, BarChart3,
  Webhook, Zap, MessageCircle, CreditCard, Building2, Share2,
  Image as ImageIcon, AlignLeft as AlignLeftIcon, AlignCenter, AlignRight, X, PaintBucket, Palette, Type as TypeIcon,
  Table2, ChevronDown as ChevronDownIcon, ExternalLink, RefreshCw
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FormRenderer } from "@/components/renderer/form-renderer"

import { useBuilderStore } from "@/stores/builder-store"
import { useAutoSave } from "@/lib/hooks/use-auto-save"
import { publishFormAction } from "@/app/actions/forms"
import {
  getFormIntegrationsAction,
  createWebhookAction,
  toggleIntegrationAction,
  deleteIntegrationAction,
  getGoogleSheetsAuthUrlAction,
  listSheetTabsAction,
  configureGoogleSheetsAction,
  disconnectGoogleSheetsAction,
} from "@/app/actions/integrations"
import type { Form, Question, QuestionType, ThemeConfig, LogicRule, LogicOperator } from "@/lib/types/form"
import { QUESTION_TYPES } from "@/lib/types/form"
import type { IntegrationRow } from "@/lib/db/queries/integrations"
import { PRESET_THEMES, AVAILABLE_FONTS } from "@/config/themes"
import { cn } from "@/lib/utils"

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  email: TextCursorInput,
  number: Hash,
  phone: Phone,
  whatsapp: MessageCircle,
  cpf: CreditCard,
  cnpj: Building2,
  date: Calendar,
  url: LinkIcon,
  multiple_choice: ListTodo,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  rating: Star,
  scale: TrendingUp,
  nps: TrendingUp,
  welcome: Presentation,
  statement: MessageSquare,
  thank_you: PartyPopper,
  file_upload: Paperclip,
  signature: PenTool,
}

const SIDEBAR_TYPES: QuestionType[] = [
  "short_text", "long_text", "email", "number",
  "phone", "whatsapp",
  "cpf", "cnpj",
  "multiple_choice", "checkbox", "dropdown", "yes_no",
  "rating", "nps",
  "file_upload",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createQuestion(type: QuestionType, formId: string, order: number): Question {
  const hasOptions = ["multiple_choice", "checkbox", "dropdown"].includes(type)
  return {
    id: crypto.randomUUID(),
    formId,
    type,
    title: QUESTION_TYPES[type].label,
    required: false,
    order,
    properties: hasOptions
      ? { options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }] }
      : {},
    logicRules: [],
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuilderClient({ initialForm }: { initialForm: Form }) {
  const storeForm = useBuilderStore((s) => s.form)
  const setForm = useBuilderStore((s) => s.setForm)

  useEffect(() => {
    setForm(initialForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialForm.id])

  const form = (storeForm as unknown as Form | null) ?? initialForm

  const { isSaving } = useAutoSave()
  const hasUnsavedChanges = useBuilderStore((s) => s.hasUnsavedChanges)
  const selectedQuestionId = useBuilderStore((s) => s.selectedQuestionId)
  const selectQuestion = useBuilderStore((s) => s.selectQuestion)
  const addQuestion = useBuilderStore((s) => s.addQuestion)
  const deleteQuestion = useBuilderStore((s) => s.deleteQuestion)
  const duplicateQuestion = useBuilderStore((s) => s.duplicateQuestion)
  const updateFormStatus = useBuilderStore((s) => s.updateFormStatus)
  const updateFormTitle = useBuilderStore((s) => s.updateFormTitle)
  const updateFormDescription = useBuilderStore((s) => s.updateFormDescription)
  const updateFormSettings = useBuilderStore((s) => s.updateFormSettings)
  const updateFormSlug = useBuilderStore((s) => s.updateFormSlug)
  const updateFormTheme = useBuilderStore((s) => s.updateFormTheme)
  const reorderQuestions = useBuilderStore((s) => s.reorderQuestions)

  const [sidebarTab, setSidebarTab] = useState<"fields" | "config" | "webhooks" | "theme">("fields")
  const [builderMode, setBuilderMode] = useState<"editor" | "logic" | "preview">("editor")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPublishing, startPublishTransition] = useTransition()
  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) ?? null

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

  function handlePublish() {
    startPublishTransition(async () => {
      await publishFormAction(form.id)
      updateFormStatus("published")
      setShowShareDialog(true)
    })
  }

  function handleCopyLink() {
    const link = `${typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"}/f/${form.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"}/f/${form.slug}`

  return (
    <div className="flex h-full w-full">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-96 flex-shrink-0 border-r bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as typeof sidebarTab)}>
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
            <div className="p-4 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionar Campo</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SIDEBAR_TYPES.map((type) => {
                    const Icon = TYPE_ICONS[type] ?? Type
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="h-20 flex-col gap-2 border-dashed bg-muted/20 hover:bg-muted/50 hover:border-solid hover:text-foreground text-muted-foreground transition-all"
                        onClick={() => handleAddQuestion(type)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] leading-tight text-center">{QUESTION_TYPES[type].label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Páginas Especiais</h4>
                <div className="space-y-2">
                  {(["welcome", "statement", "thank_you"] as QuestionType[]).map((type) => {
                    const Icon = TYPE_ICONS[type] ?? Type
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        className="w-full justify-start text-sm h-10 border-dashed"
                        onClick={() => handleAddQuestion(type)}
                      >
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {QUESTION_TYPES[type].label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "theme" && (
            <ThemePickerPanel
              form={form}
              onSelect={updateFormTheme}
              onUpdateLogo={(logo) => updateFormTheme({ ...form.theme, logo })}
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
            className={`rounded-full px-4 h-8 text-xs font-medium transition-all ${builderMode === "logic" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            onClick={() => setBuilderMode("logic")}
          >
            Lógica
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full px-4 h-8 text-xs font-medium transition-all ${builderMode === "preview" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            onClick={() => setBuilderMode("preview")}
            title="Pré-visualizar Tema"
          >
            <Eye className="mr-1.5 h-4 w-4" /> Preview
          </Button>
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
          {/* Save status */}
          <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
            {isSaving ? (
              <><Loader2 className="h-3 w-3 animate-spin" /><span>Salvando...</span></>
            ) : hasUnsavedChanges ? (
              <><AlertCircle className="h-3 w-3 text-amber-500" /><span className="text-amber-500">Não salvo</span></>
            ) : (
              <><CheckCircle2 className="h-3 w-3 text-green-500" /><span>Salvo</span></>
            )}
          </div>
          {form.status === "draft" && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" className="rounded-full px-4 h-8 text-xs font-medium" onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Globe className="mr-1.5 h-3 w-3" />}
                Publicar
              </Button>
            </>
          )}
          {form.status === "published" && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="rounded-full px-3 h-8 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="mr-1.5 h-3 w-3" />Publicado
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full px-3 h-8 text-xs font-medium ml-2 border-primary/20 hover:bg-primary/5"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="mr-1.5 h-3 w-3" />
                Compartilhar
              </Button>
            </>
          )}
        </div>

        {builderMode === "preview" ? (
          <div className="flex-1 w-full h-full overflow-hidden relative pt-16 mt-8">
            {/* O FormRenderer toma 100% de width e height baseados no parent. */}
            <FormRenderer 
              form={form} 
              onSubmit={async () => {
                alert("Em modo preview as respostas não são salvas.")
              }} 
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 p-8 pt-24">
            <div className="mx-auto max-w-2xl space-y-4">
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
        )}
      </main>

      {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-80 lg:w-96 flex-shrink-0 border-l bg-card flex flex-col overflow-hidden">
        <div className="flex h-14 items-center border-b px-4">
          {builderMode === "logic" ? (
            <><Zap className="mr-2 h-4 w-4 text-muted-foreground" /><h3 className="font-semibold text-sm">Lógica</h3></>
          ) : builderMode === "preview" ? (
            <><Eye className="mr-2 h-4 w-4 text-muted-foreground" /><h3 className="font-semibold text-sm">Visualização</h3></>
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
          ) : builderMode === "preview" ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Eye className="h-8 w-8 mb-4 opacity-20" />
                <p className="text-sm">Você está no <strong className="text-foreground">Modo Preview</strong>.</p>
                <p className="text-xs mt-2">Altere o <b>Tema</b> na barra esquerda para ver as mudanças refletirem na hora.</p>
              </div>
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
                 <Link href={`${shareLink}?preview=1`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-md shadow-sm border text-muted-foreground hover:text-foreground transition-colors">
                   <Globe className="h-3.5 w-3.5" />
                 </Link>
              </div>
              <iframe 
                src={`${shareLink}?preview=1`} 
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
                    <a href={shareLink} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Abrir formulário em nova aba
                    </a>
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

// ─── Theme Picker Panel ────────────────────────────────────────────────────────

function ThemePickerPanel({
  form,
  onSelect,
  onUpdateLogo,
}: {
  form: Form
  onSelect: (theme: ThemeConfig) => void
  onUpdateLogo: (logo: ThemeConfig["logo"] | undefined) => void
}) {
  const currentThemeId = form.theme.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Custom Themes State
  const [savedThemes, setSavedThemes] = useState<ThemeConfig[]>([])
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  const [newThemeName, setNewThemeName] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("formularios.ia_saved_themes")
    if (stored) {
      try {
        setSavedThemes(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse saved themes", e)
      }
    }
  }, [])

  function saveThemesToStorage(themes: ThemeConfig[]) {
    setSavedThemes(themes)
    localStorage.setItem("formularios.ia_saved_themes", JSON.stringify(themes))
  }

  function handleSaveCurrentTheme() {
    if (!newThemeName.trim()) return
    const newTheme: ThemeConfig = {
      ...form.theme,
      id: `custom-${Date.now()}`,
      logo: undefined // usually we don't save per-form logo in the generic theme unless requested, but let's keep it clean
    }
    // store the name somewhere, maybe in a custom field or just map it.
    // the ThemeConfig type doesn't have a "name" field, but we can override the ID to be the name or use ID as name.
    // For our purposes, the ID acts as the display name in the list.
    newTheme.id = newThemeName.trim()
    
    saveThemesToStorage([...savedThemes, newTheme])
    setIsSavingTheme(false)
    setNewThemeName("")
    onSelect(newTheme) // Switch to it
  }

  function handleDeleteSavedTheme(e: React.MouseEvent, idToRemove: string) {
    e.stopPropagation()
    saveThemesToStorage(savedThemes.filter(t => t.id !== idToRemove))
    if (currentThemeId === idToRemove) {
      onSelect(PRESET_THEMES[0])
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      alert("A imagem não pode exceder 1MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      onUpdateLogo({
        url: base64,
        position: form.theme.logo?.position ?? "center"
      })
    }
    reader.readAsDataURL(file)
  }

  function handleCustomColorChange(key: keyof ThemeConfig["colors"], value: string) {
    onSelect({
      ...form.theme,
      id: "custom",
      colors: { ...form.theme.colors, [key]: value }
    })
  }

  function handleCustomFontChange(key: keyof ThemeConfig["font"], value: string) {
    onSelect({
      ...form.theme,
      id: "custom",
      font: { ...form.theme.font, [key]: value }
    })
  }

  function handleCustomBorderChange(value: string) {
    onSelect({
      ...form.theme,
      id: "custom",
      borderRadius: value
    })
  }

  return (
    <div className="p-4 space-y-8">
      {/* Marca / Logotipo */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Marca
        </p>
        <div className="space-y-3">
          {form.theme.logo?.url ? (
            <div className="relative rounded-xl border bg-card p-4 flex flex-col items-center justify-center gap-4">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-60 hover:opacity-100"
                onClick={() => onUpdateLogo(undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.theme.logo.url} alt="Logo" className="max-h-16 object-contain" />
              
              <div className="w-full">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase text-center">Alinhamento</p>
                <div className="flex bg-muted p-1 rounded-lg gap-1">
                  {(["left", "center", "right"] as const).map((pos) => {
                    const Icon = pos === "left" ? AlignLeftIcon : pos === "center" ? AlignCenter : AlignRight
                    return (
                      <button
                        key={pos}
                        className={cn(
                          "flex-1 flex justify-center items-center py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all",
                          form.theme.logo?.position === pos ? "bg-background text-foreground shadow-sm" : ""
                        )}
                        onClick={() => onUpdateLogo({ ...form.theme.logo!, position: pos })}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Fazer upload do logo</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">JPG ou PNG, máx 1MB</p>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            ref={fileInputRef}
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <Separator />

      {/* Aparência */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Aparência
        </p>

        <Tabs defaultValue={currentThemeId === "custom" ? "custom" : "presets"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="presets" className="text-xs">Prontos</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Personalizar</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-6 mt-0">
            {savedThemes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pt-1">
                  Seus Temas Salvos
                </h4>
                <div className="space-y-2">
                  {savedThemes.map((theme) => {
                    const isActive = theme.id === currentThemeId
                    return (
                      <div key={theme.id} className="relative group">
                        <button
                          onClick={() => onSelect(theme)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:shadow-sm",
                            isActive
                              ? "border-primary ring-1 ring-primary bg-accent/5"
                              : "border-border bg-card"
                          )}
                        >
                          <div
                            className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: theme.colors.bg }}
                          >
                            <div
                              className="h-6 w-6 rounded-md shadow-sm"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-8">
                            <p className="text-sm font-semibold truncate">{theme.id}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {theme.font.heading} · {theme.font.body}
                            </p>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            {[theme.colors.bg, theme.colors.card, theme.colors.accent, theme.colors.text].map((c, i) => (
                              <div
                                key={i}
                                className="h-3 w-3 rounded-full border border-black/10 dark:border-white/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteSavedTheme(e, theme.id)}
                          title="Excluir tema"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <Separator className="mt-4 mb-2" />
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Modelos Prontos
              </h4>
              <div className="space-y-2">
                {PRESET_THEMES.map((theme) => {
                  const isActive = theme.id === currentThemeId
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onSelect(theme)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:shadow-sm",
                        isActive
                          ? "border-primary ring-1 ring-primary bg-accent/5"
                          : "border-border bg-card"
                      )}
                    >
                      <div
                        className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: theme.colors.bg }}
                      >
                        <div
                          className="h-6 w-6 rounded-md shadow-sm"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize">{theme.id}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {theme.font.heading} · {theme.font.body}
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {[theme.colors.bg, theme.colors.card, theme.colors.accent, theme.colors.text].map((c, i) => (
                          <div
                            key={i}
                            className="h-3 w-3 rounded-full border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6 mt-0">
            {/* Cores */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Cores
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "bg", label: "Fundo Geral" },
                  { key: "card", label: "Cartão / Form" },
                  { key: "accent", label: "Destaque (Botões)" },
                  { key: "text", label: "Texto Principal" },
                  { key: "muted", label: "Texto Secundário" },
                  { key: "inputBg", label: "Fundo Inputs" },
                ].map((c) => (
                  <div key={c.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 rounded-md overflow-hidden border shadow-sm shrink-0">
                        <input
                          type="color"
                          value={form.theme.colors[c.key as keyof ThemeConfig["colors"]] || "#ffffff"}
                          onChange={(e) => handleCustomColorChange(c.key as keyof ThemeConfig["colors"], e.target.value)}
                          className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer appearance-none border-0 bg-transparent p-0"
                        />
                      </div>
                      <Input
                        type="text"
                        value={form.theme.colors[c.key as keyof ThemeConfig["colors"]] || ""}
                        onChange={(e) => handleCustomColorChange(c.key as keyof ThemeConfig["colors"], e.target.value)}
                        className="h-8 text-xs font-mono px-2 uppercase"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tipografia */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TypeIcon className="h-3.5 w-3.5" /> Tipografia
              </h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Títulos</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.theme.font.heading}
                    onChange={(e) => handleCustomFontChange("heading", e.target.value)}
                  >
                    {AVAILABLE_FONTS.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Corpo do Texto</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.theme.font.body}
                    onChange={(e) => handleCustomFontChange("body", e.target.value)}
                  >
                     {AVAILABLE_FONTS.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bordas */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PaintBucket className="h-3.5 w-3.5" /> Estilo (Bordas)
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "0px", value: "0px" },
                    { label: "4px", value: "4px" },
                    { label: "8px", value: "8px" },
                    { label: "12px", value: "12px" },
                    { label: "16px", value: "16px" },
                    { label: "24px", value: "24px" },
                    { label: "Pílula", value: "99px" },
                  ].map((border) => (
                    <button
                      key={border.value}
                      className={cn(
                        "h-8 text-[11px] font-medium rounded-md border transition-colors",
                        form.theme.borderRadius === border.value 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-card text-foreground hover:bg-muted"
                      )}
                      onClick={() => handleCustomBorderChange(border.value)}
                    >
                      {border.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Valor customizado:</span>
                  <Input 
                    type="text" 
                    value={form.theme.borderRadius} 
                    onChange={(e) => handleCustomBorderChange(e.target.value)}
                    className="h-7 w-20 text-xs px-2"
                  />
                </div>
              </div>
            </div>

            <Separator />
            
            {/* Salvar Tema */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Salvar Tema
              </h4>
              {!isSavingTheme ? (
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-9 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => setIsSavingTheme(true)}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" /> Salvar tema atual
                </Button>
              ) : (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <Input
                    placeholder="Nome do tema..."
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    className="text-xs h-8 bg-background"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCurrentTheme()
                      if (e.key === "Escape") setIsSavingTheme(false)
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="text-[11px] h-7 flex-1" 
                      onClick={handleSaveCurrentTheme}
                      disabled={!newThemeName.trim()}
                    >
                      Salvar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[11px] h-7 px-2 text-muted-foreground" 
                      onClick={() => {
                        setIsSavingTheme(false)
                        setNewThemeName("")
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Form Config Panel ─────────────────────────────────────────────────────────

interface FormConfigPanelProps {
  form: Form
  onTitleChange: (t: string) => void
  onDescriptionChange: (d: string) => void
  onSettingsChange: (s: Partial<Form["settings"]>) => void
  onSlugChange: (slug: string) => void
}

function FormConfigPanel({ form, onTitleChange, onDescriptionChange, onSettingsChange, onSlugChange }: FormConfigPanelProps) {
  const [slugError, setSlugError] = useState("")

  function handleSlugChange(raw: string) {
    // Auto-format: lowercase, spaces → hyphens, strip invalid chars
    const formatted = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    onSlugChange(formatted)
    if (formatted.length > 0 && formatted.length < 3) {
      setSlugError("Mínimo de 3 caracteres")
    } else if (formatted.length > 60) {
      setSlugError("Máximo de 60 caracteres")
    } else {
      setSlugError("")
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
        <Input
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Formulário sem título"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[72px] resize-none"
          value={form.description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descrição opcional..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL pública</label>
        <div className={cn("flex items-center rounded-md border bg-background overflow-hidden text-sm", slugError ? "border-destructive" : "border-input")}>
          <span className="px-2 py-2 text-muted-foreground bg-muted border-r border-input text-xs shrink-0">/f/</span>
          <input
            className="flex-1 px-2 py-2 bg-transparent outline-none focus-visible:ring-0 text-sm"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="meu-formulario"
            spellCheck={false}
          />
        </div>
        {slugError ? (
          <p className="text-[11px] text-destructive">{slugError}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground truncate">{origin}/f/{form.slug}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exibição</h4>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Barra de progresso</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mostra % de conclusão</p>
          </div>
          <Switch
            checked={form.settings.showProgressBar}
            onCheckedChange={(v) => onSettingsChange({ showProgressBar: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Numerar perguntas</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ex: "1 →"</p>
          </div>
          <Switch
            checked={form.settings.showQuestionNumbers}
            onCheckedChange={(v) => onSettingsChange({ showQuestionNumbers: v })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conclusão</h4>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mensagem de encerramento</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-none"
            value={form.settings.closeMessage}
            onChange={(e) => onSettingsChange({ closeMessage: e.target.value })}
            placeholder="Sua resposta foi registrada."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Redirecionar para (URL)</label>
          <Input
            type="url"
            value={form.settings.redirectUrl ?? ""}
            onChange={(e) => onSettingsChange({ redirectUrl: e.target.value || null })}
            placeholder="https://exemplo.com/obrigado"
            className="text-sm h-9"
          />
          <p className="text-[11px] text-muted-foreground">Após conclusão, redireciona para esta URL.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notificações</h4>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notificar por e-mail</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ao receber nova resposta</p>
          </div>
          <Switch
            checked={form.settings.notifyOnResponse}
            onCheckedChange={(v) => onSettingsChange({ notifyOnResponse: v })}
          />
        </div>

        {form.settings.notifyOnResponse && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">E-mail para notificação</label>
            <Input
              type="email"
              value={form.settings.notificationEmail ?? ""}
              onChange={(e) => onSettingsChange({ notificationEmail: e.target.value || null })}
              placeholder="seu@email.com"
              className="text-sm h-9"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Webhooks Panel ────────────────────────────────────────────────────────────

function WebhooksPanel({ formId }: { formId: string }) {
  const [webhooks, setWebhooks] = useState<IntegrationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getFormIntegrationsAction(formId)
      .then((rows) => setWebhooks(rows.filter((r) => r.type === "webhook")))
      .finally(() => setIsLoading(false))
  }, [formId])

  function handleCreate() {
    if (!newUrl.trim()) return
    startTransition(async () => {
      const created = await createWebhookAction(formId, newName.trim() || "Webhook", newUrl.trim())
      if (created) {
        setWebhooks((prev) => [...prev, created])
        setNewName("")
        setNewUrl("")
        setShowAdd(false)
      }
    })
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      await toggleIntegrationAction(id, enabled, formId)
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled } : w)))
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIntegrationAction(id, formId)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Webhooks</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">POST ao receber nova resposta</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <Input
            placeholder="Nome (ex: n8n, Zapier)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-sm h-8"
          />
          <Input
            type="url"
            placeholder="https://hooks.exemplo.com/..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="text-sm h-8"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs flex-1" onClick={handleCreate} disabled={!newUrl.trim() || isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <Webhook className="h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Nenhum webhook configurado.</p>
          <p className="text-[11px] mt-1">Adicione uma URL para receber notificações.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => {
            const url = (w.config as { url?: string })?.url ?? ""
            return (
              <div key={w.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className={cn("h-3.5 w-3.5 shrink-0", w.enabled ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-sm font-medium truncate">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={w.enabled}
                      onCheckedChange={(v) => handleToggle(w.id, v)}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(w.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{url}</p>
              </div>
            )
          })}
        </div>
      )}

      <Separator />

      <div className="rounded-lg bg-muted/40 p-3 space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payload enviado</p>
        <pre className="text-[10px] text-muted-foreground leading-relaxed overflow-x-auto">{`{
  "event": "response.completed",
  "formId": "...",
  "responseId": "...",
  "answers": { "questionId": value },
  "submittedAt": "ISO date"
}`}</pre>
      </div>
    </div>
  )
}

// ─── Google Sheets Panel ───────────────────────────────────────────────────────

function GoogleSheetsPanel({ formId }: { formId: string }) {
  const router = useRouter()
  const [integration, setIntegration] = useState<IntegrationRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("")
  const [tabs, setTabs] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState("")
  const [isFetchingTabs, setIsFetchingTabs] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const [isConnecting, startConnectTransition] = useTransition()
  const [tabError, setTabError] = useState("")

  // Detect ?sheets=connected redirect from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("sheets") === "connected" || params.get("sheets") === "error") {
      const url = new URL(window.location.href)
      url.searchParams.delete("sheets")
      router.replace(url.pathname + url.search)
    }
  }, [router])

  // Load existing google_sheets integration
  useEffect(() => {
    getFormIntegrationsAction(formId)
      .then((rows) => {
        const gs = rows.find((r) => r.type === "google_sheets") ?? null
        setIntegration(gs)
        if (gs) {
          const config = gs.config as { spreadsheetId?: string; sheetName?: string }
          if (config.spreadsheetId) setSpreadsheetUrl(config.spreadsheetId)
          if (config.sheetName) setSelectedTab(config.sheetName)
        }
      })
      .finally(() => setIsLoading(false))
  }, [formId])

  function handleConnect() {
    startConnectTransition(async () => {
      const path = await getGoogleSheetsAuthUrlAction(formId)
      window.location.href = path
    })
  }

  async function handleFetchTabs() {
    if (!spreadsheetUrl.trim()) return
    setTabError("")
    setIsFetchingTabs(true)
    try {
      const result = await listSheetTabsAction(formId, spreadsheetUrl.trim())
      setTabs(result)
      if (result.length > 0 && !selectedTab) setSelectedTab(result[0])
    } catch (err) {
      setTabError(err instanceof Error ? err.message : "Erro ao carregar abas.")
    } finally {
      setIsFetchingTabs(false)
    }
  }

  function handleSave() {
    if (!spreadsheetUrl.trim() || !selectedTab) return
    startSaveTransition(async () => {
      await configureGoogleSheetsAction(formId, spreadsheetUrl.trim(), selectedTab)
      // Refresh integration state
      const rows = await getFormIntegrationsAction(formId)
      const gs = rows.find((r) => r.type === "google_sheets") ?? null
      setIntegration(gs)
    })
  }

  function handleDisconnect() {
    startSaveTransition(async () => {
      await disconnectGoogleSheetsAction(formId)
      setIntegration(null)
      setSpreadsheetUrl("")
      setSelectedTab("")
      setTabs([])
    })
  }

  const config = integration?.config as { spreadsheetId?: string; sheetName?: string } | undefined
  const isConfigured = integration?.enabled && config?.spreadsheetId && config?.sheetName

  return (
    <div className="p-4 space-y-4 border-t">
      <div className="flex items-center gap-2">
        <Table2 className="h-4 w-4 text-green-600" />
        <div>
          <p className="text-sm font-semibold">Google Sheets</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Enviar respostas para uma planilha</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : isConfigured ? (
        // ── State 3: Configured ──
        <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Planilha configurada</p>
              <p className="text-[11px] text-muted-foreground truncate">Aba: <span className="font-medium">{config!.sheetName}</span></p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive w-full"
            onClick={handleDisconnect}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Desconectar
          </Button>
        </div>
      ) : integration ? (
        // ── State 2: Connected, not yet configured ──
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Conta Google conectada
          </div>
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <Input
                placeholder="URL ou ID da planilha"
                value={spreadsheetUrl}
                onChange={(e) => { setSpreadsheetUrl(e.target.value); setTabs([]); setSelectedTab("") }}
                className="text-xs h-8 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={handleFetchTabs}
                disabled={!spreadsheetUrl.trim() || isFetchingTabs}
              >
                {isFetchingTabs ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {tabError && (
              <p className="text-[11px] text-destructive">{tabError}</p>
            )}
            {tabs.length > 0 && (
              <select
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {tabs.map((tab) => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 text-xs flex-1"
                onClick={handleSave}
                disabled={!spreadsheetUrl.trim() || !selectedTab || isSaving}
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={handleDisconnect}
                disabled={isSaving}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // ── State 1: Not connected ──
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs gap-2"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Conectar com Google
        </Button>
      )}
    </div>
  )
}

// ─── Question Card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function QuestionCard({ question, index, isSelected, onSelect, onDelete, onDuplicate }: QuestionCardProps) {
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

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({ question }: { question: Question }) {
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

// ─── Options Editor ────────────────────────────────────────────────────────────

function OptionsEditor({ question }: { question: Question }) {
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
    </div>
  )
}

// ─── Logic Panel ──────────────────────────────────────────────────────────────

const OPERATOR_LABELS: Record<LogicOperator, string> = {
  equals: "é igual a",
  not_equals: "não é igual a",
  contains: "contém",
  not_contains: "não contém",
  greater_than: "é maior que",
  less_than: "é menor que",
  is_empty: "está vazia",
  is_not_empty: "não está vazia",
}

function getOperatorsForType(type: QuestionType): LogicOperator[] {
  switch (type) {
    case "multiple_choice":
    case "dropdown":
      return ["equals", "not_equals", "is_empty", "is_not_empty"]
    case "checkbox":
      return ["contains", "not_contains", "is_empty", "is_not_empty"]
    case "yes_no":
      return ["equals", "not_equals"]
    case "number":
    case "rating":
    case "scale":
    case "nps":
      return ["equals", "not_equals", "greater_than", "less_than", "is_empty", "is_not_empty"]
    default:
      return ["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"]
  }
}

function LogicPanel({ question, allQuestions }: { question: Question; allQuestions: Question[] }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const rules = question.logicRules ?? []

  function addRule() {
    const newRule: LogicRule = {
      id: crypto.randomUUID(),
      condition: { questionId: question.id, operator: "equals", value: "" },
      action: { type: "jump_to", targetQuestionId: undefined },
    }
    updateQuestion(question.id, { logicRules: [...rules, newRule] })
  }

  function updateRule(ruleId: string, partial: Partial<LogicRule>) {
    updateQuestion(question.id, {
      logicRules: rules.map((r) => (r.id === ruleId ? { ...r, ...partial } : r)),
    })
  }

  function deleteRule(ruleId: string) {
    updateQuestion(question.id, { logicRules: rules.filter((r) => r.id !== ruleId) })
  }

  const otherQuestions = allQuestions.filter((q) => q.id !== question.id)

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Regras de lógica</p>
        <p className="text-[11px] text-muted-foreground">Controle o fluxo baseado na resposta desta pergunta.</p>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Nenhuma regra definida.</p>
          <p className="text-[11px] mt-1">Adicione uma regra para criar fluxos dinâmicos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <RuleEditor
              key={rule.id}
              index={i}
              rule={rule}
              question={question}
              otherQuestions={otherQuestions}
              onUpdate={(partial) => updateRule(rule.id, partial)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addRule}>
        <Plus className="mr-1.5 h-3 w-3" /> Adicionar regra
      </Button>
    </div>
  )
}

function RuleEditor({
  index,
  rule,
  question,
  otherQuestions,
  onUpdate,
  onDelete,
}: {
  index: number
  rule: LogicRule
  question: Question
  otherQuestions: Question[]
  onUpdate: (partial: Partial<LogicRule>) => void
  onDelete: () => void
}) {
  const operators = getOperatorsForType(question.type)
  const showValue = !["is_empty", "is_not_empty"].includes(rule.condition.operator)
  const isNumeric = ["number", "rating", "scale", "nps"].includes(question.type)
  const isChoice = ["multiple_choice", "dropdown"].includes(question.type)
  const isYesNo = question.type === "yes_no"
  const options = question.properties.options ?? []

  function updateCondition(partial: Partial<LogicRule["condition"]>) {
    onUpdate({ condition: { ...rule.condition, ...partial } })
  }

  function updateAction(partial: Partial<LogicRule["action"]>) {
    onUpdate({ action: { ...rule.action, ...partial } })
  }

  const selectClass = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regra {index + 1}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* WHEN */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quando a resposta</p>
        <select className={selectClass} value={rule.condition.operator}
          onChange={(e) => updateCondition({ operator: e.target.value as LogicOperator, value: "" })}>
          {operators.map((op) => (
            <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
          ))}
        </select>
        {showValue && (
          isYesNo ? (
            <select className={selectClass} value={String(rule.condition.value)}
              onChange={(e) => updateCondition({ value: e.target.value })}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          ) : isChoice && options.length > 0 ? (
            <select className={selectClass} value={String(rule.condition.value)}
              onChange={(e) => updateCondition({ value: e.target.value })}>
              <option value="">Escolha uma opção...</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input type={isNumeric ? "number" : "text"} className={selectClass}
              placeholder="Valor..."
              value={String(rule.condition.value)}
              onChange={(e) => updateCondition({ value: isNumeric ? Number(e.target.value) : e.target.value })}
            />
          )
        )}
      </div>

      {/* THEN */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Então</p>
        <select className={selectClass} value={rule.action.type}
          onChange={(e) => updateAction({ type: e.target.value as LogicRule["action"]["type"], targetQuestionId: undefined })}>
          <option value="jump_to">Pular para</option>
          <option value="end_form">Encerrar formulário</option>
        </select>
        {rule.action.type === "jump_to" && (
          <select className={selectClass} value={rule.action.targetQuestionId ?? ""}
            onChange={(e) => updateAction({ targetQuestionId: e.target.value || undefined })}>
            <option value="">Escolha a pergunta destino...</option>
            {otherQuestions.map((q, i) => (
              <option key={q.id} value={q.id}>
                {i + 1}. {(q.title || "(sem título)").slice(0, 40)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
