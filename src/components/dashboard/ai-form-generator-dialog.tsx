"use client"

import { useState, useTransition } from "react"
import { Sparkles, Loader2, Camera, FileUp, ChevronRight, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateFormFromImageAction } from "@/app/actions/ai"
import { useRouter } from "next/navigation"

export function AiFormGeneratorDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  async function handleGenerate() {
    if (!file) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const result = await generateFormFromImageAction(formData)
        if (result.success && result.data) {
          setOpen(false)
          router.push(`/builder/${result.data.formId}`)
        } else {
          alert(result.error?.message || "Erro ao gerar formulário.")
        }
      } catch (error) {
        alert("Erro inesperado ao processar imagem.")
      }
    })
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="rounded-full gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Criar com IA (Foto/PDF)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wand2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Smart Builder IA</DialogTitle>
            <DialogDescription className="text-center">
              Tire uma foto de um formulário impresso ou envie um PDF/Print. Nossa IA vai transformar em um formulário digital em segundos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!preview ? (
              <Label 
                htmlFor="ai-upload" 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors border-primary/20 bg-primary/5"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-10 h-10 mb-3 text-primary/40" />
                  <p className="mb-2 text-sm font-semibold">Clique para enviar ou tirar foto</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou PDF (Max 10MB)</p>
                </div>
                <Input 
                  id="ai-upload" 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </Label>
            ) : (
              <div className="relative group">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-2xl border" 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  Trocar imagem
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              className="w-full rounded-full gap-2 h-11 text-base font-semibold shadow-lg shadow-primary/20"
              disabled={!file || isPending}
              onClick={handleGenerate}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mágica acontecendo...
                </>
              ) : (
                <>
                  Gerar Formulário Digital
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
