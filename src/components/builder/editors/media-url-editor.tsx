"use client"

import { useState, useRef } from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBuilderStore } from "@/stores/builder-store"
import type { Question } from "@/lib/types/form"

export function MediaUrlEditor({ question }: { question: Question }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasMedia = !!question.properties.imageUrl || !!question.properties.videoUrl

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (file.type.startsWith("video/")) {
        updateQuestion(question.id, {
          properties: { ...question.properties, videoUrl: url, imageUrl: undefined },
        })
      } else {
        updateQuestion(question.id, {
          properties: { ...question.properties, imageUrl: url, videoUrl: undefined },
        })
      }
    } catch (err: any) {
      alert(err.message || "Erro ao fazer upload da mídia.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    updateQuestion(question.id, {
      properties: { ...question.properties, imageUrl: undefined, videoUrl: undefined },
    })
  }

  return (
    <div className="space-y-4">
      {hasMedia ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mídia atual</label>
          <div className="relative group rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[120px] p-2">
            {question.properties.videoUrl ? (
              <video src={question.properties.videoUrl} className="max-w-full max-h-48 object-contain" muted controls playsInline />
            ) : (
              <img src={question.properties.imageUrl} alt="Mídia" className="max-w-full max-h-48 object-contain rounded-md" />
            )}
            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Trocar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemove}>
                Remover
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
           <label className="text-xs font-medium text-muted-foreground">Adicionar mídia</label>
           <Button
             variant="outline"
             className="w-full h-24 border-dashed"
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
           >
             {isUploading ? (
               <div className="flex flex-col items-center text-muted-foreground">
                 <Loader2 className="h-4 w-4 mb-2 animate-spin" />
                 <span className="text-xs">Enviando...</span>
               </div>
             ) : (
               <div className="flex flex-col items-center text-muted-foreground">
                 <Upload className="h-4 w-4 mb-2" />
                 <span className="text-xs">Clique para fazer upload</span>
                 <span className="text-[10px] mt-0.5">JPG, PNG, GIF, MP4 ou WEBM (máx 10MB)</span>
               </div>
             )}
           </Button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
      />
    </div>
  )
}
