"use client"

import { useState } from "react"
import { Shield, Mail, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getAppUrl } from "@/lib/utils"

export function SecuritySection({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleResetRequest() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError("Erro ao enviar e-mail. Tente novamente.")
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <section className="rounded-xl border bg-card p-6 space-y-5 mt-6">
      <div className="flex items-center gap-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Segurança</h2>
      </div>
      <div className="h-px bg-border" />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Alterar senha</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enviaremos um link de redefinição para <strong>{email}</strong>.
          </p>
        </div>
        {sent ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            E-mail enviado
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetRequest} 
            disabled={loading}
            className="h-9"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Mail className="h-3.5 w-3.5 mr-2" />}
            Redefinir senha
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </section>
  )
}
