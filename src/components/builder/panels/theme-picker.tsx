"use client"

import { useState, useRef, useEffect } from "react"
import {
  AlignLeft as AlignLeftIcon, AlignCenter, AlignRight, X,
  PaintBucket, Palette, Type as TypeIcon, Loader2, Plus, Trash2,
  Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Form, ThemeConfig } from "@/lib/types/form"
import type { WorkspaceBrandKit } from "@/lib/db/schema"
import { PRESET_THEMES, AVAILABLE_FONTS } from "@/config/themes"
import { cn } from "@/lib/utils"

export function ThemePickerPanel({
  form,
  onSelect,
  onUpdateLogo,
  workspaceBrandKit,
}: {
  form: Form
  onSelect: (theme: ThemeConfig) => void
  onUpdateLogo: (logo: ThemeConfig["logo"] | undefined) => void
  workspaceBrandKit: WorkspaceBrandKit | null
}) {
  const currentThemeId = form.theme.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleApplyBrandKit() {
    if (!workspaceBrandKit) return
    const updated: ThemeConfig = {
      ...form.theme,
      ...(workspaceBrandKit.colors ? { colors: workspaceBrandKit.colors } : {}),
      ...(workspaceBrandKit.font ? { font: workspaceBrandKit.font } : {}),
      ...(workspaceBrandKit.borderRadius ? { borderRadius: workspaceBrandKit.borderRadius } : {}),
    }
    onSelect(updated)
    if (workspaceBrandKit.logoUrl) {
      onUpdateLogo({ url: workspaceBrandKit.logoUrl, position: workspaceBrandKit.logoPosition ?? "center" })
    }
  }

  // Custom Themes State
  const [savedThemes, setSavedThemes] = useState<ThemeConfig[]>([])
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  const [newThemeName, setNewThemeName] = useState("")
  const [appearanceTab, setAppearanceTab] = useState<"presets" | "custom">(
    currentThemeId === "custom" ? "custom" : "presets"
  )

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
    setAppearanceTab("presets") // Show saved themes list after saving
    onSelect(newTheme)
  }

  function handleDeleteSavedTheme(e: React.MouseEvent, idToRemove: string) {
    e.stopPropagation()
    saveThemesToStorage(savedThemes.filter(t => t.id !== idToRemove))
    if (currentThemeId === idToRemove) {
      onSelect(PRESET_THEMES[0])
    }
  }

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem não pode exceder 2MB.")
      return
    }

    setIsUploadingLogo(true)
    try {
      const data = new FormData()
      data.append("file", file)
      const res = await fetch("/api/upload/theme-asset", { method: "POST", body: data })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro no upload")
      }
      const { url } = await res.json()
      onUpdateLogo({
        url,
        position: form.theme.logo?.position ?? "center"
      })
    } catch (err: any) {
      alert(err.message || "Erro ao fazer upload do logo.")
    } finally {
      setIsUploadingLogo(false)
    }
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
      {/* Brand Kit */}
      {workspaceBrandKit && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Brand Kit</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aplica as cores, fontes e logo da sua marca a este formulário.
          </p>
          <Button size="sm" className="w-full" onClick={handleApplyBrandKit}>
            Aplicar Brand Kit
          </Button>
        </div>
      )}

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
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center gap-2",
                isUploadingLogo ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
              )}
              onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {isUploadingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">{isUploadingLogo ? "Enviando..." : "Fazer upload do logo"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">JPG ou PNG, máx 2MB</p>
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

        <Tabs value={appearanceTab} onValueChange={(v) => setAppearanceTab(v as "presets" | "custom")} className="w-full">
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
