"use client"

import { useState, useTransition } from "react"
import { Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { togglePublicAnalyticsAction } from "@/app/actions/responses"

export function PublicShareDialog({
  formId,
  initialIsPublic,
  initialShareToken,
}: {
  formId: string
  initialIsPublic: boolean
  initialShareToken: string | null
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const publicUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/report/${shareToken}`
    : ""

  function handleToggle(checked: boolean) {
    setIsPublic(checked)
    startTransition(async () => {
      const res = await togglePublicAnalyticsAction(formId, checked)
      if (res.success && res.data) {
        setShareToken(res.data.shareToken)
        if (!checked) {
          setShareToken(null)
        }
      } else {
        // Revert on error
        setIsPublic(!checked)
      }
    })
  }

  function copyLink() {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relatório Público</DialogTitle>
          <DialogDescription>
            Compartilhe os resultados do formulário publicamente com um link exclusivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Acesso Público</label>
              <p className="text-xs text-muted-foreground">
                Qualquer pessoa com o link poderá visualizar o relatório.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
          </div>

          {isPublic && shareToken && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Link do Relatório</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={publicUrl} className="flex-1" />
                <Button variant="secondary" onClick={copyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
