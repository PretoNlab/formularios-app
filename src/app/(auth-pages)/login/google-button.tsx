"use client"

import { Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function GoogleLoginButton({ next }: { next: string }) {
  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
      <Chrome className="mr-2 h-4 w-4" />
      Google
    </Button>
  )
}
