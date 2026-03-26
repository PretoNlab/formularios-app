"use client"

import { useState, useRef, useTransition } from "react"
import { Loader2, ImageIcon, X, CheckCircle2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { updateBrandKitAction } from "@/app/actions/workspace"
import { AVAILABLE_FONTS, PRESET_THEMES } from "@/config/themes"
import type { WorkspaceBrandKit } from "@/lib/db/schema"

const BORDER_RADIUS_OPTIONS = [
  { label: "Nenhum", value: "0px" },
  { label: "Suave", value: "6px" },
  { label: "Médio", value: "12px" },
  { label: "Arredondado", value: "20px" },
]

const DEFAULT_COLORS = PRESET_THEMES[0].colors

export function BrandKitClient({ initial }: { initial: WorkspaceBrandKit | null }) {
  const [kit, setKit] = useState<WorkspaceBrandKit>(
    initial ?? {
      colors: { ...DEFAULT_COLORS },
      font: { heading: "Fraunces", body: "DM Sans" },
      borderRadius: "12px",
    }
  )
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setKit((prev) => ({ ...prev, logoUrl: url, logoPosition: prev.logoPosition ?? "center" }))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao fazer upload do logo.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  function handleSave() {
    startTransition(async () => {
      await updateBrandKitAction(kit)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function setColor(key: keyof NonNullable<WorkspaceBrandKit["colors"]>, value: string) {
    setKit((prev) => ({
      ...prev,
      colors: { ...(prev.colors ?? DEFAULT_COLORS), [key]: value },
    }))
  }

  function setFont(key: "heading" | "body", value: string) {
    setKit((prev) => ({
      ...prev,
      font: { ...(prev.font ?? { heading: "Fraunces", body: "DM Sans" }), [key]: value },
    }))
  }

  const colors = kit.colors ?? DEFAULT_COLORS
  const font = kit.font ?? { heading: "Fraunces", body: "DM Sans" }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Logotipo</h2>
        </div>
        <Separator />

        {kit.logoUrl ? (
          <div className="relative rounded-xl border bg-muted/20 p-6 flex flex-col items-center gap-4 max-w-xs">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
              onClick={() => setKit((prev) => ({ ...prev, logoUrl: undefined }))}
            >
              <X className="h-3 w-3" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kit.logoUrl} alt="Logo da marca" className="max-h-20 object-contain" />
            <div className="w-full space-y-1">
              <Label className="text-xs text-muted-foreground">Alinhamento padrão</Label>
              <div className="flex gap-2 mt-1">
                {(["left", "center", "right"] as const).map((pos) => (
                  <Button
                    key={pos}
                    size="sm"
                    variant={kit.logoPosition === pos ? "secondary" : "outline"}
                    className="flex-1 text-xs h-8"
                    onClick={() => setKit((prev) => ({ ...prev, logoPosition: pos }))}
                  >
                    {pos === "left" ? "Esq." : pos === "center" ? "Centro" : "Dir."}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center gap-2 max-w-xs transition-colors ${isUploadingLogo ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/30 cursor-pointer"}`}
            onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {isUploadingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
            </div>
            <p className="text-sm font-medium">{isUploadingLogo ? "Enviando..." : "Fazer upload do logo"}</p>
            <p className="text-xs text-muted-foreground">PNG, JPG ou SVG, máx 2MB</p>
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden"
          ref={fileInputRef}
          onChange={handleLogoUpload}
        />
      </section>

      {/* Cores */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Cores</h2>
        <Separator />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(
            [
              { key: "bg", label: "Fundo" },
              { key: "card", label: "Card" },
              { key: "accent", label: "Destaque" },
              { key: "text", label: "Texto" },
              { key: "muted", label: "Sutil" },
              { key: "inputBg", label: "Input" },
            ] as { key: keyof NonNullable<WorkspaceBrandKit["colors"]>; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key] ?? colors.card}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="h-8 w-8 rounded-md border cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-muted-foreground">{colors[key] ?? colors.card}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tipografia */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Tipografia</h2>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          {(["heading", "body"] as const).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground capitalize">
                {key === "heading" ? "Títulos" : "Corpo de texto"}
              </Label>
              <select
                value={font[key]}
                onChange={(e) => setFont(key, e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Arredondamento de bordas</h2>
        <Separator />
        <div className="flex gap-2">
          {BORDER_RADIUS_OPTIONS.map(({ label, value }) => (
            <Button
              key={value}
              variant={kit.borderRadius === value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setKit((prev) => ({ ...prev, borderRadius: value }))}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Salvo!</>
          ) : (
            "Salvar Brand Kit"
          )}
        </Button>
      </div>
    </div>
  )
}
