"use client"

import { useState, useRef } from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBuilderStore } from "@/stores/builder-store"
import type { Question } from "@/lib/types/form"

export function DownloadUrlEditor({ question }: { question: Question }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo excede o limite de 10MB.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload/completion-file", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro no upload")
      }

      const { url } = await res.json()
      updateQuestion(question.id, {
        properties: { ...question.properties, downloadUrl: url },
      })
    } catch (err: any) {
      alert(err.message || "Erro ao fazer upload do arquivo.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Arquivo</label>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
          {isUploading ? "Enviando..." : "Fazer Upload"}
        </Button>
      </div>
      <Input
        value={question.properties.downloadUrl ?? ""}
        onChange={(e) =>
          updateQuestion(question.id, { properties: { ...question.properties, downloadUrl: e.target.value || undefined } })
        }
        placeholder="https://... ou faça upload"
        className="text-sm h-9"
        type="url"
        disabled={isUploading}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        accept=".pdf,.doc,.docx,.zip,image/png,image/jpeg,image/webp"
      />
    </div>
  )
}
